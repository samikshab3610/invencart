import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
// Using a separate secret for refresh tokens means even if one secret
// ever leaks, the other token type stays safe.
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export interface TokenPayload {
  userId: string;
  role: 'CUSTOMER' | 'OWNER';
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenVersion: number;
}

// Short-lived — used to access protected routes.
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Long-lived — used ONLY to request a new access token.
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  // Throws an error automatically if invalid/expired — caller must catch it.
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
}