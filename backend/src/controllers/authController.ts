import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { signupSchema } from '../utils/authSchemas';
import { hashPassword } from '../utils/hash';
import { generateAccessToken, verifyRefreshToken, generateRefreshToken } from '../utils/jwt';
import { comparePassword } from '../utils/hash'; // add this import at the top
import { loginSchema } from '../utils/authSchemas'; // add this import too
import type { AuthenticatedRequest } from '../middlewares/authenticate';


// signup
export async function signup(req: Request, res: Response) {
  try {
    // Step 1: Validate incoming data against our Zod schema.
    // If anything fails (bad email, short password, passwords don't match), stop here.
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    // Only pull out the fields we actually need — confirmPassword already
    // did its job during validation and is discarded here.
    const { name, email, password } = parsed.data;

    // Step 2: Check if this email is already registered.
    // Prevents duplicate accounts with the same email.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Step 3: Hash the password before it ever touches the database.
    // We never store plain text passwords.
    const hashedPassword = await hashPassword(password);

    // Step 4: Create the actual user record in Postgres via Prisma.
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Step 5: Generate a JWT containing only the user's id and role —
    // never anything sensitive like password or email.
    
    // Step 6: Store the token in an httpOnly cookie.
    // httpOnly means JavaScript on the page CANNOT read this cookie —
    // this is what protects against token theft via XSS attacks.


    // Step 5: Generate BOTH tokens.
    // Access token: short-lived, used for normal requests.
    // Refresh token: long-lived, used only to get a new access token later.
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion, // starts at 0 for a brand new user
    });

    // Step 6: Store both tokens in separate httpOnly cookies.
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Step 7: Respond with safe public user info only.
    // Notice: password (even hashed) is never sent back in the response.
    return res.status(201).json({
      message: 'Signup successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    // Catch-all for anything unexpected (DB connection issues, etc.)
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}


// login
export async function login(req: Request, res: Response) {
  try {
    // Step 1: Validate incoming login data (just email + password format)
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    // Step 2: Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Step 3: If no user found, OR password doesn't match — return the SAME generic error.
    // Important: never reveal whether it was the email or password that was wrong —
    // that distinction helps attackers guess valid emails (user enumeration).
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Step 4: Credentials are valid — issue BOTH tokens.
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Step 5: Respond with safe public info only
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// A simple "who am I" route — useful later for the frontend too,
// to check if a user is logged in and get their role without re-logging-in.
export async function getMe(req: AuthenticatedRequest, res: Response) {
  // req.user was attached by the `authenticate` middleware — if we got this far,
  // the token was valid.
  return res.status(200).json({ user: req.user });
}

// A test route that ONLY an OWNER should be able to reach.
// This exists purely to confirm authorize('OWNER') actually blocks customers.
export async function ownerOnlyTest(req: AuthenticatedRequest, res: Response) {
  return res.status(200).json({ message: 'You are an owner, access granted.' });
}

// Logout simply clears the cookie holding the JWT.
// There's no "session" stored anywhere server-side to delete —
// the token itself IS the proof of login, so removing it from the browser is enough.
export async function logout(req: Request, res: Response) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({ message: 'Logged out successfully' });
}

// Refresh endpoint

export async function refresh(req: Request, res: Response) {
  try {
    // Step 1: Read the refresh token from its cookie.
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Step 2: Verify it's valid and not expired/tampered with.
    const decoded = verifyRefreshToken(token);

    // Step 3: Look up the actual user — we need their CURRENT tokenVersion
    // to compare against what's inside this token.
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Step 4: THE CRITICAL CHECK — does the tokenVersion in this token
    // match the user's CURRENT tokenVersion in the database?
    // If they don't match, this refresh token has already been rotated out
    // (or manually invalidated) — reject it even though the JWT itself is "valid."
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Refresh token has been invalidated' });
    }

    // Step 5: Bump the tokenVersion — this is the "rotation" part.
    // The OLD refresh token (the one just used) becomes permanently invalid
    // the moment this update happens, even though it hasn't expired yet.
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    // Step 6: Issue a BRAND NEW pair of tokens with the updated version.
    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      tokenVersion: updatedUser.tokenVersion,
    });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      
    });

    return res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    // Covers: expired refresh token, invalid signature, tampered token, etc.
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}