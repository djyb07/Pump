-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ⚠️  ONE-TIME MIGRATION SCRIPT - ALREADY EXECUTED ON PRODUCTION  ⚠️         ║
-- ║                                                                              ║
-- ║  This file is kept for REFERENCE ONLY.                                       ║
-- ║  Status: ✅ ALREADY RUN on Supabase (executed: January 2026)                 ║
-- ║  DO NOT run this script again - it will cause errors due to existing         ║
-- ║  policies. If you need to modify RLS, create a new migration file.           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
--
-- ==============================================================================
-- PUMP Application - Row Level Security (RLS) Policies
-- ==============================================================================
-- This migration enables RLS on all public tables and creates policies
-- to ensure users can only access their own data.
--
-- IMPORTANT: Run this SQL directly in the Supabase SQL Editor.
-- Prisma does not manage RLS policies.
--
-- NOTE: Uses (select auth.uid()) instead of auth.uid() for performance.
-- This caches the value once per query instead of re-evaluating per row.
-- ==============================================================================

-- ==============================================================================
-- STEP 0: DROP EXISTING POLICIES (if any)
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can delete own account" ON "User";

DROP POLICY IF EXISTS "Authenticated users can view exercises" ON "Exercise";

DROP POLICY IF EXISTS "Users can view own programs" ON "WorkoutProgram";
DROP POLICY IF EXISTS "Users can create programs" ON "WorkoutProgram";
DROP POLICY IF EXISTS "Users can update own programs" ON "WorkoutProgram";
DROP POLICY IF EXISTS "Users can delete own programs" ON "WorkoutProgram";

DROP POLICY IF EXISTS "Users can view own workout days" ON "WorkoutDay";
DROP POLICY IF EXISTS "Users can create workout days in own programs" ON "WorkoutDay";
DROP POLICY IF EXISTS "Users can update own workout days" ON "WorkoutDay";
DROP POLICY IF EXISTS "Users can delete own workout days" ON "WorkoutDay";

DROP POLICY IF EXISTS "Users can view own day exercises" ON "DayExercise";
DROP POLICY IF EXISTS "Users can create day exercises in own programs" ON "DayExercise";
DROP POLICY IF EXISTS "Users can update own day exercises" ON "DayExercise";
DROP POLICY IF EXISTS "Users can delete own day exercises" ON "DayExercise";

DROP POLICY IF EXISTS "Users can view own workout logs" ON "WorkoutLog";
DROP POLICY IF EXISTS "Users can create workout logs" ON "WorkoutLog";
DROP POLICY IF EXISTS "Users can update own workout logs" ON "WorkoutLog";
DROP POLICY IF EXISTS "Users can delete own workout logs" ON "WorkoutLog";

DROP POLICY IF EXISTS "Users can view own exercise logs" ON "ExerciseLog";
DROP POLICY IF EXISTS "Users can create exercise logs in own workouts" ON "ExerciseLog";
DROP POLICY IF EXISTS "Users can update own exercise logs" ON "ExerciseLog";
DROP POLICY IF EXISTS "Users can delete own exercise logs" ON "ExerciseLog";

DROP POLICY IF EXISTS "Users can view own exercise stats" ON "ExerciseStats";
DROP POLICY IF EXISTS "Users can create exercise stats" ON "ExerciseStats";
DROP POLICY IF EXISTS "Users can update own exercise stats" ON "ExerciseStats";
DROP POLICY IF EXISTS "Users can delete own exercise stats" ON "ExerciseStats";

-- ==============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ==============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DayExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseStats" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 2: USER TABLE POLICIES
-- Users can only access their own row
-- ==============================================================================

CREATE POLICY "Users can view own profile"
    ON "User" FOR SELECT
    USING (id = (select auth.uid())::text);

CREATE POLICY "Users can update own profile"
    ON "User" FOR UPDATE
    USING (id = (select auth.uid())::text)
    WITH CHECK (id = (select auth.uid())::text);

CREATE POLICY "Users can delete own account"
    ON "User" FOR DELETE
    USING (id = (select auth.uid())::text);

-- Note: INSERT is typically handled during signup via service role

-- ==============================================================================
-- STEP 3: EXERCISE TABLE POLICIES (Reference Data - Read Only)
-- All authenticated users can read exercises
-- ==============================================================================

CREATE POLICY "Authenticated users can view exercises"
    ON "Exercise" FOR SELECT
    USING ((select auth.role()) = 'authenticated');

-- Note: Only admins/service role can INSERT/UPDATE/DELETE exercises

-- ==============================================================================
-- STEP 4: WORKOUT PROGRAM POLICIES
-- Users can only CRUD their own programs
-- ==============================================================================

