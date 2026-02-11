-- Add profile and gamification fields to User table
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "totalWorkouts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastWorkoutDate" TIMESTAMP(3);
