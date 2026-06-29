import { Router } from 'express';
import { signup, login, logout, refresh, getMe, ownerOnlyTest } from '../controllers/authController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { loginRateLimiter } from '../middlewares/rateLimiter';


const router = Router();

router.post('/signup', signup);
router.post('/login', loginRateLimiter, login); // rate limiter runs BEFORE the login controller
router.post('/logout', logout);
router.post('/refresh', refresh);


// Protected: must be logged in (any role) to reach this
router.get('/me', authenticate, getMe);

// Protected: must be logged in AND be an OWNER to reach this
router.get('/owner-only-test', authenticate, authorize('OWNER'), ownerOnlyTest);

export default router;