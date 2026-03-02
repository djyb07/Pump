/**
 * Workout Request Validation Schemas
 *
 * Strict Zod schemas for workout-related request bodies.
 * Enforces domain constraints:
 *   - RPE: integer 1–10
 *   - Set type: exact enum NORMAL | WARMUP | DROP | FAILURE
 *   - exerciseId: always required (identifies the exercise)
 *   - dayExerciseId: optional (nullable for ad-hoc/freestyle workouts)
 *
 * NOTE: Uses Zod v4 API — error messages use `{ error: '...' }` syntax.
 */

import { z } from 'zod';

// ─── Shared Enums & Reusable Fields ─────────────────────────────────────────

/** Allowed set types — must match the domain model exactly */
const SetTypeEnum = z.enum(['NORMAL', 'WARMUP', 'DROP', 'FAILURE']);

/** RPE (Rate of Perceived Exertion): optional integer between 1 and 10 */
const rpeField = z
    .number()
    .int('RPE must be an integer')
    .min(1, 'RPE must be at least 1')
    .max(10, 'RPE must be at most 10')
    .optional()
    .nullable();

// ─── Start Workout ───────────────────────────────────────────────────────────

export const startWorkoutSchema = z.object({
    dayId: z
        .string({ error: 'Day ID is required' })
        .min(1, 'Day ID is required'),
    programId: z.string().optional(),
});

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;

// ─── Log Set ─────────────────────────────────────────────────────────────────

export const logSetSchema = z.object({
    /** Required: identifies the exercise being logged */
    exerciseId: z
        .string({ error: 'Exercise ID is required' })
        .min(1, 'Exercise ID is required'),
    /** Optional: nullable for ad-hoc/freestyle workouts */
    dayExerciseId: z.string().optional().nullable(),
    weight: z.number().min(0, 'Weight cannot be negative').optional(),
    reps: z
        .number({ error: 'Reps is required' })
        .int('Reps must be an integer')
        .min(0, 'Reps cannot be negative'),
    completed: z.boolean().optional().default(true),
    type: SetTypeEnum.optional().default('NORMAL'),
    rpe: rpeField,
});

export type LogSetInput = z.infer<typeof logSetSchema>;

// ─── Update Set ──────────────────────────────────────────────────────────────

export const updateSetSchema = z.object({
    weight: z.number().min(0, 'Weight cannot be negative').optional(),
    reps: z
        .number({ error: 'Reps is required' })
        .int('Reps must be an integer')
        .min(0, 'Reps cannot be negative'),
    type: SetTypeEnum.optional(),
    rpe: rpeField,
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;

// ─── Finish Workout ──────────────────────────────────────────────────────────

export const finishWorkoutSchema = z.object({
    notes: z
        .string()
        .max(500, 'Notes must be 500 characters or less')
        .optional()
        .nullable(),
    localEndTime: z.string().optional().nullable(),
});

export type FinishWorkoutInput = z.infer<typeof finishWorkoutSchema>;