CREATE POLICY "Users can view own programs"
    ON "WorkoutProgram" FOR SELECT
    USING ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can create programs"
    ON "WorkoutProgram" FOR INSERT
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can update own programs"
    ON "WorkoutProgram" FOR UPDATE
    USING ("userId" = (select auth.uid())::text)
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can delete own programs"
    ON "WorkoutProgram" FOR DELETE
    USING ("userId" = (select auth.uid())::text);

-- ==============================================================================
-- STEP 5: WORKOUT DAY POLICIES
-- Users can access days that belong to their programs
-- ==============================================================================

CREATE POLICY "Users can view own workout days"
    ON "WorkoutDay" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutProgram"
            WHERE "WorkoutProgram".id = "WorkoutDay"."programId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can create workout days in own programs"
    ON "WorkoutDay" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutProgram"
            WHERE "WorkoutProgram".id = "programId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can update own workout days"
    ON "WorkoutDay" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutProgram"
            WHERE "WorkoutProgram".id = "WorkoutDay"."programId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutProgram"
            WHERE "WorkoutProgram".id = "programId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can delete own workout days"
    ON "WorkoutDay" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutProgram"
            WHERE "WorkoutProgram".id = "WorkoutDay"."programId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

-- ==============================================================================
-- STEP 6: DAY EXERCISE POLICIES
-- Users can access exercises in days that belong to their programs
-- ==============================================================================

CREATE POLICY "Users can view own day exercises"
    ON "DayExercise" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutDay"
            JOIN "WorkoutProgram" ON "WorkoutProgram".id = "WorkoutDay"."programId"
            WHERE "WorkoutDay".id = "DayExercise"."dayId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can create day exercises in own programs"
    ON "DayExercise" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutDay"
            JOIN "WorkoutProgram" ON "WorkoutProgram".id = "WorkoutDay"."programId"
            WHERE "WorkoutDay".id = "dayId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can update own day exercises"
    ON "DayExercise" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutDay"
            JOIN "WorkoutProgram" ON "WorkoutProgram".id = "WorkoutDay"."programId"
            WHERE "WorkoutDay".id = "DayExercise"."dayId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutDay"
            JOIN "WorkoutProgram" ON "WorkoutProgram".id = "dayId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can delete own day exercises"
    ON "DayExercise" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutDay"
            JOIN "WorkoutProgram" ON "WorkoutProgram".id = "WorkoutDay"."programId"
            WHERE "WorkoutDay".id = "DayExercise"."dayId"
            AND "WorkoutProgram"."userId" = (select auth.uid())::text
        )
    );

-- ==============================================================================
-- STEP 7: WORKOUT LOG POLICIES
-- Users can only CRUD their own workout logs
-- ==============================================================================

CREATE POLICY "Users can view own workout logs"
    ON "WorkoutLog" FOR SELECT
    USING ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can create workout logs"
    ON "WorkoutLog" FOR INSERT
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can update own workout logs"
    ON "WorkoutLog" FOR UPDATE
    USING ("userId" = (select auth.uid())::text)
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can delete own workout logs"
    ON "WorkoutLog" FOR DELETE
    USING ("userId" = (select auth.uid())::text);

-- ==============================================================================
-- STEP 8: EXERCISE LOG POLICIES
-- Users can access exercise logs from their own workout logs
-- ==============================================================================

CREATE POLICY "Users can view own exercise logs"
    ON "ExerciseLog" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutLog"
            WHERE "WorkoutLog".id = "ExerciseLog"."workoutLogId"
            AND "WorkoutLog"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can create exercise logs in own workouts"
    ON "ExerciseLog" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutLog"
            WHERE "WorkoutLog".id = "workoutLogId"
            AND "WorkoutLog"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can update own exercise logs"
    ON "ExerciseLog" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutLog"
            WHERE "WorkoutLog".id = "ExerciseLog"."workoutLogId"
            AND "WorkoutLog"."userId" = (select auth.uid())::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WorkoutLog"
            WHERE "WorkoutLog".id = "workoutLogId"
            AND "WorkoutLog"."userId" = (select auth.uid())::text
        )
    );

CREATE POLICY "Users can delete own exercise logs"
    ON "ExerciseLog" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "WorkoutLog"
            WHERE "WorkoutLog".id = "ExerciseLog"."workoutLogId"
            AND "WorkoutLog"."userId" = (select auth.uid())::text
        )
    );

-- ==============================================================================
-- STEP 9: EXERCISE STATS POLICIES
-- Users can only CRUD their own stats
-- ==============================================================================

CREATE POLICY "Users can view own exercise stats"
    ON "ExerciseStats" FOR SELECT
    USING ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can create exercise stats"
    ON "ExerciseStats" FOR INSERT
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can update own exercise stats"
    ON "ExerciseStats" FOR UPDATE
    USING ("userId" = (select auth.uid())::text)
    WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "Users can delete own exercise stats"
    ON "ExerciseStats" FOR DELETE
    USING ("userId" = (select auth.uid())::text);

-- ==============================================================================
-- END OF RLS MIGRATION
-- ==============================================================================
