/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled exceptions that propagate through the Express
 * middleware chain. Logs the full error internally for observability,
 * but returns only a generic message to the client — never exposing
 * stack traces, internal error details, or sensitive information.
 *
 * IMPORTANT: Express requires exactly 4 parameters (err, req, res, next)
 * to recognize this as an error-handling middleware. Do NOT remove `next`.
 */

import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // ── Internal logging (full details for observability) ────────────────
    console.error('[UNHANDLED ERROR]', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
    });

    // ── Client response (sanitized — no internal details) ────────────────
    // Never return err.message or err.stack to the client.
    // Known domain errors (thrown by services) should be caught in
    // controllers or dedicated middleware — not here.
    res.status(500).json({
        message: 'Internal server error',
    });
};
