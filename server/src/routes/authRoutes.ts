import { Router, Request, Response } from 'express';
import { register, login, forgotPassword, resetPassword, googleCallback, exchangeOAuthCode, getMe, updateProfile } from '../controllers/authController';
import passport from 'passport';
import { isGoogleOAuthConfigured } from '../config/passport';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    exchangeOAuthCodeSchema,
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

// ─── Exchange a one-time OAuth code for a token (see oauthCodeService) ───────
// Not behind authLimiter: this is the tail of a successful login, and 5/15min
// would lock users out of repeat sign-ins. The global apiLimiter still applies,
// and the code itself is 256-bit and single-use.
router.post('/oauth/exchange', validate(exchangeOAuthCodeSchema), exchangeOAuthCode);

// ─── Google OAuth (only mounted when credentials are configured) ─────────────
// passport.authenticate('google') throws "Unknown authentication strategy" if
// the strategy was never registered, so serve an explicit 503 instead.
if (isGoogleOAuthConfigured) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    router.get(
        '/google/callback',
        passport.authenticate('google', { session: false, failureRedirect: '/login' }),
        googleCallback
    );
} else {
    const notConfigured = (_req: Request, res: Response) => {
        res.status(503).json({ message: 'Google sign-in is not configured on this server' });
    };
    router.get('/google', notConfigured);
    router.get('/google/callback', notConfigured);
}

export default router;
