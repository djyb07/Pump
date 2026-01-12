# PUMP - Fitness Tracking Application

## Project Overview

PUMP is a full-stack fitness tracking web application deployed in the cloud:

**Live Production URLs:**
- **Frontend:** Hosted on **Vercel** - `https://pump-client.vercel.app`
- **Backend API:** Hosted on **Render** - `https://pump-api.onrender.com`
- **Database:** **Supabase** PostgreSQL

**Features:**
- Create and manage workout programs
- Track workouts in real-time
- Log exercises with sets, reps, and weights
- View workout history and progress
- Track personal records (PRs)
- Authenticate via email/password or Google OAuth

---

## Technology Stack

### Frontend (Client)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool & dev server |
| TailwindCSS | 4.1.17 | Styling |
| React Router DOM | 7.9.6 | Client-side routing |
| Axios | 1.13.2 | HTTP client |
| Recharts | 3.5.0 | Charts for progress visualization |

**Production:** Vercel (`https://pump-client.vercel.app`)  
**Local Development:** `http://localhost:5173`

### Backend (Server)
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime |
| Express | 5.1.0 | Web framework |
| TypeScript | 5.9.3 | Type safety |
| Prisma | 7.0.0 | ORM |
| PostgreSQL | - | Database (Supabase) |
| Passport.js | 0.7.0 | Authentication |
| JWT | 9.0.2 | Token-based auth |
| bcrypt | 6.0.0 | Password hashing |
| Nodemailer | 7.0.10 | Email service |

**Production:** Render (`https://pump-api.onrender.com`)  
**Local Development:** `http://localhost:5000`

---

## Project Structure

```
Pump/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AddDayModal.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── EditExerciseModal.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseModal.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── WorkoutSummaryModal.tsx
│   │   ├── pages/               # Route page components
│   │   │   ├── ActiveWorkoutPage.tsx
│   │   │   ├── CreateProgramPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ExerciseLibrary.tsx
│   │   │   ├── ExerciseProgressPage.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── PersonalRecordsPage.tsx
│   │   │   ├── ProgramDetailsPage.tsx
│   │   │   ├── ProgramsPage.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── WorkoutDetailsPage.tsx
│   │   │   └── WorkoutHistoryPage.tsx
│   │   ├── services/            # API client services
│   │   │   ├── apiClient.ts     # Axios instance with auth
│   │   │   ├── auth.ts          # Auth API calls
│   │   │   ├── exerciseService.ts
│   │   │   ├── programService.ts
│   │   │   └── workoutService.ts
│   │   ├── App.tsx              # Main app with routing
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── public/
│   │   └── logo.png             # App logo/favicon
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── vercel.json              # Vercel deployment config
│
├── server/                      # Backend Express application
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── dayController.ts
│   │   │   ├── exerciseController.ts
│   │   │   ├── migrationController.ts
│   │   │   ├── programController.ts
│   │   │   └── workoutController.ts
│   │   ├── routes/              # API route definitions
│   │   │   ├── authRoutes.ts
│   │   │   ├── dayRoutes.ts
│   │   │   ├── dayExerciseRoutes.ts
│   │   │   ├── exerciseRoutes.ts
│   │   │   ├── programRoutes.ts
│   │   │   └── workoutRoutes.ts
│   │   ├── services/            # Business logic services
│   │   │   ├── emailService.ts
│   │   │   └── workoutService.ts
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT authentication middleware
│   │   ├── config/
│   │   │   └── passport.ts      # Google OAuth config
│   │   ├── prisma.ts            # Prisma client instance
│   │   └── app.ts               # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.sql             # Exercise database seed
│   │   └── migrations/          # Database migrations
│   ├── package.json
│   └── tsconfig.json
│
├── .github/workflows/           # GitHub Actions
│   ├── keep-alive.yml           # Server keep-alive ping
│   └── sync-to-azure-devops.yml # Azure DevOps sync
│
├── README.md
├── DEPLOYMENT_GUIDE.md
├── ENVIRONMENT_SETUP.md
└── GOOGLE_OAUTH_SETUP.md
```

---

## Database Schema (PostgreSQL + Prisma)

### Models

