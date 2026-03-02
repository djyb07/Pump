/**
 * Zod Validation Middleware
 *
 * Generic Express middleware factory that validates req.body against
 * a Zod schema. On success, replaces req.body with the parsed/coerced
 * data. On failure, returns a sanitized 400 response with field-level
 * errors — no stack traces or internal details are ever exposed.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Creates an Express middleware that validates `req.body` against
 * the provided Zod schema.
 *
 * @param schema - A Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validate(registerSchema), register);
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Parse and replace body with validated/transformed data
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Return flat, sanitized validation errors — no stack traces
                const issues = error.issues as any[];
                res.status(400).json({
                    message: 'Validation failed',
                    errors: issues.map((issue) => ({
                        field: String(issue.path?.join('.') ?? ''),
                        message: String(issue.message ?? 'Invalid value'),
                    })),
                });
                return;
            }

            // Unexpected error — delegate to global error handler
            next(error);
        }
    };
};
