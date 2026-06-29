import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate';

// This is a "middleware factory" — a function that RETURNS a middleware.
// That's why we can use it like: authorize('OWNER') instead of just authorize
// — it lets us reuse the same logic for different allowed roles on different routes.
export function authorize(...allowedRoles: Array<'CUSTOMER' | 'OWNER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // This middleware ALWAYS runs after `authenticate`, so req.user should already exist.
    // If it doesn't, something's wrong with how routes were set up.
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the logged-in user's role is in the list of roles allowed for this route.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }

    // Role is allowed — continue to the actual route logic.
    next();
  };
}