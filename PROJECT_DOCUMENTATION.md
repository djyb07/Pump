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
- **Monitor progress** through charts and statistics
- **Track Personal Records (PRs)** for weight, volume, and reps
- **Authenticate** via email/password or Google OAuth

**Key differentiators:**
- Hebrew + English exercise database (100+ exercises)
- Real-time workout tracking with rest timer
- Personal record detection and celebration
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
| Helmet | latest | Security HTTP headers |
| express-rate-limit | latest | Rate limiting middleware |

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
│   │   │   ├── dashboard/           # Dashboard sub-components
│   │   │   │   ├── index.ts             # Barrel export
│   │   │   │   ├── DashboardHeader.tsx  # Header with logo & logout
│   │   │   │   ├── WelcomeSection.tsx   # User welcome card
│   │   │   │   ├── ActiveProgramCard.tsx    # Active program display
│   │   │   │   ├── NextWorkoutCard.tsx      # Next workout card
│   │   │   │   ├── WeekStatsCard.tsx        # Weekly statistics
│   │   │   │   ├── RecentProgressCard.tsx   # Recent PRs display
│   │   │   │   └── QuickActions.tsx         # Quick action buttons
│   │   │   ├── workout/             # Workout-specific components
│   │   │   │   ├── WorkoutHeader.tsx
│   │   │   │   ├── WorkoutControls.tsx
│   │   │   │   └── ExerciseSetList.tsx
│   │   │   ├── AddDayModal.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── EditExerciseModal.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseModal.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── WorkoutSummaryModal.tsx
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   └── useDashboard.ts      # Dashboard data & logic
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
│   │   │   ├── ProgramDetailsPage.tsx   # View/edit program
│   │   │   ├── ProgramsPage.tsx         # List user's programs
│   │   │   ├── Register.tsx             # Registration page
│   │   │   ├── ResetPassword.tsx        # Password reset form
│   │   │   ├── WorkoutDetailsPage.tsx   # View completed workout
│   │   │   └── WorkoutHistoryPage.tsx   # Workout history list
│   │   ├── services/                # API Client Services
│   │   │   ├── apiClient.ts         # Axios instance with auth interceptor
│   │   │   ├── auth.ts              # Auth API calls
│   │   │   ├── exerciseService.ts   # Exercise API calls
│   │   │   ├── programService.ts    # Program API calls
│   │   │   └── workoutService.ts    # Workout API calls
│   │   ├── App.tsx                  # Main app with routing + AppLayout wrapper
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Midnight Pro Design System (glassmorphism, utilities)
│   ├── public/
│   │   └── logo.png                 # App logo/favicon
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json                  # Vercel SPA routing config
│
├── server/                          # Express Backend Application
│   ├── src/
│   │   ├── controllers/             # Request Handlers
│   │   │   ├── authController.ts        # Auth: register, login, OAuth, reset
│   │   │   ├── dayController.ts         # CRUD for workout days
│   │   │   ├── exerciseController.ts    # Exercise library queries
│   │   │   ├── migrationController.ts   # Data migration utilities
│   │   │   ├── programController.ts     # CRUD for programs
│   │   │   └── workoutController.ts     # Workout session management
│   │   ├── routes/                  # API Route Definitions
│   │   │   ├── authRoutes.ts            # /api/auth/*
│   │   │   ├── dayRoutes.ts             # /api/programs/:id/days/*
│   │   │   ├── dayExerciseRoutes.ts     # /api/days/:id/exercises/*
│   │   │   ├── exerciseRoutes.ts        # /api/exercises/*
│   │   │   ├── programRoutes.ts         # /api/programs/*
│   │   │   └── workoutRoutes.ts         # /api/workouts/*
│   │   ├── services/                # Business Logic Services
│   │   │   ├── emailService.ts          # Nodemailer email sending
│   │   │   ├── PRService.ts             # Personal Record calculation
│   │   │   └── workoutService.ts        # Workout session logic
│   │   ├── middleware/              # Express Middleware
│   │   │   ├── auth.ts                  # JWT verification middleware
│   │   │   └── rateLimiter.ts           # Rate limiting for auth routes
│   │   ├── config/                  # Configuration
│   │   │   ├── passport.ts              # Google OAuth strategy
│   │   │   └── validateEnv.ts           # Environment validation
│   │   ├── prisma.ts                # Prisma client instance
│   │   └── app.ts                   # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (8 models)
│   │   ├── seed.sql                 # 100+ exercises seed data
│   │   └── migrations/
│   │       └── rls_enable_policies.sql  # Supabase RLS policies
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
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

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
  sets          Json    // [{ setNumber, weight, reps, completed, timestamp }]
  isWeightPR    Boolean @default(false)
  isVolumePR    Boolean @default(false)
  isRepsPR      Boolean @default(false)
  notes         String?
}
```

**Sets JSON Structure:**
```json
[
  { "setNumber": 1, "weight": 100, "reps": 10, "completed": true, "timestamp": "..." },
  { "setNumber": 2, "weight": 100, "reps": 8, "completed": true, "timestamp": "..." }
]
```

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
| GET | `/google` | Initiate Google OAuth flow | ❌ | - |
| GET | `/google/callback` | Google OAuth callback | ❌ | - |

**Request/Response Examples:**

```typescript
// POST /api/auth/register
Request: { email, password, firstName, lastName }
Response: { message: "User registered successfully" }

// POST /api/auth/login
Request: { email, password }
Response: { token: "eyJhbG...", user: { id, email, firstName, lastName } }
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
| PATCH | `/:id/finish` | Complete workout (calculates PRs) | ✅ |
| GET | `/` | Get workout history | ✅ |
| DELETE | `/:id` | Delete workout | ✅ |

**Workout Flow:**
1. `POST /start` with `{ dayId }` → returns `workoutLog` with session ID
2. `POST /:id/sets` with `{ dayExerciseId, reps, weight }` → logs each set
3. `PATCH /:id/finish` → calculates PRs, returns summary

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/progress/:exerciseId` | Get exercise progress over time | ✅ |
| GET | `/personal-records` | Get all user's PRs | ✅ |

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

### Server-Side Security

| Feature | Implementation | File |
|---------|----------------|------|
| **JWT Validation** | Mandatory JWT_SECRET, no fallback | `validateEnv.ts` |
| **Password Hashing** | bcrypt with 10 salt rounds | `authController.ts` |
| **Rate Limiting** | 5 requests/15min on auth routes | `rateLimiter.ts` |
| **Security Headers** | Helmet middleware | `app.ts` |
| **CORS** | Whitelist CLIENT_URL only | `app.ts` |

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

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
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
| `test_create_program.py` | Create program and add exercises |
| `test_workout_flow.py` | Start, log sets, finish workout |
| `test_view_progress.py` | View exercise progress charts |

**Test Configuration:**
- Tests run against deployed URLs (Vercel + Render)
- 60-second timeout for Render cold starts
- Unique email generation per test run
