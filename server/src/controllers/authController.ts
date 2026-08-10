/**
 * Authentication Controller
 *
 * Handles user registration, login, password reset, Google OAuth callback,
 * profile retrieval, and profile updates.
 *
 * SECURITY NOTES:
 * - All request bodies are pre-validated by Zod middleware at the route level.
 *   Controllers receive already-parsed, typed data — no manual validation needed.
 * - Responses explicitly select safe fields — password hashes are NEVER returned.
 * - bcrypt salt rounds are hardcoded to exactly 10 (OWASP recommendation).
 * - Unhandled errors propagate to the global error handler (Express 5 async support).
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendPasswordResetEmail } from '../services/emailService';
import { issueOAuthCode, redeemOAuthCode } from '../services/oauthCodeService';
import { issueAccessToken, isWithinMaxSessionAge } from '../services/tokenService';
import { getJwtSecret } from '../config/validateEnv';

/** Exact bcrypt salt rounds — do not change without security review */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Fields safe to return in user-facing API responses.
 * Centralised here to prevent accidental leakage of password hashes
 * or other DB-internal fields.
 */
const SAFE_USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    avatarUrl: true,
    totalWorkouts: true,
    currentStreak: true,
} as const;

// ─── Register ────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
    // Body already validated by Zod middleware (registerSchema)
    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    // Hash password with exactly 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
        },
        select: SAFE_USER_SELECT,
    });

    res.status(201).json({
        message: 'User registered successfully',
        user,
    });
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
    // Body already validated by Zod middleware (loginSchema)
    const { email, password } = req.body;

    // Find user — need password for comparison, but do NOT return it
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

    // Compare password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

    // Generate JWT — minimal claims (userId + authTime), see tokenService
    const token = issueAccessToken(user.id);

    // Response: token + safe user fields only (no password hash)
    res.status(200).json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            totalWorkouts: user.totalWorkouts,
            currentStreak: user.currentStreak,
        },
    });
};

// ─── Forgot Password ────────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    // Body already validated by Zod middleware (forgotPasswordSchema)
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '1h' });
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires,
        },
    });

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
        message: 'Password reset instructions sent to your email',
        // In development only: return token for easier testing
        ...(process.env.NODE_ENV === 'development' && { token: resetToken })
    });
};

// ─── Reset Password ─────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    // Body already validated by Zod middleware (resetPasswordSchema)
    const { token, newPassword } = req.body;

    // Verify token
    let decoded: any;
    try {
        decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.resetPasswordToken !== token || (user.resetPasswordExpires && user.resetPasswordExpires < new Date())) {
        res.status(400).json({ message: 'Invalid or expired token' });
        return;
    }

    // Hash new password with exactly 10 salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        },
    });

    res.status(200).json({ message: 'Password reset successful' });
};

// ─── Google OAuth Callback ───────────────────────────────────────────────────

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as any;
    if (!user) {
        res.status(401).json({ message: 'Authentication failed' });
        return;
    }

    // Hand the browser a single-use, 60-second code instead of the JWT itself.
    // The JWT never appears in a URL, so it cannot leak via browser history,
    // Referer headers or proxy/CDN access logs.
    const code = issueOAuthCode(user.id);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?code=${code}`);
};

// ─── Exchange One-Time OAuth Code for a Token ────────────────────────────────

export const exchangeOAuthCode = async (req: Request, res: Response): Promise<void> => {
    // Body already validated by Zod middleware (exchangeOAuthCodeSchema)
    const { code } = req.body;

    const userId = redeemOAuthCode(code);
    if (!userId) {
        res.status(400).json({ message: 'Invalid or expired code' });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: SAFE_USER_SELECT,
    });

    if (!user) {
        res.status(400).json({ message: 'Invalid or expired code' });
        return;
    }

    // Minimal claims, same shape as the email/password login token
    const token = issueAccessToken(user.id);

    res.status(200).json({ token, user });
};

// ─── Refresh Session ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 *
 * Exchanges a still-valid access token for a fresh one, so a session in
 * active use is never interrupted mid-workout (finding M10). Requires
 * authenticateToken, i.e. the presented token must not yet have expired —
 * the client renews long before that point.
 *
 * `authTime` is carried forward unchanged, so refreshing extends the token
 * but not the underlying sign-in beyond MAX_SESSION_AGE_MS.
 */
export const refreshSession = async (req: Request, res: Response): Promise<void> => {
    const { id: userId, authTime, issuedAt } = req.user!;

    if (!isWithinMaxSessionAge(authTime, issuedAt)) {
        res.status(401).json({ message: 'Session expired, please sign in again' });
        return;
    }

    // Confirm the account still exists before extending its session
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: SAFE_USER_SELECT,
    });

    if (!user) {
        res.status(401).json({ message: 'Session expired, please sign in again' });
        return;
    }

    const token = issueAccessToken(userId, authTime ?? issuedAt);

    res.status(200).json({ token, user });
};

// ─── Get Current User Profile ────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: SAFE_USER_SELECT,
    });

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    res.status(200).json({ user });
};

// ─── Update Profile ──────────────────────────────────────────────────────────

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    // Body already validated by Zod middleware (updateProfileSchema)
    const { firstName, lastName, avatarUrl } = req.body;

    // Build update payload from validated fields
    const updateData: Record<string, any> = {};

    if (firstName !== undefined) {
        updateData.firstName = firstName;
    }
    if (lastName !== undefined) {
        updateData.lastName = lastName;
    }
    if (avatarUrl !== undefined) {
        updateData.avatarUrl = avatarUrl ?? '';
    }

    if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: 'No valid fields to update' });
        return;
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: SAFE_USER_SELECT,
    });

    res.status(200).json({ user });
};
