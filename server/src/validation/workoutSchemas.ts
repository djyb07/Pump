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

/**
 * Log Set
 *
 * Identifies the exercise by EITHER `dayExerciseId` (a slot in the user's own
 * program) OR `exerciseId` (freestyle). At least one is required; neither is
 * required on its own.
 *
 * `exerciseId` was previously mandatory, but the client only ever sends
 * `dayExerciseId` — so every real request was rejected with a 400 and set
 * logging was broken outright. The server already loads the DayExercise to
 * check ownership, so it can derive `exerciseId` itself; demanding the client
 * restate a value the server must look up anyway bought nothing.
 */
export const logSetSchema = z.object({
    /** A slot in one of the caller's own program days. Ownership is verified. */
    dayExerciseId: z.string().min(1, 'Day exercise ID cannot be empty').optional().nullable(),
    /** Freestyle: the Exercise itself. Required only when dayExerciseId is absent. */
    exerciseId: z.string().min(1, 'Exercise ID cannot be empty').optional().nullable(),
    weight: z.number().min(0, 'Weight cannot be negative').optional(),
    reps: z
        .number({ error: 'Reps is required' })
        .int('Reps must be an integer')
        .min(0, 'Reps cannot be negative'),
    completed: z.boolean().optional().default(true),
    type: SetTypeEnum.optional().default('NORMAL'),
    rpe: rpeField,
}).refine(
    (data) => Boolean(data.dayExerciseId) || Boolean(data.exerciseId),
    { message: 'Either dayExerciseId or exerciseId is required', path: ['dayExerciseId'] }
);

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