#### User
```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  password             String
  firstName            String
  lastName             String
  googleId             String?   @unique
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

#### Exercise
```prisma
model Exercise {
  id               String   @id @default(uuid())
  nameEn           String   // English name
  nameHe           String   // Hebrew name
  descriptionHe    String   @db.Text
  muscleGroups     String[] // ["Chest", "Triceps", "Shoulders"]
  workoutTypes     String[] // ["Push", "Upper", "Full Body"]
  difficulty       String   // "Beginner", "Intermediate", "Advanced"
  equipment        String[] // ["Barbell", "Bench"]
}
```

#### WorkoutProgram
```prisma
model WorkoutProgram {
  id        String @id @default(uuid())
  userId    String
  name      String       // "My PPL Program"
  splitType String       // "PPL", "UPPER_LOWER", "FULL_BODY", etc.
  isActive  Boolean @default(true)
  days      WorkoutDay[]
}
```

#### WorkoutDay
```prisma
model WorkoutDay {
  id         String @id @default(uuid())
  programId  String
  name       String        // "Push Day", "Leg Day"
  dayType    String?       // "PUSH", "PULL", "LEGS"
  orderIndex Int
  exercises  DayExercise[]
}
```

#### DayExercise
```prisma
model DayExercise {
  id           String @id @default(uuid())
  dayId        String
  exerciseId   String
  orderIndex   Int
  targetSets   Int    @default(3)
  targetReps   Int    @default(10)
  targetWeight Float?
  notes        String?
}
```

#### WorkoutLog
```prisma
model WorkoutLog {
  id          String    @id @default(uuid())
  userId      String
  dayId       String?
  dayName     String
  programName String
  startTime   DateTime  @default(now())
  endTime     DateTime?
  duration    Int?      // minutes
  status      String    @default("in_progress") // "in_progress" | "completed" | "cancelled"
  exerciseLogs ExerciseLog[]
}
```

#### ExerciseLog
```prisma
model ExerciseLog {
  id            String  @id @default(uuid())
  workoutLogId  String
  exerciseId    String
  exerciseName  String
  sets          Json    // [{ setNumber, weight, reps, completed, timestamp }]
  isWeightPR    Boolean @default(false)
  isVolumePR    Boolean @default(false)
  isRepsPR      Boolean @default(false)
}
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with email/password | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/google` | Initiate Google OAuth | No |
| GET | `/google/callback` | Google OAuth callback | No |

### Exercises (`/api/exercises`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all exercises | Yes |
| GET | `/:id` | Get exercise by ID | Yes |
| GET | `/search?q=...` | Search exercises | Yes |

### Programs (`/api/programs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's programs | Yes |
| GET | `/:id` | Get program by ID | Yes |
| POST | `/` | Create new program | Yes |
| PUT | `/:id` | Update program | Yes |
| DELETE | `/:id` | Delete program | Yes |

### Days (`/api/programs/:programId/days`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Add day to program | Yes |
| PUT | `/:dayId` | Update day | Yes |
| DELETE | `/:dayId` | Delete day | Yes |

### Day Exercises (`/api/days/:dayId/exercises`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Add exercise to day | Yes |
| PUT | `/:exerciseId` | Update day exercise | Yes |
| DELETE | `/:exerciseId` | Remove exercise from day | Yes |

### Workouts (`/api/workouts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/start` | Start new workout | Yes |
| GET | `/active` | Get active workout | Yes |
| POST | `/:id/sets` | Log a set | Yes |
| PATCH | `/:workoutLogId/sets/:exerciseLogId/:setIndex` | Update a set | Yes |
| DELETE | `/:workoutLogId/sets/:exerciseLogId/:setIndex` | Delete a set | Yes |
| PATCH | `/:id/finish` | Finish workout | Yes |
| GET | `/` | Get workout history | Yes |
| GET | `/:id` | Get workout details | Yes |
| DELETE | `/:id` | Delete workout | Yes |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/progress/:exerciseId` | Get exercise progress | Yes |
| GET | `/personal-records` | Get all PRs | Yes |

---

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/dashboard` |
| `/login` | Login | Login page |
| `/register` | Register | Registration page |
| `/forgot-password` | ForgotPassword | Request password reset |
| `/reset-password` | ResetPassword | Reset password form |
| `/dashboard` | Dashboard | Main dashboard (protected) |
| `/exercises` | ExerciseLibrary | Browse all exercises |
| `/programs` | ProgramsPage | View user's programs |
| `/programs/new` | CreateProgramPage | Create new program |
| `/programs/:id` | ProgramDetailsPage | View/edit program |
| `/workout/active` | ActiveWorkoutPage | Active workout session |
| `/workout/history` | WorkoutHistoryPage | Workout history |
| `/workout/:id` | WorkoutDetailsPage | View workout details |
| `/exercise/:exerciseId/progress` | ExerciseProgressPage | Exercise progress charts |
| `/personal-records` | PersonalRecordsPage | All personal records |

