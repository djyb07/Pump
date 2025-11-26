import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import programRoutes from './routes/programRoutes';
import dayRoutes from './routes/dayRoutes';
import dayExerciseRoutes from './routes/dayExerciseRoutes';
import workoutRoutes from './routes/workoutRoutes';
import prisma from './prisma';
import './config/passport';
import passport from 'passport';

// Load .env only in development (Azure uses Configuration settings)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
    console.log('📁 Loaded .env file (development mode)');
} else {
    console.log('☁️ Using Azure App Service Configuration (production mode)');
}

// DEBUG: Verify environment variables
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('SERVER_URL:', process.env.SERVER_URL || 'NOT SET');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET ✅' : 'MISSING ❌');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET ✅' : 'MISSING ❌');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✅' : 'MISSING ❌');
console.log('=============================');

const app = express();

// CORS Configuration
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173', // Always allow localhost for development
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

console.log('Mounting auth routes at /api/auth');
console.log('authRoutes type:', typeof authRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api', dayRoutes);
app.use('/api', dayExerciseRoutes);
app.use('/api', workoutRoutes);

app.get('/', (req, res) => {
    res.send('PUMP API is running');
});

// Health check endpoint for database connection
app.get('/api/health/db', async (req, res) => {
    try {
        // Try to connect
        await prisma.$connect();

        // Run a simple query
        const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time, version() as db_version`;

        // Count users
        const userCount = await prisma.user.count();

        // Get table info
        const tables: any = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;

        res.json({
            status: 'success',
            message: 'החיבור למסד הנתונים עובד!',
            database: {
                connected: true,
                version: (result as any)[0]?.db_version,
                currentTime: (result as any)[0]?.current_time,
                userCount: userCount,
                tables: tables.map((t: any) => t.table_name)
            }
        });

    } catch (error: any) {
        console.error('Database connection error:', error);
        res.status(500).json({
            status: 'error',
            message: 'שגיאה בחיבור למסד הנתונים',
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                meta: error.meta
            }
        });
    } finally {
        await prisma.$disconnect();
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
