/**
 * Program / Day / Day-Exercise Request Validation Schemas
 *
 * These six mutation endpoints previously had no Zod schema at all and relied
 * on ad-hoc truthiness checks in their controllers (finding H2), leaving
 * string fields unbounded and splitType unconstrained.
 *
 * EVERY field below was checked against what the client actually sends before
 * it was written. Three would have broken the app if written naively:
 *
 *   A. addDaySchema.dayType MUST be optional — AddDayModal collects only a
 *      name, and handleAddDay posts { name } with no dayType.
 *   B. updateDayExerciseSchema.targetWeight MUST be nullable — EditExerciseModal
 *      sends an explicit null to clear the weight. `.optional()` alone rejects
 *      null with a 400 and would re-break clearing.
 *   C. addDayExerciseSchema.targetWeight and .notes MUST be optional — the
 *      client omits both.
 *
 * Requiring a field the client never sends is exactly what broke set logging
 * for five months. tests/api/test_program_validation.py pins all three.
 *
 * NOTE: Uses Zod v4 API — error messages use `{ error: '...' }` syntax.
 * No schema uses .strict(): unknown keys are stripped, matching the behaviour
 * these endpoints already had.
 */

import { z } from 'zod';

// ─── Shared Fields ───────────────────────────────────────────────────────────

/**
 * Split types the server can actually build days for (see getDaysForSplit).
 * Anything else used to be accepted and silently produced a program with zero
 * days — a dead end for the user — so it is now a 400.
 */
const SplitTypeEnum = z.enum([
    'PPL',
    'UPPER_LOWER',
    'FULL_BODY',
    'PUSH_PULL',
    'FIVE_DAY',
    'CUSTOM',
]);

/** Non-negative integer target. 0 is a legitimate value, not "absent". */
const targetCountField = z
    .number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .optional();

/** null clears the target weight; undefined leaves it unchanged. */
const targetWeightField = z
    .number()
    .min(0, 'Weight cannot be negative')
    .optional()
    .nullable();

const notesField = z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable();

const orderIndexField = z
    .number()
    .int('Order index must be a whole number')
    .min(0, 'Order index cannot be negative')
    .optional();

// ─── Programs ────────────────────────────────────────────────────────────────

export const createProgramSchema = z.object({
    name: z
        .string({ error: 'Program name is required' })
        .trim()
        .min(1, 'Program name is required')
        .max(100, 'Program name must be 100 characters or less'),
    splitType: SplitTypeEnum,
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

/** No client caller today; every field optional so nothing is invented. */
export const updateProgramSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Program name cannot be empty')
        .max(100, 'Program name must be 100 characters or less')
        .optional(),
    splitType: SplitTypeEnum.optional(),
    isActive: z.boolean().optional(),
}).refine(
    (data) => data.name !== undefined || data.splitType !== undefined || data.isActive !== undefined,
    { message: 'At least one field must be provided' }
);

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

// ─── Days ────────────────────────────────────────────────────────────────────

export const addDaySchema = z.object({
    name: z
        .string({ error: 'Day name is required' })
        .trim()
        .min(1, 'Day name is required')
        .max(100, 'Day name must be 100 characters or less'),
    // (A) optional — the client never sends it
    dayType: z
        .string()
        .trim()
        .max(50, 'Day type must be 50 characters or less')
        .optional()
        .nullable(),
});

export type AddDayInput = z.infer<typeof addDaySchema>;

/** No client caller today. */
export const updateDaySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Day name cannot be empty')
        .max(100, 'Day name must be 100 characters or less')
        .optional(),
    dayType: z
        .string()
        .trim()
        .max(50, 'Day type must be 50 characters or less')
        .optional()
        .nullable(),
    orderIndex: orderIndexField,
}).refine(
    (data) => data.name !== undefined || data.dayType !== undefined || data.orderIndex !== undefined,
    { message: 'At least one field must be provided' }
);

export type UpdateDayInput = z.infer<typeof updateDaySchema>;

// ─── Day Exercises ───────────────────────────────────────────────────────────

export const addDayExerciseSchema = z.object({
    exerciseId: z
        .string({ error: 'Exercise ID is required' })
        .min(1, 'Exercise ID is required'),
    targetSets: targetCountField,
    targetReps: targetCountField,
    // (C) both optional — the client omits them
    targetWeight: targetWeightField,
    notes: notesField,
});

export type AddDayExerciseInput = z.infer<typeof addDayExerciseSchema>;

export const updateDayExerciseSchema = z.object({
    targetSets: targetCountField,
    targetReps: targetCountField,
    // (B) nullable — the client sends null to clear
    targetWeight: targetWeightField,
    notes: notesField,
    orderIndex: orderIndexField,
}).refine(
    (data) =>
        data.targetSets !== undefined ||
        data.targetReps !== undefined ||
        data.targetWeight !== undefined ||
        data.notes !== undefined ||
        data.orderIndex !== undefined,
    { message: 'At least one field must be provided' }
);

export type UpdateDayExerciseInput = z.infer<typeof updateDayExerciseSchema>;
