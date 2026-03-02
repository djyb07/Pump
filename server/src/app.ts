import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import programRoutes from './routes/programRoutes';
import dayRoutes from './routes/dayRoutes';
import dayExerciseRoutes from './routes/dayExerciseRoutes';
import workoutRoutes from './routes/workoutRoutes';
import aiRoutes from './routes/aiRoutes';
import prisma from './prisma';
import './config/passport';
import passport from 'passport';
import { validateRequiredEnv } from './config/validateEnv';
import { globalErrorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Load .env only in development (Render uses Environment settings)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// Validate required environment variables at startup
validateRequiredEnv();

const app = express();

// ─── Security: Hardened HTTP Headers ─────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    // HSTS: 1 year, includeSubDomains — tells browsers to always use HTTPS
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
    },
    // Prevent MIME-type sniffing
    noSniff: true,
    // Strict referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS Configuration (strict) ────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

// Build allowed origins list — no wildcards ever
const allowedOrigins: string[] = [];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}
// Allow localhost only in development
if (!isProduction) {
    allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
    origin: (origin, callback) => {
        // In production, reject requests with no origin header
        // (e.g. curl, non-browser clients). In development, allow them
        // for local testing convenience.
        if (!origin) {
            if (isProduction) {
                callback(new Error('CORS: origin header is required'));
            } else {
                callback(null, true);
            }
            return;
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ─── Body Parsing (with size limit to prevent oversized payloads) ────────────
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());

// ─── Global API Rate Limiting ────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Mount Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api', dayRoutes);
app.use('/api', dayExerciseRoutes);
app.use('/api', workoutRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('PUMP API is running');
});

// ─── Health Check Endpoint ───────────────────────────────────────────────────
// In production, return minimal info only. In development, expose details.
app.get('/api/health/db', async (req, res) => {
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;

        if (isProduction) {
            // Production: minimal health response — no internal details
            res.json({ status: 'ok', database: { connected: true } });
        } else {
            // Development: full diagnostic info
            const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time, version() as db_version`;
            const userCount = await prisma.user.count();
            const tables: any = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `;

            res.json({
                status: 'ok',
                database: {
                    connected: true,
                    version: (result as any)[0]?.db_version,
                    currentTime: (result as any)[0]?.current_time,
                    userCount,
                    tables: tables.map((t: any) => t.table_name),
                },
            });
        }
    } catch (error: any) {
        console.error('Database connection error:', error);
        // Never expose raw error details to client
        res.status(500).json({
            status: 'error',
            message: 'Database health check failed',
        });
    } finally {
        await prisma.$disconnect();
    }
});

// ─── Global Error Handler (MUST be last middleware) ──────────────────────────
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
