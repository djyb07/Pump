# PUMP - Fitness Tracking App

A full-stack workout tracking application with real-time exercise logging, personal records tracking, and progress visualization.

## Live Demo

- **Frontend:** [pump-client.vercel.app](https://pump-client.vercel.app)
- **Backend API:** [pump-api.onrender.com](https://pump-api.onrender.com)

## Features

- Create custom workout programs (PPL, Upper/Lower, Full Body)
- Real-time workout tracking with rest timer
- Automatic Personal Record (PR) detection
- Progress charts and statistics
- Gamified dashboard — workout streaks & level progression
- Authentication (Email/Password + Google OAuth)
- Dark theme, mobile-responsive UI

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS 4, lucide-react |
| **Backend** | Node.js, Express 5, Prisma 7 |
| **Database** | PostgreSQL (Supabase) with RLS |
| **Auth** | JWT, Passport.js, bcrypt |
| **Hosting** | Vercel (client), Render (server) |

## Quick Start

```bash
# Clone
git clone https://github.com/djyb07/Pump.git
cd Pump

# Server setup
cd server
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET
npx prisma generate
npm run dev

# Client setup (new terminal)
cd client
npm install
npm run dev

# Open http://localhost:5173
```

## Documentation

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for comprehensive documentation including:
- Database schema (8 models)
- Full API reference
- Authentication flows
- Security implementation
- E2E testing guide

## License

MIT
