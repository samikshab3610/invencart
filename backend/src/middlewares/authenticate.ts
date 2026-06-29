import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

// We extend Express's Request type so TypeScript knows
// req.user will exist on requests that pass through this middleware.
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'CUSTOMER' | 'OWNER';
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Step 1: Read the token from the httpOnly cookie (set during signup/login).
    const token = req.cookies?.accessToken;

    if (!token) {
      // No token at all — definitely not logged in.
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Step 2: Verify the token is valid and not expired/tampered with.
    // jwt.verify throws an error automatically if the token is invalid.
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'CUSTOMER' | 'OWNER' };

    // Step 3: Attach the decoded user info to the request object,
    // so every controller after this middleware can access req.user.
    req.user = { userId: decoded.userId, role: decoded.role };

    // Step 4: Everything checks out — let the request continue to the actual route.
    next();
  } catch (error) {
    // Token missing, expired, or tampered with — reject the request.
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}