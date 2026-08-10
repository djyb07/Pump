# PUMP - Fitness Tracking Application

> **Purpose of This Document:** This comprehensive documentation is designed to provide a complete understanding of the PUMP project to any developer or AI assistant who has no prior knowledge of the codebase. It covers architecture, data models, API endpoints, authentication flows, and deployment details.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack) (includes Design System)
3. [Production Deployment](#production-deployment)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Frontend Routes](#frontend-routes)
8. [Authentication Flow](#authentication-flow)
9. [Security Features](#security-features)
10. [Key User Flows](#key-user-flows)
11. [Environment Variables](#environment-variables)
12. [Local Development](#local-development)
13. [E2E Testing](#e2e-testing)

---

## Project Overview

PUMP is a **full-stack fitness tracking web application** that allows users to:

- **Create workout programs** with customizable days (Push/Pull/Legs, Upper/Lower, etc.)
- **Track workouts in real-time** with set/rep/weight logging
- **Advanced set types** — Normal, Warmup, Dropset, Failure — with per-set RPE (Rate of Perceived Exertion, 1–10)
- **Monitor progress** through charts and statistics
- **Track Personal Records (PRs)** for weight, volume, and reps (warmup sets excluded automatically)
- **Gamification** — workout streaks, level progression (Novice → Regular → Pro → Elite)
- **AI Coach** — AI-powered weekly training analysis with personalized feedback
- **Authenticate** via email/password or Google OAuth

**Key differentiators:**
- Hebrew + English exercise database (100+ exercises)
- Real-time workout tracking with rest timer
- Set type classification and RPE tracking for training precision
- Personal record detection and celebration (warmup sets excluded)
- Gamified dashboard with streak tracking and level badges
- AI Coach with weekly analysis (Groq integration, mock mode fallback)
- Mobile-responsive dark theme UI

---

## Technology Stack

### Frontend (Client)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Vite | 7.x | Build tool & dev server |
| TailwindCSS | 4.x | Utility-first styling |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client with interceptors |
| Recharts | 3.x | Progress visualization charts |
| lucide-react | latest | Icon library (replaces all emoji usage) |
| vite-plugin-pwa | 1.x | PWA support (Service Worker, manifest, offline caching) |

### Backend (Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime environment |
| Express | 5.x | Web framework |
| TypeScript | 5.9.x | Type safety |
| Prisma | 7.x | ORM for PostgreSQL |
| Passport.js | 0.7.x | Authentication strategies |
| JWT (jsonwebtoken) | 9.x | Token-based authentication |
| bcrypt | 6.x | Password hashing |
| Nodemailer | 7.x | Email service (password reset) |
| Helmet | 8.x | Security HTTP headers (CSP, HSTS, noSniff, referrer) |
| express-rate-limit | 8.x | Rate limiting middleware (auth + global API) |
| Zod | 4.x | Runtime request validation schemas |
| groq-sdk | latest | AI Coach LLM integration (llama-3.3-70b-versatile via Groq) |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database (hosted on Supabase) |
| Row Level Security (RLS) | Database-level access control |

### Design System: Midnight Pro

The application uses a custom **Midnight Pro** design system featuring:

| Element | Styling |
|---------|---------|
| **Background** | `bg-slate-950` with radial lime gradient glow |
| **Glass Cards** | `bg-slate-900/30 backdrop-blur-xl border-white/10` |
| **Primary Accent** | `lime-400` (buttons, highlights, active states) |
| **Text Colors** | `text-white` (primary), `text-slate-400` (secondary) |
| **Inputs** | `bg-slate-900/30 border-white/10 focus:ring-lime-400` |
| **Buttons** | `bg-lime-400 text-slate-950 font-bold` |
| **Icons** | `lucide-react` components throughout (no emojis) |

**Icon Sizing Convention:**
| Context | Size | Example |
|---------|------|---------|
| Page headers | `w-8 h-8` | `<Trophy className="w-8 h-8 text-lime-400" />` |
| Inline / buttons | `w-4 h-4` | `<Check className="w-4 h-4" />` |
| Navigation (desktop) | `w-4 h-4` | `<LayoutDashboard className="w-4 h-4" />` |
| Navigation (mobile) | `w-5 h-5` | `<Dumbbell className="w-5 h-5" />` |
| Empty states | `w-12 h-12` to `w-16 h-16` | `<Dumbbell className="w-16 h-16 text-slate-600" />` |

**CSS Utility Classes (index.css):**
- `.glass-card` - Standard glassmorphism panel
- `.glass-card-lg` - Large rounded glass panel
- `.glass-card-accent` - Glass with lime accent border
- `.btn-primary` - Primary lime button
- `.btn-secondary` - Secondary slate button
- `.btn-hero` - Large hero button with shadow

---

## Production Deployment

| Component | Platform | URL | Auto-Deploy |
|-----------|----------|-----|-------------|
| **Frontend** | Vercel | `https://pump-client.vercel.app` | ✅ GitHub main |
| **Backend API** | Render | `https://pump-api.onrender.com` | ✅ GitHub main |
| **Database** | Supabase | PostgreSQL (managed) | N/A |

**CI/CD Pipeline:**
- Push to `main` branch → automatic deployment to both Vercel (client) and Render (server)
- GitHub Actions: `keep-alive.yml` pings Render every 14 minutes to prevent cold starts

---

## Project Structure

```
Pump/
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── layout/              # Layout & Navigation
│   │   │   │   ├── index.ts             # Barrel export
│   │   │   │   ├── SmartNavbar.tsx      # Sticky nav with hide-on-scroll + offline indicator
│   │   │   │   ├── MainLayout.tsx       # Auth wrapper with navbar
│   │   │   │   └── UnifiedPageHeader.tsx # Consistent page headers
│   │   │   ├── ReloadPrompt.tsx      # PWA update toast (prompt-based SW reload)
│   │   │   ├── dashboard/           # Dashboard sub-components
│   │   │   │   ├── index.ts             # Barrel export
│   │   │   │   ├── DashboardHeader.tsx  # Legacy header (icons)
│   │   │   │   ├── WelcomeSection.tsx   # User welcome with avatar, streak & level badges
│   │   │   │   ├── ActiveProgramCard.tsx    # Active program display
│   │   │   │   ├── NextWorkoutCard.tsx      # Next workout card
│   │   │   │   ├── WeekStatsCard.tsx        # Weekly statistics
│   │   │   │   ├── RecentProgressCard.tsx   # Recent PRs display
│   │   │   │   ├── QuickActions.tsx         # Quick action tiles
│   │   │   │   ├── RecentActivityFeed.tsx   # Last 3 workouts feed
│   │   │   │   ├── BodyHeatmap.tsx          # Muscle recovery heatmap (SVG body front/back)
│   │   │   │   └── AICoachCard.tsx          # AI Coach analysis card (4-state: idle/loading/error/result)
│   │   │   ├── workout/             # Workout-specific components
│   │   │   │   ├── WorkoutHeader.tsx
│   │   │   │   ├── WorkoutControls.tsx
│   │   │   │   └── ExerciseSetList.tsx    # Set logger with type selector popover & RPE input
│   │   │   ├── AddDayModal.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── EditExerciseModal.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseModal.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── WorkoutSummaryModal.tsx
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   ├── useDashboard.ts      # Dashboard data & logic
│   │   │   ├── useNetworkStatus.ts  # Reactive online/offline tracking
│   │   │   ├── useOfflineMutation.ts # Offline mutation queue (localStorage FIFO sync)
│   │   │   ├── useScrollDirection.ts # Scroll direction for navbar hide/show
│   │   │   └── useWorkoutTimer.ts   # Delta-time workout timer
│   │   ├── types/                   # TypeScript Type Definitions
│   │   │   └── dashboard.ts         # Dashboard-related types
│   │   ├── pages/                   # Route Page Components
│   │   │   ├── ActiveWorkoutPage.tsx    # Real-time workout tracking
│   │   │   ├── CreateProgramPage.tsx    # Create new program
│   │   │   ├── Dashboard.tsx            # Main dashboard (uses hook + components)
│   │   │   ├── ExerciseLibrary.tsx      # Browse all exercises
│   │   │   ├── ExerciseProgressPage.tsx # Exercise progress charts
│   │   │   ├── ForgotPassword.tsx       # Password reset request
│   │   │   ├── Login.tsx                # Login page
│   │   │   ├── PersonalRecordsPage.tsx  # All PRs display
│   │   │   ├── ProfilePage.tsx          # Profile editor with avatar presets & custom URL
│   │   │   ├── ProgramDetailsPage.tsx   # View/edit program
│   │   │   ├── ProgramsPage.tsx         # List user's programs
│   │   │   ├── Register.tsx             # Registration page
│   │   │   ├── ResetPassword.tsx        # Password reset form
│   │   │   ├── WorkoutDetailsPage.tsx   # View completed workout
│   │   │   └── WorkoutHistoryPage.tsx   # Workout history list
│   │   ├── services/                # API Client Services
│   │   │   ├── apiClient.ts         # Axios instance with auth interceptor
│   │   │   ├── aiService.ts         # AI Coach API calls
│   │   │   ├── analyticsService.ts  # Analytics API calls (muscle recovery)
│   │   │   ├── auth.ts              # Auth API calls
│   │   │   ├── exerciseService.ts   # Exercise API calls
│   │   │   ├── programService.ts    # Program API calls
│   │   │   └── workoutService.ts    # Workout API calls
│   │   ├── App.tsx                  # Main app with routing + AuthenticatedLayout
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Midnight Pro Design System (glassmorphism, utilities)
│   ├── public/
│   │   ├── logo.png                 # App logo (source)
│   │   ├── favicon.png              # Browser tab favicon
│   │   ├── pump-logo.png            # Navbar logo
│   │   ├── pwa-192x192.png          # PWA icon (192×192)
│   │   └── pwa-512x512.png          # PWA icon (512×512, maskable)
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json                  # Vercel SPA routing config
│
├── server/                          # Express Backend Application
│   ├── src/
│   │   ├── controllers/             # Request Handlers
│   │   │   ├── aiController.ts          # AI Coach analysis endpoint
│   │   │   ├── analyticsController.ts   # Muscle recovery heatmap analytics
│   │   │   ├── authController.ts        # Auth: register, login, OAuth, reset, getMe
│   │   │   ├── dayController.ts         # CRUD for workout days
│   │   │   ├── exerciseController.ts    # Exercise library queries
│   │   │   ├── migrationController.ts   # Data migration utilities
│   │   │   ├── programController.ts     # CRUD for programs
│   │   │   └── workoutController.ts     # Workout session management
│   │   ├── routes/                  # API Route Definitions
│   │   │   ├── aiRoutes.ts              # /api/ai/*
│   │   │   ├── authRoutes.ts            # /api/auth/*
│   │   │   ├── dayRoutes.ts             # /api/programs/:id/days/*
│   │   │   ├── dayExerciseRoutes.ts     # /api/days/:id/exercises/*
│   │   │   ├── exerciseRoutes.ts        # /api/exercises/*
│   │   │   ├── programRoutes.ts         # /api/programs/*
│   │   │   └── workoutRoutes.ts         # /api/workouts/*
│   │   ├── services/                # Business Logic Services
│   │   │   ├── aiService.ts             # AI Coach report generation (OpenAI / mock)
│   │   │   ├── emailService.ts          # Nodemailer email sending
│   │   │   ├── PRService.ts             # Personal Record calculation
│   │   │   └── workoutService.ts        # Workout session logic
│   │   ├── middleware/              # Express Middleware
│   │   │   ├── auth.ts                  # JWT verification middleware
│   │   │   ├── rateLimiter.ts           # Rate limiting (auth 5/15min + global 100/min)
│   │   │   ├── validate.ts              # Generic Zod validation middleware factory
│   │   │   └── errorHandler.ts          # Global error handler (sanitized 500 responses)
│   │   ├── validation/              # Zod Request Schemas
│   │   │   ├── authSchemas.ts           # Login, register, forgot/reset-password, profile
│   │   │   └── workoutSchemas.ts        # Start workout, log/update set, finish workout
│   │   ├── config/                  # Configuration
│   │   │   ├── passport.ts              # Google OAuth strategy
│   │   │   └── validateEnv.ts           # Environment validation
│   │   ├── prisma.ts                # Prisma client instance
│   │   └── app.ts                   # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (8 models)
│   │   ├── seed.sql                 # 100+ exercises seed data
│   │   └── migrations/
│   │       ├── rls_enable_policies.sql  # Supabase RLS policies
│   │       └── add_user_profile_fields.sql  # Gamification fields migration
│   ├── package.json
│   └── tsconfig.json
│
├── tests/                           # E2E Selenium Tests
│   ├── run_all_tests.py             # Test runner script
│   ├── test_register.py
│   ├── test_login.py
│   ├── test_create_program.py
│   ├── test_workout_flow.py
│   └── test_view_progress.py
│
├── .github/workflows/
│   └── keep-alive.yml               # Ping Render to prevent cold starts
│
├── deploy.sh                        # Render build script
├── package.json                     # Root package.json for Render
└── README.md                        # Quick start guide
```

---

## Database Schema

The database consists of **8 interconnected models**:

### Entity Relationship Summary

```
User (1) ─────┬────────────────> (N) WorkoutProgram
              │                       │
              │                       └──> (N) WorkoutDay
              │                                   │
              │                                   └──> (N) DayExercise ──> Exercise
              │
              ├────────────────> (N) WorkoutLog
              │                       │
              │                       └──> (N) ExerciseLog
              │
              └────────────────> (N) ExerciseStats

Exercise (reference data, shared by all users)
```

### Model Definitions

#### 1. User
```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  password             String    // bcrypt hashed
  firstName            String
  lastName             String
  googleId             String?   @unique  // For Google OAuth users
  resetPasswordToken   String?   // JWT for password reset
  resetPasswordExpires DateTime?
  avatarUrl            String?   // Profile picture URL (preset or custom)
  totalWorkouts        Int       @default(0)  // Lifetime workout count
  currentStreak        Int       @default(0)  // Consecutive workout weeks (ISO week-based)
  lastWorkoutDate      DateTime? // For streak calculation (client local time)
  aiReport             Json?     // Cached AI Coach weekly analysis
  aiReportDate         DateTime? // When AI report was last generated (24h cache)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

**Gamification Logic:**
- `totalWorkouts` increments on each completed workout
- `currentStreak` uses **ISO week** numbers: same week = keep, consecutive week = +1, gap > 1 week = reset to 1
- The week calculation uses the **client's local time** (`localEndTime`) to avoid UTC timezone mismatches
- Level thresholds: 0–9 Novice, 10–49 Regular, 50–99 Pro, 100+ Elite
- `avatarUrl` can be set via 6 built-in avatar presets (Initials, Gym, Runner, Weights, Yoga, Boxing) or a custom URL
- `aiReport` stores the latest AI analysis JSON; `aiReportDate` is checked for 24h cache validity

#### 2. Exercise (Reference Data)
```prisma
model Exercise {
  id               String   @id @default(uuid())
  nameEn           String   // "Bench Press"
  nameHe           String   // "לחיצת חזה"
  descriptionHe    String   @db.Text
  muscleGroups     String[] // ["Chest", "Triceps", "Shoulders"]
  workoutTypes     String[] // ["Push", "Upper", "Full Body"]
  difficulty       String   // "Beginner" | "Intermediate" | "Advanced"
  equipment        String[] // ["Barbell", "Bench"]
  imageUrl         String?
  videoUrl         String?
}
```
**Note:** 100+ exercises seeded via `seed.sql`. Read-only for regular users.

#### 3. WorkoutProgram
```prisma
model WorkoutProgram {
  id        String   @id @default(uuid())
  userId    String   // Owner
  name      String   // "My PPL Program"
  splitType String   // "PPL" | "UPPER_LOWER" | "FULL_BODY" | "CUSTOM"
  isActive  Boolean  @default(true)
}
```

#### 4. WorkoutDay
```prisma
model WorkoutDay {
  id         String   @id @default(uuid())
  programId  String
  name       String   // "Push Day", "Leg Day"
  dayType    String?  // "PUSH" | "PULL" | "LEGS" | etc.
  orderIndex Int      // For sorting (0, 1, 2...)
}
```

#### 5. DayExercise (Junction Table)
```prisma
model DayExercise {
  id           String  @id @default(uuid())
  dayId        String
  exerciseId   String
  orderIndex   Int
  targetSets   Int     @default(3)
  targetReps   Int     @default(10)
  targetWeight Float?  // Optional target weight
  notes        String?
}
```

#### 6. WorkoutLog (Completed Workout Session)
```prisma
model WorkoutLog {
  id          String    @id @default(uuid())
  userId      String
  dayId       String?   // Nullable for ad-hoc workouts
  programId   String?
  dayName     String    // Preserved for history
  programName String    // Preserved for history
  startTime   DateTime  @default(now())
  endTime     DateTime?
  duration    Int?      // Minutes
  status      String    @default("in_progress")  // "in_progress" | "completed" | "cancelled"
  notes       String?
}
```

#### 7. ExerciseLog (Sets within a Workout)
```prisma
model ExerciseLog {
  id            String  @id @default(uuid())
  workoutLogId  String
  dayExerciseId String?
  exerciseId    String
  exerciseName  String  // Preserved for history
  sets          Json    // [{ setNumber, weight, reps, completed, type, rpe?, timestamp }]
  isWeightPR    Boolean @default(false)
  isVolumePR    Boolean @default(false)
  isRepsPR      Boolean @default(false)
  notes         String?
}
```

**Sets JSON Structure:**
```json
[
  { "setNumber": 1, "weight": 60, "reps": 12, "completed": true, "type": "WARMUP", "timestamp": "..." },
  { "setNumber": 2, "weight": 100, "reps": 10, "completed": true, "type": "NORMAL", "rpe": 7, "timestamp": "..." },
  { "setNumber": 3, "weight": 100, "reps": 8, "completed": true, "type": "NORMAL", "rpe": 9, "timestamp": "..." },
  { "setNumber": 4, "weight": 80, "reps": 10, "completed": true, "type": "DROP", "rpe": 8, "timestamp": "..." }
]
```

**Set Types:** `NORMAL` (default), `WARMUP`, `DROP`, `FAILURE`
**RPE:** Optional integer 1–10 (Rate of Perceived Exertion). Validated server-side.
**Backward Compatibility:** Missing `type` defaults to `NORMAL`. No DB migration needed.

#### 8. ExerciseStats (Cached Statistics)
```prisma
model ExerciseStats {
  id             String    @id @default(uuid())
  userId         String
  exerciseId     String
  bestWeight     Float     @default(0)
  bestWeightDate DateTime?
  bestReps       Int       @default(0)
  bestRepsDate   DateTime?
  bestVolume     Float     @default(0)
  bestVolumeDate DateTime?
  totalVolume    Float     @default(0)
  totalSets      Int       @default(0)
  totalReps      Int       @default(0)
  workoutCount   Int       @default(0)
  lastPerformed  DateTime?
  
  @@unique([userId, exerciseId])
}
```

---

## API Reference

**Base URL:** `https://pump-api.onrender.com` (production) or `http://localhost:5000` (local)

**Authentication:** All protected endpoints require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| POST | `/register` | Create new user account | ❌ | 5/15min |
| POST | `/login` | Login with email/password | ❌ | 5/15min |
| POST | `/forgot-password` | Request password reset email | ❌ | 5/15min |
| POST | `/reset-password` | Reset password with token | ❌ | - |
| GET | `/me` | Get current user profile (live stats) | ✅ | - |
| GET | `/google` | Initiate Google OAuth flow | ❌ | - |
| GET | `/google/callback` | Google OAuth callback | ❌ | - |

**Request/Response Examples:**

```typescript
// POST /api/auth/register
Request: { email, password, firstName, lastName }
Response: { message: "User registered successfully" }

// POST /api/auth/login
Request: { email, password }
Response: { token: "eyJhbG...", user: { id, email, firstName, lastName, avatarUrl, totalWorkouts, currentStreak } }

// GET /api/auth/me (requires Bearer token)
Response: { user: { id, firstName, lastName, email, avatarUrl, totalWorkouts, currentStreak } }
```

### Exercises (`/api/exercises`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all exercises | ✅ |
| GET | `/:id` | Get exercise by ID | ✅ |
| GET | `/search?q=...` | Search by name (EN/HE) | ✅ |

### Programs (`/api/programs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user's programs | ✅ |
| GET | `/:id` | Get program with days and exercises | ✅ |
| POST | `/` | Create new program | ✅ |
| PUT | `/:id` | Update program | ✅ |
| DELETE | `/:id` | Delete program (cascade) | ✅ |

### Days (`/api/programs/:programId/days`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Add day to program | ✅ |
| PUT | `/:dayId` | Update day | ✅ |
| DELETE | `/:dayId` | Delete day (cascade) | ✅ |

### Day Exercises (`/api/days/:dayId/exercises`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Add exercise to day | ✅ |
| PUT | `/:exerciseId` | Update day exercise targets | ✅ |
| DELETE | `/:exerciseId` | Remove exercise from day | ✅ |

### Workouts (`/api/workouts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/start` | Start new workout session | ✅ |
| GET | `/active` | Get in-progress workout | ✅ |
| GET | `/:id` | Get workout details | ✅ |
| POST | `/:id/sets` | Log a set | ✅ |
| PATCH | `/:id/sets/:logId/:setIndex` | Update a set | ✅ |
| DELETE | `/:id/sets/:logId/:setIndex` | Delete a set | ✅ |
| PATCH | `/:id/finish` | Complete workout (calculates PRs, updates streak) | ✅ |
| GET | `/` | Get workout history | ✅ |
| DELETE | `/:id` | Delete workout | ✅ |

**Workout Flow:**
1. `POST /start` with `{ dayId }` → returns `workoutLog` with session ID
2. `POST /:id/sets` with `{ dayExerciseId, reps, weight, type?, rpe? }` → logs each set (type defaults to `NORMAL`, RPE validated 1–10)
3. `PATCH /:id/sets/:logId/:setIndex` with `{ reps, weight, type?, rpe? }` → update an existing set
4. `PATCH /:id/finish` with `{ notes?, localEndTime }` → calculates PRs (excluding `WARMUP` sets), updates streak

**PR Calculation Logic:**
- `WARMUP` sets are excluded from maxWeight, maxReps, effectiveVolume, and e1RM calculations
- `totalVolume` (used in workout summary) includes all sets; `effectiveVolume` (used for volume PRs) excludes warmup
- This exclusion applies across `PRService`, `getExerciseProgress`, and `deleteWorkout` PR recalculation

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/progress/:exerciseId` | Get exercise progress over time | ✅ |
| GET | `/personal-records` | Get all user's PRs | ✅ |
| GET | `/muscle-recovery` | Get per-muscle recovery heatmap data (last 7 days) | ✅ |

**Muscle Recovery Response:**
```json
{
  "muscles": {
    "Chest": { "totalSets": 15, "strainScore": 75, "status": "Recovering", "color": "red", "daysSinceTraining": 0.5 },
    "Shoulders": { "totalSets": 0, "strainScore": 0, "status": "Ready", "color": "lime", "daysSinceTraining": null }
  }
}
```

**Display Groups:** The endpoint normalizes 25+ granular muscle names from the Exercise seed into 8 display groups: Chest, Shoulders, Arms, Upper Back, Lower Back, Core, Quads, Glutes & Hams.

**Recovery Status Logic:**
- `< 24h` since last training → `Recovering` (Red)
- `24–48h` → `Resting` (Amber/Orange)
- `> 48h` or never trained → `Ready` (Lime/Green)
- Strain Score: `min(100, totalSets × 5)` — 20 sets in 7 days = max strain

### AI Coach (`/api/ai`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/analyze` | Generate AI analysis of last 4 weeks (24h DB-cached) | ✅ |

**AI Analysis Response:**
```json
{
  "report": {
    "summary": "Overview of training period.",
    "positive_feedback": ["What you're doing well."],
    "areas_for_improvement": ["Areas that need attention."],
    "actionable_tips": ["Concrete recommendations."]
  },
  "cached": false,
  "generatedAt": "2026-02-18T15:00:00.000Z"
}
```

**Data Pipeline:**
- Fetches last 4 weeks of completed `WorkoutLog` with `exerciseLogs`
- Joins `Exercise` table via `exerciseId` to resolve `muscleGroups[]` per exercise (e.g., `[Chest, Triceps, Shoulders]`)
- Outputs per-set granularity: weight, reps, set type (`WARMUP`/`NORMAL`/`DROPSET`/`FAILURE`), and RPE
- User notes are sanitized (HTML/script tags stripped, capped at 200 chars)

**Analysis Prompt** (hard-science, second-person tone):
1. **Volume Trends** — effective weekly volume per muscle group (warmups excluded), week-over-week comparison
2. **Intensity Evaluation** — RPE assessment: flags undertraining (<7) and overreaching (=10)
3. **Muscle Group Coverage** — cross-references 8 major groups, flags <6 effective sets/week
4. **Progressive Overload** — compares best working sets week 1 vs week 4 by exercise
5. **Recovery & Frequency** — flags <48h rest or 1×/week frequency when 2× is optimal

**Behavior:**
- Checks `User.aiReportDate` — if < 24h old, returns cached `User.aiReport` instantly
- Otherwise calls Groq `llama-3.3-70b-versatile` with `response_format: json_object`
- **Mock mode**: If `GROQ_API_KEY` is missing or API call fails, returns demo report automatically (never crashes)
- Returns 400 if no completed workouts exist

---

## Frontend Routes

| Route | Component | Description | Protected |
|-------|-----------|-------------|-----------|
| `/` | Redirect | → `/dashboard` | - |
| `/login` | Login | Email/password login | ❌ |
| `/register` | Register | New account creation | ❌ |
| `/forgot-password` | ForgotPassword | Request reset email | ❌ |
| `/reset-password` | ResetPassword | Set new password | ❌ |
| `/dashboard` | Dashboard | Main user dashboard | ✅ |
| `/exercises` | ExerciseLibrary | Browse exercise database | ✅ |
| `/programs` | ProgramsPage | List user's programs | ✅ |
| `/programs/new` | CreateProgramPage | Create new program | ✅ |
| `/programs/:id` | ProgramDetailsPage | View/edit program | ✅ |
| `/workout/active` | ActiveWorkoutPage | Real-time workout tracking | ✅ |
| `/workout/history` | WorkoutHistoryPage | Completed workouts list | ✅ |
| `/workout/:id` | WorkoutDetailsPage | View workout details | ✅ |
| `/exercise/:id/progress` | ExerciseProgressPage | Progress charts | ✅ |
| `/personal-records` | PersonalRecordsPage | All PRs display | ✅ |
| `/profile` | ProfilePage | Profile editor with avatar presets | ✅ |

---

## Authentication Flow

### Email/Password Flow

```
1. User registers → bcrypt hashes password → stores in DB
2. User logs in → bcrypt compares → JWT signed with JWT_SECRET
3. JWT returned to client → stored in localStorage
4. All API calls include: Authorization: Bearer <token>
5. Server middleware verifies JWT on protected routes
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirects to: GET /api/auth/google
3. Server redirects to Google with OAuth2 credentials
4. User authenticates with Google
5. Google redirects to: GET /api/auth/google/callback
6. Server creates/updates user, generates JWT
7. Server redirects to: CLIENT_URL/login?token=<jwt>
8. Frontend extracts token from URL, stores in localStorage
```

### Password Reset Flow

```
1. User submits email to: POST /api/auth/forgot-password
2. Server generates JWT reset token (1h expiry)
3. Email sent with reset link (or token logged if no email configured)
4. User clicks link: /reset-password?token=<token>
5. User submits new password to: POST /api/auth/reset-password
6. Server verifies JWT, updates password hash
```

---

## Security Features

### Input Validation (Zod v4)

All mutation endpoints enforce strict runtime validation via Zod schemas applied as Express middleware. Invalid payloads are rejected with a sanitized `400 Bad Request` containing field-level error messages — no stack traces.

| Endpoint | Schema | Key Validations |
|----------|--------|----------------|
| `POST /register` | `registerSchema` | email (valid, lowercased), password (min 8), names (1–50 chars, trimmed) |
| `POST /login` | `loginSchema` | email (valid), password (non-empty) |
| `POST /forgot-password` | `forgotPasswordSchema` | email (valid) |
| `POST /reset-password` | `resetPasswordSchema` | token (non-empty), newPassword (min 8) |
| `PUT /profile` | `updateProfileSchema` | names (optional, 1–50), avatarUrl (optional string/null) |
| `POST /workouts/start` | `startWorkoutSchema` | dayId (required), programId (optional) |
| `POST /workouts/:id/sets` | `logSetSchema` | exerciseId (required), dayExerciseId (optional/nullable), reps (int ≥ 0), RPE (int 1–10), type (enum: NORMAL/WARMUP/DROP/FAILURE) |
| `PATCH /workouts/.../sets/...` | `updateSetSchema` | reps (int ≥ 0), weight (≥ 0), RPE (int 1–10), type (enum) |
| `PATCH /workouts/:id/finish` | `finishWorkoutSchema` | notes (max 500), localEndTime (optional) |

### Server-Side Security

| Feature | Implementation | File |
|---------|----------------|------|
| **JWT Validation** | Mandatory `JWT_SECRET` (≥32 chars, fatal error on startup if missing) | `validateEnv.ts` |
| **Password Hashing** | bcrypt with exactly 10 salt rounds (`BCRYPT_SALT_ROUNDS` constant) | `authController.ts` |
| **Trust Proxy** | `app.set('trust proxy', 1)` — tells Express to parse `X-Forwarded-For` so rate limiters resolve real client IPs behind Render's reverse proxy | `app.ts` |
| **Rate Limiting (Auth)** | 5 requests / 15 min per real client IP on auth routes (requires trust proxy) | `rateLimiter.ts` |
| **Rate Limiting (Global)** | 100 requests / 1 min per real client IP on all `/api` routes (requires trust proxy) | `rateLimiter.ts`, `app.ts` |
| **Security Headers** | Helmet with explicit CSP, HSTS (1 year, includeSubDomains), noSniff, strict referrer | `app.ts` |
| **CORS** | Origin callback: allows requests matching `CLIENT_URL` or with no `Origin` header (OAuth redirects, same-origin navigations); all other origins rejected; credentials enabled; no wildcards | `app.ts` |
| **Body Size Limit** | `express.json({ limit: '1mb' })` prevents oversized payloads | `app.ts` |
| **Global Error Handler** | Catches all unhandled errors, logs internally, returns generic `500 Internal Server Error` — never exposes stack traces | `errorHandler.ts` |
| **Safe User Responses** | Centralised `SAFE_USER_SELECT` whitelist — password hashes and DB-internal fields are never returned | `authController.ts` |
| **Health Endpoint** | Returns only `{ status: 'ok' }` in production — no DB version, table names, or user counts | `app.ts` |

**Rate Limiter Scaling Note:** Both limiters use the default in-memory store, suitable for single-instance deployments. For horizontal scaling, replace with `rate-limit-redis` or similar shared store.

### Database Security (Supabase RLS)

All tables have Row Level Security enabled with policies ensuring:
- Users can only read/write their own data
- Exercise table is read-only for all authenticated users
- Cascading deletes properly scoped

**RLS Policy Example:**
```sql
CREATE POLICY "Users can view own programs"
    ON "WorkoutProgram" FOR SELECT
    USING ("userId" = (select auth.uid())::text);
```

---

## Key User Flows

### 1. Registration → Login → Dashboard
```
/register → fill form → submit → /login → enter credentials → /dashboard
```

### 2. Create Program
```
/programs → "Create Program" → enter name, select split → auto-generates days → /programs/:id
```

### 3. Complete Workout
```
/programs/:id → "Start Workout" → /workout/active → log sets → "Finish" → summary modal → /workout/:id
```

### 4. View Progress
```
/exercises → click exercise → /exercise/:id/progress → view charts (weight over time, volume, etc.)
```

---

## Progressive Web App (PWA)

PUMP is a fully offline-capable PWA powered by `vite-plugin-pwa`.

### Service Worker

| Feature | Strategy | Details |
|---------|----------|---------|
| **Registration** | `registerType: 'prompt'` | Users are prompted to update — no auto-refresh during workouts |
| **Static Assets** (JS, CSS, Fonts) | `CacheFirst` | 30-day expiry, max 60 entries |
| **API GET Requests** (`/api/`) | `StaleWhileRevalidate` | 24-hour expiry, max 50 entries |
| **Precaching** | Automatic (Workbox) | All build assets precached on first visit |

### Web Manifest

```json
{
  "name": "PUMP - Fitness Tracker",
  "short_name": "PUMP",
  "theme_color": "#020617",
  "background_color": "#020617",
  "display": "standalone",
  "icons": ["pwa-192x192.png", "pwa-512x512.png (maskable)"]
}
```

### Offline Mutation Queue (`useOfflineMutation`)

When offline, mutation requests (POST/PUT/PATCH/DELETE) are persisted to `localStorage` under `pump_syncQueue` and replayed on reconnect.

```
Online  → apiClient.request() → immediate execution
Offline → localStorage queue → replay on `online` event or mount
```

**Queue Processing Rules (FIFO):**
- 4xx errors → discard item (client error, won't self-heal), continue queue
- 5xx / Network errors → stop processing, retain remaining items for next attempt
- Sync triggers: on mount (if online) AND on `online` window event

### ReloadPrompt Component

A toast notification that appears when a new service worker version is available. Uses Midnight Pro glassmorphism styling and is positioned above the mobile bottom nav. The user can choose to update or dismiss.

### UI Indicator

`SmartNavbar` displays a pulsing `WifiOff` icon (red-400) next to the logo when the device is offline.

---

## Environment Variables

### Server (Render) - Required

```env
DATABASE_URL=postgresql://user:pass@supabase-host:5432/postgres?sslmode=require
JWT_SECRET=your-32-character-minimum-secret-key
SERVER_URL=https://pump-api.onrender.com
CLIENT_URL=https://pump-client.vercel.app
PORT=5000
```

### Server (Render) - Optional

All of the following may be omitted. In particular, if `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are unset the server starts normally, logs a warning,
and disables Google sign-in — `GET /api/auth/google` returns `503`.
Email/password authentication is unaffected.

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GROQ_API_KEY=gsk_...                        # AI Coach (falls back to mock mode if missing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Client (Vercel) - Required

```env
VITE_API_URL=https://pump-api.onrender.com
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database (or Supabase free tier)

### Setup

```bash
# Clone repository
git clone https://github.com/djyb07/Pump.git
cd Pump

# Install server dependencies
cd server
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET

# Generate Prisma client
npx prisma generate

# Seed exercises (first time only)
npx prisma db execute --file prisma/seed.sql

# Start server (Terminal 1)
npm run dev

# Install client dependencies (Terminal 2)
cd ../client
npm install

# Start client
npm run dev

# Access: http://localhost:5173
```

### Local Environment Variables

**server/.env:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=development-secret-key-minimum-32-chars
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

**client/.env:**
```env
VITE_API_URL=http://localhost:5000
```

---

## E2E Testing

Selenium-based E2E tests in `tests/` directory:

```bash
# Run all tests
cd tests
python run_all_tests.py
```

### Test Suite

| Test File | Description |
|-----------|-------------|
| `test_register.py` | User registration flow |
| `test_login.py` | Login with credentials |
| `test_create_program.py` | Create program, add a day, and add an exercise to it (9 steps) |
| `test_workout_flow.py` | Navigate to program, start workout, log sets, finish workout (resilient selectors) |
| `test_view_progress.py` | View exercise progress charts |

**Test Configuration:**
- Tests run against deployed URLs (Vercel + Render)
- 60-second timeout for Render cold starts
- Unique email generation per test run

**Resilient Selector Patterns:**
- XPath uses `contains(., 'text')` (element string-value) instead of `contains(text(), 'text')` to handle mixed-content nodes (e.g., buttons with SVG icon children)
- Selectors are scoped to `//button | //a` to avoid matching parent containers like `<body>`
- `test_workout_flow.py` gracefully handles disabled "Start Workout" buttons (no exercises) and empty programs (no days) — both return `True`
- DOM diagnostics (body text snapshot) are printed on unexpected failures for debugging

