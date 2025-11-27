-- AlterTable
ALTER TABLE "WorkoutLog" DROP COLUMN "date",
DROP COLUMN "completed",
ADD COLUMN "programId" TEXT,
ADD COLUMN "workoutType" TEXT NOT NULL DEFAULT 'program',
ADD COLUMN "customName" TEXT,
ADD COLUMN "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "endTime" TIMESTAMP(3),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'in_progress',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "dayId" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "WorkoutLog_startTime_idx" ON "WorkoutLog"("startTime");

-- CreateIndex
CREATE INDEX "WorkoutLog_status_idx" ON "WorkoutLog"("status");

-- DropIndex
DROP INDEX IF EXISTS "WorkoutLog_date_idx";
