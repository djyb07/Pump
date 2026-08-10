import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include authenticated user data
declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            /** Unix seconds of the original sign-in (see tokenService). */
            authTime?: number;
            /** Unix seconds the presented token was issued. */
            issuedAt?: number;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, secret) as any;
        req.user = {
            id: decoded.userId,  // Fix: JWT has userId, not id
            email: decoded.email,
            firstName: decoded.firstName || '',
            lastName: decoded.lastName || '',
            authTime: decoded.authTime,
            issuedAt: decoded.iat
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
