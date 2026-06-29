import rateLimit from 'express-rate-limit';

// Limits login attempts to prevent brute-force password guessing.
// After 5 failed/total attempts within 15 minutes from the same IP,
// further attempts are blocked until the window resets.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true, // returns rate limit info in response headers
  legacyHeaders: false,
});