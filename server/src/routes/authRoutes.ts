import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, googleCallback, getMe, updateProfile } from '../controllers/authController';
import passport from 'passport';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply rate limiting to auth routes to prevent brute force attacks
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated user profile (live stats)
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

export default router;

