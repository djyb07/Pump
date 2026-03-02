import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, googleCallback, getMe, updateProfile } from '../controllers/authController';
import passport from 'passport';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
} from '../validation/authSchemas';

const router = Router();

// ─── Public Auth Routes (rate-limited + Zod-validated) ───────────────────────
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// ─── Authenticated User Profile ─────────────────────────────────────────────
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);

// ─── Google OAuth ────────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

export default router;