---

## Authentication Flow

### Email/Password
1. User registers with email, password, firstName, lastName
2. Password is hashed with bcrypt (10 salt rounds)
3. User logs in with email/password
4. Server returns JWT token (24h expiry)
5. Frontend stores token in localStorage
6. All protected API calls include `Authorization: Bearer <token>` header

### Google OAuth
1. User clicks "Sign in with Google"
2. Frontend redirects to `/api/auth/google`
3. Server redirects to Google OAuth
4. Google authenticates user
5. Google redirects to `/api/auth/google/callback`
6. Server creates/updates user, generates JWT
7. Server redirects to frontend with token in URL
8. Frontend extracts token and stores in localStorage

### Password Reset
1. User requests reset via email
2. Server generates JWT reset token (1h expiry)
3. Email sent with reset link (or token logged in dev mode)
4. User submits new password with token
5. Server verifies token and updates password

---

## Environment Variables

### Server Environment Variables (Render)
```env
DATABASE_URL=postgresql://user:pass@supabase-host:5432/postgres?sslmode=require
PORT=5000
JWT_SECRET=your-secret-key
SERVER_URL=https://pump-api.onrender.com
CLIENT_URL=https://pump-client.vercel.app
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email@gmail.com
EMAIL_PASSWORD=app-password
```

### Client Environment Variables (Vercel)
```env
VITE_API_URL=https://pump-api.onrender.com
```

### Local Development
For local development, use localhost URLs:
- `SERVER_URL=http://localhost:5000`
- `CLIENT_URL=http://localhost:5173`
- `VITE_API_URL=http://localhost:5000`

---

## Key User Flows for E2E Testing

### 1. User Registration Flow
1. Navigate to `/register`
2. Fill form: firstName, lastName, email, password
3. Submit form
4. Verify redirect to `/login`
5. Login with new credentials
6. Verify redirect to `/dashboard`

### 2. Login Flow
1. Navigate to `/login`
2. Enter email and password
3. Submit form
4. Verify token stored in localStorage
5. Verify redirect to `/dashboard`

### 3. Create Program Flow
1. Login as user
2. Navigate to `/programs`
3. Click "Create New Program"
4. Fill program name, select split type (e.g., "PPL")
5. Submit
6. Verify program created with default days
7. Navigate to program details
8. Add exercises to days

### 4. Workout Flow
1. Login as user
2. Navigate to program details
3. Click "Start Workout" on a day
4. Verify redirect to `/workout/active`
5. Log sets for each exercise (weight, reps)
6. Click "Finish Workout"
7. Verify workout summary modal
8. Confirm finish
9. Verify redirect to workout details or history

### 5. View Progress Flow
1. Login as user (with workout history)
2. Navigate to exercise in library
3. Click on exercise
4. View progress charts (weight over time, volume, etc.)
5. Verify chart displays historical data

### 6. Personal Records Flow
1. Login as user (with workout history)
2. Navigate to `/personal-records`
3. Verify PRs displayed (weight, volume, reps)
4. Click on a PR to view workout details

---

## Data Seeding

The database is seeded with 100 exercises in Hebrew and English:
- Push exercises (30): Bench press, shoulder press, tricep exercises, etc.
- Pull exercises (30): Pull-ups, rows, bicep exercises, etc.
- Leg exercises (25): Squats, leg press, calf raises, etc.
- Core exercises (15): Planks, crunches, leg raises, etc.

Run seed: `npx prisma db execute --file prisma/seed.sql`

---

## Production Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| **Frontend** | Vercel | `https://pump-client.vercel.app` |
| **Backend API** | Render | `https://pump-api.onrender.com` |
| **Database** | Supabase | PostgreSQL (managed) |

All deployments are automatic via GitHub integration.

---

## Running Locally

```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev

# Terminal 2: Start frontend
cd client
npm install
npm run dev

# Access: http://localhost:5173
```
