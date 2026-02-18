// Dashboard Types
// Shared type definitions for dashboard components

export interface Program {
    id: string;
    name: string;
    description?: string;
    days: WorkoutDay[];
}

export interface WorkoutDay {
    id: string;
    name: string;
    dayNumber: number;
    exercises?: DayExercise[];
}

export interface DayExercise {
    exercise?: {
        nameEn?: string;
        name?: string;
    };
}

export interface WorkoutLog {
    id: string;
    userId: string;
    dayId?: string;
    programId?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: string;
    exerciseLogs?: ExerciseLogEntry[];
}

export interface ExerciseLogEntry {
    sets: SetEntry[];
    isWeightPR?: boolean;
    isVolumePR?: boolean;
    isRepsPR?: boolean;
}

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

export interface SetEntry {
    weight?: number;
    reps?: number;
    type?: SetType;
    rpe?: number;
}

export interface ExercisePR {
    exerciseId: string;
    exerciseName: string;
    bestWeight: number;
    bestWeightDate: string;
    bestVolume: number;
    bestVolumeDate: string;
    bestReps: number;
    bestRepsDate: string;
}

export interface WeekStats {
    workouts: number;
    volume: number;
    sets: number;
    prs: number;
}

export interface UserInfo {
    name: string;
    email: string;
    initials: string;
    avatarUrl?: string;
    currentStreak: number;
    totalWorkouts: number;
}

export interface ProcessedPR {
    exerciseId: string;
    exerciseName: string;
    type: 'weight' | 'volume' | 'reps';
    value: string;
    date: string;
}
