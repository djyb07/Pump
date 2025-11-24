import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, googleCallback } from '../controllers/authController';
import passport from 'passport';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Debug route
router.get('/test', (req, res) => {
    console.log('Hit /api/auth/test');
    res.send('Auth route test working');
});

console.log('Registering /google route');
router.get('/google', (req, res, next) => {
    console.log('Hit /google route');
    next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

export default router;
