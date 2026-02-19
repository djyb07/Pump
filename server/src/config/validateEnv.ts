/**
 * Environment Validation
 * 
 * Validates required environment variables at server startup.
 * Throws hard errors if critical configuration is missing.
 */

export function validateRequiredEnv(): void {
    const requiredVars = [
        'JWT_SECRET',
        'DATABASE_URL'
    ];

    const missing: string[] = [];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `FATAL: Missing required environment variables: ${missing.join(', ')}\n` +
            `Server cannot start without these values configured.`
        );
    }

    // Additional validation for JWT_SECRET strength
    const jwtSecret = process.env.JWT_SECRET!;
    if (jwtSecret.length < 32) {
        console.warn(
            'WARNING: JWT_SECRET is less than 32 characters. ' +
            'Consider using a longer secret for better security.'
        );
    }

    // Optional: GEMINI_API_KEY — AI Coach will fall back to mock mode without it
    if (!process.env.GEMINI_API_KEY) {
        console.warn(
            'INFO: GEMINI_API_KEY is not set. AI Coach will run in mock/demo mode.'
        );
    }
}

/**
 * Get JWT Secret with guaranteed non-null return
 * Call this only after validateRequiredEnv() has been called
 */
export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
}
