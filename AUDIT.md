# PUMP — Pre-Commercial Code Audit (Phase 1: Investigate Only)

**Date:** 2026-08-10
**Commit audited:** `721f98f` (branch `main`, clean working tree)
**Scope:** Does it run · Documentation vs. reality · RLS enforcement · Authorization/IDOR · Secrets & config · Dependency vulnerabilities
**Changes made to the codebase:** none.

---

## Executive summary

The **application-layer authorization is, with one exception, correct**: every user-scoped query derives `userId` from the verified JWT (`req.user.id`), and no endpoint anywhere accepts a client-supplied `userId`. That is the good news, and it matters, because it is the *only* thing protecting user data.

The headline problems are:

1. **Supabase RLS is providing zero protection.** The policies are written against Supabase Auth (`auth.uid()`), but this app does not use Supabase Auth — it uses its own `User` table and its own JWTs, and Prisma connects over a plain `pg` pool that never sets any session claim. The policies cannot match, and the connection role bypasses them anyway. See [C1](#c1).
2. **A live database password is committed at HEAD, and a Google OAuth client secret is in git history.** See [C2](#c2).
3. **A working production account's credentials are committed in `tests/`** — I verified they log into the live app. See [C3](#c3).
4. **The server does not start** from a clean clone following the documented setup. See [H1](#h1).
5. **Several documented security controls do not exist as described.** Most importantly, "Zod validation on all mutations" is false for 6 endpoints, and the exercise endpoints documented as authenticated are fully public. See [Section 2](#2-documentation-vs-reality).
6. **There is no CI**, and the E2E suite that exists passes vacuously — it reports success while the flow under test demonstrably did not happen. See [H5](#h5), [H6](#h6).

Counts: **3 Critical · 8 High · 12 Medium · 11 Low**.

---

## Table of contents

- [1. Does it run?](#1-does-it-run)
- [2. Documentation vs. reality](#2-documentation-vs-reality)
- [3. Is Supabase RLS actually enforced?](#3-is-supabase-rls-actually-enforced)
- [4. Authorization audit — every endpoint](#4-authorization-audit--every-endpoint)
- [5. Secrets and config](#5-secrets-and-config)
- [6. Dependency vulnerabilities (reachable only)](#6-dependency-vulnerabilities-reachable-only)
- [Findings — Critical](#findings--critical)
- [Findings — High](#findings--high)
- [Findings — Medium](#findings--medium)
- [Findings — Low](#findings--low)
- [Appendix A: What I could not verify](#appendix-a-what-i-could-not-verify)

---

## 1. Does it run?

| Step | Result |
|---|---|
| `npm install` (server) | ✅ exit 0 |
| `npm install` (client) | ✅ exit 0 |
| `npx prisma generate` | ❌ fails without `DATABASE_URL` set; ✅ with any value present |
| `tsc --noEmit` (server) | ✅ exit 0 (after `prisma generate`) |
| `tsc -b` (client) | ✅ exit 0 |
| `npm run build` (client) | ✅ exit 0, 30.6s, 775 kB main chunk |
| `npm run build` (server) | ✅ (equivalent to the two steps above) |
| **Start server** | ❌ **crashes** unless `GOOGLE_CLIENT_ID` is set — see [H1](#h1) |
| Start server (with dummy Google creds) | ✅ listens, serves requests |
| `npm test` (server) | ❌ `"test": "echo \"Error: no test specified\" && exit 1"` — there is no server test suite |
| `npm test` (client) | ❌ no `test` script exists |
| `python run_all_tests.py` | ❌ **0/5 passed** on this machine; ✅ 5/5 with `PYTHONIOENCODING=utf-8` — but the passes are not meaningful, see [H5](#h5) |

### Verbatim failures

**Server startup, following the documented local env vars only** (`DATABASE_URL`, `JWT_SECRET`, `SERVER_URL`, `CLIENT_URL` — exactly what `PROJECT_DOCUMENTATION.md:876-882` lists):

```
C:\Users\djyb0\Pump\server\node_modules\passport-oauth2\lib\strategy.js:87
  if (!options.clientID) { throw new TypeError('OAuth2Strategy requires a clientID option'); }
                                 ^
TypeError: OAuth2Strategy requires a clientID option
    at Strategy.OAuth2Strategy (C:\Users\djyb0\Pump\server\node_modules\passport-oauth2\lib\strategy.js:87:34)
    at new Strategy (C:\Users\djyb0\Pump\server\node_modules\passport-google-oauth20\lib\strategy.js:52:18)
    at Object.<anonymous> (C:\Users\djyb0\Pump\server\src\config\passport.ts:8:5)
```

**`prisma generate` with no `DATABASE_URL`:**

```
Failed to load config file "C:\Users\djyb0\Pump\server" as a TypeScript/JavaScript module.
Error: PrismaConfigEnvError: Missing required environment variable: DATABASE_URL
```

**E2E suite, as documented (`cd tests && python run_all_tests.py`):**

```
============================================================
PUMP E2E TEST SUITE - Running all 5 tests
============================================================
============================================================
E2E TEST: User Registration Flow
============================================================

[STEP 1] Setting up Chrome WebDriver (headless mode)...

[CLEANUP] Closing browser...

============================================================
TEST FAILED
============================================================
   ... (identical for all 5) ...

SUMMARY: 0/5 passed
```

Note that **no error is printed at all** — see [H5](#h5) for the root cause (`UnicodeEncodeError` swallowed by `return` inside `finally`).

**Server `tsc --noEmit` before `prisma generate`** (relevant because `deploy.sh` runs `npm ci --only=production`, which omits the `prisma` CLI):

```
src/prisma.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
src/controllers/workoutController.ts(134,35): error TS7006: Parameter 'log' implicitly has an 'any' type.
   ... 8 more TS7006 ...
```

### Half-implemented features and dead code

| Item | Location | Status |
|---|---|---|
| Offline mutation queue | [useOfflineMutation.ts](client/src/hooks/useOfflineMutation.ts) | **Dead.** Documented across ~20 lines of `PROJECT_DOCUMENTATION.md`. Never imported by any component or page. The offline queue does not exist at runtime. |
| Legacy dashboard header | [DashboardHeader.tsx](client/src/components/dashboard/DashboardHeader.tsx) | **Dead.** Barrel-exported, never rendered. |
| AI Coach 502 error path | [aiController.ts:64-68](server/src/controllers/aiController.ts:64) | **Unreachable.** [aiService.ts:231-234](server/src/services/aiService.ts:231) catches *everything* and returns the mock report, so `LLM_EMPTY_RESPONSE` / `LLM_INVALID_FORMAT` never escape. |
| Freestyle / ad-hoc workouts | [workoutService.ts:135-146](server/src/services/workoutService.ts:135) | **Broken.** Documented as supported (`dayExerciseId` "nullable for ad-hoc/freestyle workouts"). When only `exerciseId` is sent, the lookup misses and the log is written with `exerciseId: ''` and `exerciseName: 'Unknown Exercise'`, silently excluding it from PRs, progress and the muscle heatmap. See [M2](#m2). |
| Prisma seed hook | [package.json:12-14](server/package.json:12) | **Dead.** Points at `prisma/seed.js`, which does not exist (only `seed.sql`). |
| Migration endpoint | [migrationController.ts](server/src/controllers/migrationController.ts) | Live and reachable by any user, but undocumented and unused by the client. See [M11](#m11). |
| `keep-alive.yml` | [.github/workflows/keep-alive.yml:17](.github/workflows/keep-alive.yml:17) | **Pings a dead Azure host**, not the Render deployment. See [L5](#l5). |

---

## 2. Documentation vs. reality

Each claim from `PROJECT_DOCUMENTATION.md` § *Security Features*, verified against code.

| # | Documented claim | Verdict | Evidence |
|---|---|---|---|
| 1 | "All mutation endpoints enforce strict runtime validation via Zod" (line 683) | ❌ **FALSE** | 6 mutation endpoints have no `validate()` middleware — [H2](#h2) |
| 2 | Helmet with CSP, HSTS, noSniff, strict referrer | ✅ **TRUE** | Verified on the wire: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, full CSP present |
| 3 | Rate limiting, auth 5/15min | ✅ **TRUE** | Verified: attempts 1–5 → `500`, attempts 6–8 → `429` |
| 4 | Rate limiting, global 100/min on `/api` | ✅ **TRUE** | [app.ts:76](server/src/app.ts:76) |
| 5 | Trust proxy so limiters see real client IPs | ⚠️ **PARTIALLY TRUE** | `app.set('trust proxy', 1)` is present and is correct *for Render's exact topology*. It provides no defense in depth: I bypassed the auth limiter from a hard `429` back to `500` on every request by adding one `X-Forwarded-For` header — [M1](#m1) |
| 6 | Safe user select — "centralised `SAFE_USER_SELECT` whitelist" | ⚠️ **PARTIALLY TRUE** | Used by `register`/`getMe`/`updateProfile`. `login` ([authController.ts:83](server/src/controllers/authController.ts:83)) bypasses it: it does an unfiltered `findUnique` (loading `password`, `resetPasswordToken`, `aiReport` into memory) and then hand-rolls the response field list. The response is safe today, but the safety is not centralised as claimed |
| 7 | Global error handler, never exposes stack traces | ✅ **TRUE** | Verified: foreign-origin request returned exactly `{"message":"Internal server error"}` |
| 8 | Mandatory `JWT_SECRET` "≥32 chars, fatal error on startup if missing" | ⚠️ **PARTIALLY TRUE** | Fatal if *missing* ✅. The ≥32-char rule is only a `console.warn` — a 4-character secret boots fine — [M5](#m5) |
| 9 | CORS: "all other origins rejected" | ⚠️ **PARTIALLY TRUE** | Origins *are* rejected, but by throwing into the error handler → `500 Internal Server Error` instead of a CORS-appropriate status, and every rejected request logs a full stack trace — [M3](#m3) |
| 10 | Health endpoint "returns only `{ status: 'ok' }` in production" | ⚠️ **PARTIALLY TRUE** | Returns `{status:'ok', database:{connected:true}}`. More importantly the production/dev switch is `NODE_ENV`-gated, and the endpoint tears down the shared connection pool on every call — [H6](#h6) |
| 11 | Exercises `/`, `/:id`, `/search` require Auth ✅ (lines 494-498) | ❌ **FALSE** | No `authenticateToken` on the router. Verified: unauthenticated `GET /api/exercises` reaches the database — [H3](#h3) |
| 12 | "All tables have Row Level Security enabled with policies ensuring users can only read/write their own data" (line 717) | ❌ **FALSE in effect** | Policies exist but cannot and do not apply — [C1](#c1) |
| 13 | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` listed as **Optional** (line 817-821) | ❌ **FALSE** | Server crashes on boot without them — [H1](#h1) |
| 14 | Offline mutation queue (`useOfflineMutation`) | ❌ **FALSE** | Hook exists, is never used — [L1](#l1) |
| 15 | `keep-alive.yml` "pings Render every 14 minutes" (line 132) | ❌ **FALSE** | Every 10 minutes, at an Azure hostname — [L5](#l5) |
| 16 | API reference verbs/paths (lines 500-535) | ❌ **FALSE** in 6 places | Docs say `PUT /programs/:id` → code is `PATCH`. Docs say `PUT|DELETE /programs/:programId/days/:dayId` → code is `PATCH|DELETE /days/:id`. Docs say `PUT|DELETE /days/:dayId/exercises/:exerciseId` → code is `PATCH|DELETE /day-exercises/:id`. `POST /api/migrations/recalculate-prs` is undocumented — [L4](#l4) |
| 17 | Warmup exclusion "applies across PRService, getExerciseProgress, and deleteWorkout" | ⚠️ **TRUE as stated, but incomplete** | Those three do exclude warmups. `getPersonalRecords` and `recalculatePRs` do not — the PRs page can show warmup-derived numbers — [M8](#m8) |
| 18 | bcrypt with exactly 10 salt rounds | ✅ **TRUE** | [authController.ts:23](server/src/controllers/authController.ts:23) |
| 19 | Body size limit 1 MB | ✅ **TRUE** | [app.ts:72](server/src/app.ts:72) |
| 20 | JWT payload "contains only userId (minimal claims)" | ⚠️ **TRUE for login only** | The Google callback signs `email`, `firstName`, `lastName` as well ([authController.ts:204-213](server/src/controllers/authController.ts:204)) |

---

## 3. Is Supabase RLS actually enforced?

**No. It is not enforced at all, and it cannot be.** Row Level Security in this deployment is decorative.

### Which role does `DATABASE_URL` connect as?

I could not read the deployed secret (it lives in Render's environment settings, not in the repo), so I cannot name the role with certainty — see [Appendix A](#appendix-a-what-i-could-not-verify). But the answer does not change the conclusion, because **the RLS policies fail closed for every non-owner role and are skipped entirely for the owner.** Both branches end in "provides zero protection":

**Branch A — Prisma connects as the table owner or a superuser (overwhelmingly likely).**
The only connection string that has ever appeared in this repo is `postgresql://pump:...@pump-db-server.postgres.database.azure.com/postgres` ([.env.example:4](server/.env.example:4)) — the admin role that created the schema. Supabase's own connection strings default to the `postgres` role, which owns every table Prisma migrates. **Postgres skips RLS for a table's owner unless the table is explicitly set to `FORCE ROW LEVEL SECURITY`.** [rls_enable_policies.sql](server/prisma/migrations/rls_enable_policies.sql) issues `ENABLE ROW LEVEL SECURITY` on all 8 tables (lines 67-74) and never issues `FORCE`. Every policy is therefore bypassed.

**Branch B — Prisma connects as some non-owner role.**
Then RLS would apply — and the application would be *completely broken*, returning zero rows for every query. Every policy is keyed on `auth.uid()`:

```sql
CREATE POLICY "Users can view own programs"
    ON "WorkoutProgram" FOR SELECT
    USING ("userId" = (select auth.uid())::text);
```

`auth.uid()` reads the `sub` claim out of a **Supabase GoTrue JWT** that the client passes through PostgREST. This application does not use Supabase Auth at all — it has its own `User` table with bcrypt hashes ([authController.ts:57](server/src/controllers/authController.ts:57)) and signs its own tokens ([authController.ts:101-105](server/src/controllers/authController.ts:101)). Prisma connects through a plain `pg` pool:

```ts
// server/src/prisma.ts:8-10
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

There is no `SET LOCAL request.jwt.claims`, no `SET ROLE authenticated`, no per-request session context anywhere in the codebase. `auth.uid()` would evaluate to `NULL` on every query, `"userId" = NULL::text` is `NULL` (not true), and every policy would deny. **The app demonstrably works in production, which is itself proof that Branch A is what is happening: RLS is being bypassed.**

Two further problems, moot today but worth recording:

- If the database is the Azure Postgres instance from `.env.example` rather than Supabase, the `auth` schema does not exist and `auth.uid()` is not a valid function — the script would have errored out entirely.
- The `DayExercise` UPDATE policy's `WITH CHECK` clause is malformed ([rls_enable_policies.sql:218-223](server/prisma/migrations/rls_enable_policies.sql:218)): it joins `"WorkoutProgram".id = "dayId"` (a day id compared against a program id) and has no `WHERE` clause at all. Even under a working RLS setup this policy would not do what it says.

### Which layer is actually enforcing authorization today?

> **The Express controllers and services are the sole enforcement layer.** Every protection against user A reading user B's data is a hand-written `where: { userId }` clause or an `if (record.userId !== userId)` check in TypeScript. There is no second line of defense. A single missing `where` clause in a future change is a full cross-tenant data breach, and nothing in the database, the tests, or CI would catch it.

The good news is that today those checks are, as far as I can determine by reading every one of them, correct — see [Section 4](#4-authorization-audit--every-endpoint). The bad news is that this is exactly the property the Phase 3 test suite needs to lock down, and it is currently untested.

**Smallest honest fix:** stop claiming RLS as a security control until it is real. Then either (a) accept app-layer-only authorization and make it verifiable — the Phase 3 suite plus a code-review rule — or (b) make RLS genuine: create a dedicated non-owner role for the app, `GRANT` it table access, `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all 8 tables, rewrite the policies against a custom GUC (e.g. `current_setting('app.user_id', true)`) instead of `auth.uid()`, and set that GUC per-request via a Prisma `$extends` client extension or an interactive transaction. Option (b) is a real project, not a patch.

**To confirm the role yourself,** run against the production `DATABASE_URL`:

```bash
psql "$DATABASE_URL" -c "select current_user, session_user, rolsuper, rolbypassrls from pg_roles where rolname = current_user;"
```

```bash
psql "$DATABASE_URL" -c "select relname, relrowsecurity, relforcerowsecurity, pg_get_userbyid(relowner) as owner from pg_class where relname in ('User','WorkoutProgram','WorkoutDay','DayExercise','WorkoutLog','ExerciseLog','ExerciseStats','Exercise');"
```

If `relforcerowsecurity` is `false` and `owner` equals `current_user`, RLS is bypassed — which is what the evidence says you will see.

---

## 4. Authorization audit — every endpoint

**37 routes.** Legend — **Owner check**: how the endpoint proves the caller owns the resource. ✅ = correct, ⚠️ = correct but wrong status code, ❌ = missing.

| # | Method | Path | Auth | `:id` param | Owner check | Zod |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | public | — | n/a | ✅ |
| 2 | POST | `/api/auth/login` | public | — | n/a | ✅ |
| 3 | POST | `/api/auth/forgot-password` | public | — | n/a | ✅ |
| 4 | POST | `/api/auth/reset-password` | public | — | JWT sig + DB token match + expiry ✅ | ✅ |
| 5 | GET | `/api/auth/me` | ✅ | — | self, `req.user.id` ✅ | n/a |
| 6 | PUT | `/api/auth/profile` | ✅ | — | self, `req.user.id` ✅ | ✅ |
| 7 | GET | `/api/auth/google` | public | — | n/a | n/a |
| 8 | GET | `/api/auth/google/callback` | public | — | n/a | n/a |
| 9 | GET | `/api/exercises` | ❌ **none** | — | shared reference data | n/a |
| 10 | GET | `/api/exercises/search` | ❌ **none** | — | shared reference data | n/a |
| 11 | GET | `/api/exercises/:id` | ❌ **none** | ✅ | shared reference data | n/a |
| 12 | GET | `/api/programs` | ✅ | — | `where:{userId}` ✅ | n/a |
| 13 | GET | `/api/programs/:id` | ✅ | ✅ | `findFirst{id,userId}` → 404 ✅ | n/a |
| 14 | POST | `/api/programs` | ✅ | — | `userId` from JWT ✅ | ❌ **none** |
| 15 | PATCH | `/api/programs/:id` | ✅ | ✅ | pre-check `findFirst{id,userId}` → 404 ✅ | ❌ **none** |
| 16 | DELETE | `/api/programs/:id` | ✅ | ✅ | pre-check → 404 ✅ | n/a |
| 17 | POST | `/api/programs/:programId/days` | ✅ | ✅ | program `findFirst{id,userId}` → 404 ✅ | ❌ **none** |
| 18 | PATCH | `/api/days/:id` | ✅ | ✅ | `findFirst{id, program:{userId}}` → 404 ✅ | ❌ **none** |
| 19 | DELETE | `/api/days/:id` | ✅ | ✅ | `findFirst{id, program:{userId}}` → 404 ✅ | n/a |
| 20 | POST | `/api/days/:dayId/exercises` | ✅ | ✅ | day `findFirst{id, program:{userId}}` → 404 ✅ | ❌ **none** |
| 21 | PATCH | `/api/day-exercises/:id` | ✅ | ✅ | `findFirst{id, day:{program:{userId}}}` → 404 ✅ | ❌ **none** |
| 22 | DELETE | `/api/day-exercises/:id` | ✅ | ✅ | `findFirst{id, day:{program:{userId}}}` → 404 ✅ | n/a |
| 23 | POST | `/api/workouts/start` | ✅ | body `dayId` | `day.program.userId !== userId` ⚠️ **500** | ✅ |
| 24 | GET | `/api/workouts/active` | ✅ | — | `where:{userId}` ✅ | n/a |
| 25 | POST | `/api/workouts/:id/sets` | ✅ | ✅ | workout owner ⚠️ **500**; **`dayExerciseId` unchecked** ❌ | ✅ |
| 26 | PATCH | `/api/workouts/:wId/sets/:elId/:idx` | ✅ | ✅ | workout `findFirst{id,userId}` + log scoped to workout → 404 ✅ | ✅ |
| 27 | DELETE | `/api/workouts/:wId/sets/:elId/:idx` | ✅ | ✅ | same ✅ | n/a |
| 28 | PATCH | `/api/workouts/:id/finish` | ✅ | ✅ | workout owner ⚠️ **500** | ✅ |
| 29 | GET | `/api/workouts` | ✅ | — | `where:{userId}` ✅ | n/a |
| 30 | GET | `/api/workouts/:id` | ✅ | ✅ | workout owner ⚠️ **500** | n/a |
| 31 | DELETE | `/api/workouts/:id` | ✅ | ✅ | `workout.userId !== userId` → **403** ✅ | n/a |
| 32 | GET | `/api/analytics/progress/:exerciseId` | ✅ | ✅ | logs scoped by `workoutLog:{userId}` ✅ (`:exerciseId` is shared reference data) | n/a |
| 33 | GET | `/api/analytics/personal-records` | ✅ | — | `workoutLog:{userId}` ✅ | n/a |
| 34 | GET | `/api/analytics/muscle-recovery` | ✅ | — | `where:{userId}` ✅ | n/a |
| 35 | POST | `/api/migrations/recalculate-prs` | ✅ | — | `where:{userId}` ✅ | n/a |
| 36 | GET | `/` | public | — | n/a | n/a |
| 37 | GET | `/api/health/db` | ❌ **none** | — | n/a — leaks in non-prod, see [H6](#h6) | n/a |

### Verdict

- **No IDOR found on any user-scoped resource.** Every one of the 18 endpoints that takes an `:id` for user-owned data verifies ownership before reading or writing. Endpoints 13, 15–22, 26, 27 use a scoped `findFirst`, which is the strongest pattern here (the ownership predicate is in the query, so it cannot be forgotten between check and use). Endpoints 23, 25, 28, 30, 31 fetch-then-compare, which is correct but more fragile.
- **No endpoint trusts a client-supplied `userId`.** I grepped every occurrence of `userId` in `server/src` (98 hits): every one originates from `req.user!.id` / `req.user?.id`, i.e. the verified JWT. There is no `req.body.userId`, `req.query.userId`, or `req.params.userId` anywhere.
- **One unverified cross-user reference:** `POST /api/workouts/:id/sets` will happily attach *another user's* `DayExercise` id to your own workout log — see [M2](#m2). It is not a read of another user's data, but it is an unvalidated cross-tenant foreign key.
- **Four endpoints return `500` instead of `403`** when you touch someone else's workout. They fail *closed*, so this is not a data leak — but it is a broken contract and it hides real authorization failures inside generic error noise. See [H4](#h4).

---

## 5. Secrets and config

### Committed credentials

| What | Where | Live at HEAD? | In history? |
|---|---|---|---|
| Postgres password `Djyb1234` for `pump@pump-db-server.postgres.database.azure.com` | [.env.example:4](server/.env.example:4) | ✅ **yes** | ✅ all 30+ commits |
| Google OAuth client secret `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` | `server/.env.example` | ❌ removed in `34aa89c` | ✅ **yes**, `34aa89c^` |
| Google OAuth client ID `241234177274-dv7fvfu859e42nstq13almmo9livm7f2...` | `server/.env.example` | ❌ removed in `34aa89c` | ✅ **yes** |
| Working production login `test@example.com` / `TestPassword123!` | [test_login.py:40-41](tests/test_login.py:40) + 3 other test files | ✅ **yes** | ✅ yes |

Commit `34aa89c` ("Remove real credentials from .env.example") replaced the Google values with placeholders **but left the database URL untouched**, and rewriting the working tree does not remove anything from git history. No `.env` file has ever been committed — `.gitignore` handles that correctly.

### `.env.example` vs. what the code actually reads

| Variable | Read at | In `.env.example`? | Notes |
|---|---|---|---|
| `DATABASE_URL` | [prisma.ts:8](server/src/prisma.ts:8) | ✅ (with a real password) | required |
| `JWT_SECRET` | [validateEnv.ts:30](server/src/config/validateEnv.ts:30) | ✅ | required; length only warned |
| `PORT` | [app.ts:139](server/src/app.ts:139) | ✅ | |
| `CLIENT_URL` | [app.ts:62](server/src/app.ts:62), [authController.ts:216](server/src/controllers/authController.ts:216), [emailService.ts:27](server/src/services/emailService.ts:27) | ✅ | |
| `SERVER_URL` | [passport.ts:5](server/src/config/passport.ts:5) | ✅ | |
| `GOOGLE_CLIENT_ID` / `_SECRET` | [passport.ts:10-11](server/src/config/passport.ts:10) | ✅ (placeholders) | **effectively required** — [H1](#h1) |
| `EMAIL_*` | [emailService.ts:10-18](server/src/services/emailService.ts:10) | ✅ (commented out) | optional, genuinely |
| `NODE_ENV` | [app.ts:21](server/src/app.ts:21), [app.ts:93](server/src/app.ts:93), [authController.ts:153](server/src/controllers/authController.ts:153) | ❌ **missing** | controls whether `/api/health/db` leaks internals and whether reset tokens are returned in HTTP responses — [H6](#h6) |
| `GROQ_API_KEY` | [aiService.ts:191](server/src/services/aiService.ts:191) | ❌ **missing** | documented in `PROJECT_DOCUMENTATION.md` but absent from `.env.example` |
| `VITE_API_URL` | [apiClient.ts:3](client/src/services/apiClient.ts:3) | ❌ no `client/.env.example` exists at all | |

### CORS

`origin` callback allows `CLIENT_URL` **or any request with no `Origin` header**, `credentials: true`, no wildcard. Functionally sound for a browser client. Two issues: rejection produces a `500` with a logged stack trace ([M3](#m3)), and a single hardcoded `CLIENT_URL` means preview/staging deployments cannot call the API.

### JWT expiry and refresh

- Login token: `24h` ([authController.ts:104](server/src/controllers/authController.ts:104)). Google token: `24h` ([authController.ts:212](server/src/controllers/authController.ts:212)).
- **There is no refresh token and no refresh endpoint.** After 24 hours the user is hard-logged-out mid-session; the axios interceptor wipes storage and hard-navigates to `/login` ([apiClient.ts:32-38](client/src/services/apiClient.ts:32)). If that happens during a workout, unsaved state is lost. For a commercial product this is a UX cliff.
- Tokens live in `localStorage` and are therefore readable by any XSS. The OAuth token additionally transits in a URL query string — [H8](#h8).
- `alg: none` and malformed tokens are correctly rejected (I tested both → `403`).
- There is no server-side revocation: a stolen token is valid for its full 24h with no way to invalidate it.

### Password reset token flow

1. `POST /forgot-password` → **404 if the email is unknown** ([authController.ts:130-133](server/src/controllers/authController.ts:130)) — a user-enumeration oracle, see [M4](#m4).
2. Signs a 1h JWT and stores **the token itself, in plaintext**, in `User.resetPasswordToken` ([authController.ts:142](server/src/controllers/authController.ts:142)) — anyone with read access to the users table can reset any account, see [M6](#m6).
3. Emails the link, or logs the full reset URL to stdout when SMTP is unconfigured ([emailService.ts:32-38](server/src/services/emailService.ts:32)) — that lands in Render's log stream.
4. `POST /reset-password` verifies signature + DB match + expiry, then clears the token ✅. Single-use is correctly enforced.
5. **`/reset-password` is the one auth route with no rate limiter** ([authRoutes.ts:21](server/src/routes/authRoutes.ts:21)) — the token is an unguessable JWT so this is low-risk, but it is an inconsistency.
6. Resetting a password does **not** invalidate existing JWTs — an attacker who stole a token keeps access after the victim resets.

---

## 6. Dependency vulnerabilities (reachable only)

`npm audit`: **server 40** (1 critical, 15 high, 24 moderate) · **client 22** (17 high, 4 moderate, 1 low). Filtering to what is actually reachable from this code:

### Reachable — worth fixing

| Package | Sev | Advisory | Why it is reachable | Fix |
|---|---|---|---|---|
| **jws** (via `jsonwebtoken`) | High 7.5 | [GHSA-869p-cjfg-cm3x](https://github.com/advisories/GHSA-869p-cjfg-cm3x) — improperly verifies HMAC signature | This is the signature layer under every `jwt.verify()` in [auth.ts:30](server/src/middleware/auth.ts:30) and [authController.ts:166](server/src/controllers/authController.ts:166). It *is* the authentication system | `npm audit fix` (non-breaking) |
| **express-rate-limit** | High 7.5 | [GHSA-46wh-pxpv-q5gq](https://github.com/advisories/GHSA-46wh-pxpv-q5gq) — IPv4-mapped IPv6 addresses bypass per-client limiting on dual-stack servers | Direct dependency; the auth limiter is the only brute-force defense on `/login` | `npm audit fix` (non-breaking) |
| **axios** (client) | High, up to 8.7 | Prototype-pollution gadget family (config merge → credential theft / request hijack / header injection), plus ReDoS 7.5 | Shipped in the browser bundle; carries the `Authorization` header on every request | `npm audit fix` (patch, non-breaking) |
| **react-router-dom / react-router** | High 8.0 | Open redirect via backslash in `<Link>`/`useNavigate`; open redirect → XSS | Shipped in the browser bundle. The SSR/RSC/single-fetch advisories in the same batch do **not** apply (SPA-only, no SSR) | `npm audit fix` (patch) |
| **qs / body-parser** | Moderate 3.7–5.3 | Array-limit bypass → memory-exhaustion DoS via query strings | Express parses `req.query` on every request | `npm audit fix` |
| **nodemailer** | High 7.5 | 7 advisories, incl. `addressparser` recursive DoS | Used in [emailService.ts](server/src/services/emailService.ts). **Low practical reachability** — the app never sets `envelope`, `raw`, or a custom transport name, and `to` is a Zod-validated email. Listed for completeness | requires **nodemailer@9.0.5, a major bump** |

### Present but **not** reachable — noise, do not chase

- **fast-xml-parser (the only Critical, CVSS 9.3)** — reaches the tree solely through `@types/nodemailer` → `@aws-sdk/client-sesv2` → `@aws-sdk/xml-builder`. No SES or XML code path exists here. **However**, the reason a types package drags 20+ runtime AWS packages into the production image is a real packaging bug: all nine `@types/*` packages *and* `typescript` are in `dependencies` instead of `devDependencies` ([package.json:22-30, 43](server/package.json:22)). See [M9](#m9) — fixing that removes the Critical from the production tree outright.
- **prisma, @prisma/config, @prisma/dev, effect, hono, defu, valibot, chevrotain, @mrleebo/prisma-ast, lodash, ip-address** — all pulled by the Prisma CLI, which `@prisma/client@7` depends on. CLI/build-time code paths only.
- **path-to-regexp (High 7.5, ReDoS)** — route patterns are author-defined string literals, never user input.
- **form-data (High 7.5, CRLF)** — no multipart uploads anywhere in the app.
- **Client build toolchain** — `vite`, `postcss`, `rollup`, `@babel/*`, `workbox-build`, `serialize-javascript`, `minimatch`, `brace-expansion`, `js-yaml`, `picomatch`, `nanoid`, `flatted`, `fast-uri`, `ajv`, `follow-redirects`, `lodash`. Build-time only; none ship in the browser bundle.

---

# Findings — Critical

<a id="c1"></a>
## C1 · Supabase RLS provides zero protection; app code is the only authorization layer

**Where:** [server/prisma/migrations/rls_enable_policies.sql:67-74](server/prisma/migrations/rls_enable_policies.sql:67) (`ENABLE` without `FORCE`), whole file (`auth.uid()`); [server/src/prisma.ts:8-10](server/src/prisma.ts:8)

**What is wrong:** Every policy is written against Supabase Auth's `auth.uid()`, but the app authenticates users itself and connects to Postgres over a plain `pg` pool that never sets a session claim or role. `auth.uid()` is `NULL` for every Prisma query. Separately, the tables are only `ENABLE ROW LEVEL SECURITY`, never `FORCE`, so the owning role — which is what `DATABASE_URL` connects as — skips RLS entirely. Full reasoning in [Section 3](#3-is-supabase-rls-actually-enforced).

**Why it matters:** `PROJECT_DOCUMENTATION.md:715-727` and `README.md:26` sell RLS as a database-level guarantee that "users can only read/write their own data." There is no such guarantee. Every protection is a hand-written `where: { userId }` in TypeScript, with no backstop: one missing clause in one future PR is a full cross-tenant breach, and nothing — not the database, not the tests, not CI — would catch it. Before this becomes a commercial product with a real customer list, that gap needs to be either closed or consciously accepted and compensated for.

**Smallest fix:** Correct the documentation first — delete the RLS claims from `PROJECT_DOCUMENTATION.md:715-727` and `README.md:26` and state plainly that authorization is enforced in the API layer. That is a one-commit change and it stops the false assurance immediately. Making RLS genuinely work is a separate project (dedicated non-owner role + `FORCE ROW LEVEL SECURITY` + policies against a per-request GUC + a Prisma client extension to set it); it should not be attempted as part of a fix-up pass.

---

<a id="c2"></a>
## C2 · Live database password committed at HEAD; Google OAuth secret in git history

**Where:** [server/.env.example:4](server/.env.example:4); Google secret at `34aa89c^:server/.env.example`

```
DATABASE_URL="postgresql://pump:Djyb1234@pump-db-server.postgres.database.azure.com:5432/postgres?sslmode=require"
```

```
GOOGLE_CLIENT_ID=241234177274-dv7fvfu859e42nstq13almmo9livm7f2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**What is wrong:** A complete database connection string — host, role, and password — sits in the current tree of a repository whose README links a public GitHub URL. The Google OAuth client secret was removed from the tree in `34aa89c` but remains fully recoverable from history (`git show 34aa89c^:server/.env.example`).

**Why it matters:** If `pump-db-server.postgres.database.azure.com` is still reachable, anyone who has cloned the repo has admin credentials to it. Because RLS is bypassed ([C1](#c1)), that is unrestricted read/write to every user's data. The OAuth client secret allows minting tokens against your Google OAuth app. Both must be treated as compromised — a leaked secret is compromised the moment it is pushed, regardless of whether abuse is observed.

**Smallest fix:** Three steps, in order.
1. **Rotate both now**, before touching the repo: change the Postgres password (or drop the `pump` role if that server is decommissioned), and regenerate the OAuth client secret in Google Cloud Console.
2. Replace line 4 of `.env.example` with a placeholder: `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"`.
3. Purge history with `git filter-repo --path server/.env.example --invert-paths` (or BFG) and force-push, then have every clone re-clone. Step 3 is optional if step 1 is done properly — rotation is what actually stops the bleeding.

---

<a id="c3"></a>
## C3 · Working production account credentials committed in the test suite

**Where:** [tests/test_login.py:40-41](tests/test_login.py:40), [tests/test_create_program.py:46-47](tests/test_create_program.py:46), [tests/test_workout_flow.py:45-46](tests/test_workout_flow.py:45), [tests/test_view_progress.py:39-40](tests/test_view_progress.py:39)

```python
TEST_USER = {
    "email": "test@example.com",      # Replace with valid email
    "password": "TestPassword123!"    # Replace with valid password
}
```

**What is wrong:** These are not placeholders despite the comment. I ran the suite and **they authenticated successfully against `https://pump-client.vercel.app`**, reaching `/dashboard`. A live production account's credentials are committed in the repo.

**Why it matters:** Anyone with the repo has a working account on the production system. Compounding it, the tests point `BASE_URL` at production, so **running the documented test command writes to the production database** — my single run created a real program (`Test PPL 1786388389`, id `d6de0743-a7cc-4544-b4df-435ff400f3ed`) and registered a real user. Every CI run or curious contributor pollutes live data.

**Smallest fix:** Change that password in production now. Then read credentials from the environment with no default — `TEST_USER = {"email": os.environ["PUMP_TEST_EMAIL"], "password": os.environ["PUMP_TEST_PASSWORD"]}` — and make `BASE_URL` `os.environ.get("PUMP_BASE_URL", "http://localhost:5173")` so the default target is local, not production.

---

# Findings — High

<a id="h1"></a>
## H1 · Server crashes on startup without `GOOGLE_CLIENT_ID`, which the docs call optional

**Where:** [server/src/config/passport.ts:10-11](server/src/config/passport.ts:10); docs at `PROJECT_DOCUMENTATION.md:817-821`

```ts
clientID: process.env.GOOGLE_CLIENT_ID || '',
clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
```

**What is wrong:** `passport-oauth2` rejects an empty `clientID` with a `TypeError` at module-load time (verbatim trace in [Section 1](#verbatim-failures)). The `|| ''` fallback converts "unset" into "invalid" instead of "skip". `validateEnv.ts` does not check these, so the crash arrives as a raw stack trace rather than the clean fatal message the file exists to produce.

**Why it matters:** A new developer following `PROJECT_DOCUMENTATION.md:876-882` — which lists only `DATABASE_URL`, `JWT_SECRET`, `SERVER_URL`, `CLIENT_URL` — cannot start the server. The same is true of any deployment that does not want Google sign-in. The documentation actively misleads by listing these as optional.

**Smallest fix:** Register the strategy conditionally in `passport.ts`:

```ts
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({ /* ... */ }));
} else {
    console.warn('INFO: Google OAuth not configured — /api/auth/google disabled.');
}
```

Then either fix the docs or add the two vars to `validateRequiredEnv()` — but not both.

---

<a id="h2"></a>
## H2 · Zod validation is absent from 6 mutation endpoints, contradicting the documented guarantee

**Where:** [programRoutes.ts:19-20](server/src/routes/programRoutes.ts:19), [dayRoutes.ts:15-16](server/src/routes/dayRoutes.ts:15), [dayExerciseRoutes.ts:15-16](server/src/routes/dayExerciseRoutes.ts:15); claim at `PROJECT_DOCUMENTATION.md:683`

**What is wrong:** `POST /programs`, `PATCH /programs/:id`, `POST /programs/:programId/days`, `PATCH /days/:id`, `POST /days/:dayId/exercises`, `PATCH /day-exercises/:id` have no `validate()` middleware. They fall back to ad-hoc truthiness checks — `if (!name || !splitType)` ([programController.ts:89](server/src/controllers/programController.ts:89)), `if (!name)` ([dayController.ts:152](server/src/controllers/dayController.ts:152)), `if (!exerciseId)` ([dayController.ts:15](server/src/controllers/dayController.ts:15)) — and nothing else. The documentation states flatly that all mutation endpoints are Zod-validated, and every controller in those files carries a comment asserting pre-validated input.

**Why it matters:** Unbounded strings go straight to the database: `name` on a program or day has no length cap, so a 1 MB name (the body limit) is persisted and then rendered on every dashboard load. `splitType` accepts arbitrary values — anything not in the `getDaysForSplit` map silently creates a program with zero days ([programController.ts:213](server/src/controllers/programController.ts:213)), which is a dead-end for the user. `targetSets` / `targetReps` accept negative numbers and non-integers. And `exerciseId` is never checked to exist, so a bad value produces a Prisma foreign-key error surfaced as an opaque 500.

**Smallest fix:** Add `server/src/validation/programSchemas.ts` mirroring the existing schema files, then attach `validate(...)` to those six routes. No controller changes required — the controllers already assume validated input.

---

<a id="h3"></a>
## H3 · `/api/exercises/*` requires no authentication, contrary to the documented API reference

**Where:** [server/src/routes/exerciseRoutes.ts:7,10,13](server/src/routes/exerciseRoutes.ts:7); docs at `PROJECT_DOCUMENTATION.md:494-498`

**What is wrong:** The router never calls `authenticateToken`. The docs mark all three endpoints Auth ✅. Verified on the wire: `GET /api/exercises` with no token reached the database (returned a DB-connection 500, not a 401 — a protected route returns `{"error":"Access token required"}` with 401, which I confirmed against `/api/programs`).

**Why it matters:** The data itself is a public exercise catalogue, so the confidentiality impact is small. The real problems are (a) the documentation is wrong about the security posture, which is exactly the kind of thing an acquirer or security reviewer checks, and (b) three unauthenticated endpoints run unbounded database queries. `GET /api/exercises` returns all 100+ rows with no pagination, and `/search` runs a `contains` scan, guarded only by the global 100-req/min limiter.

**Smallest fix:** Add `router.use(authenticateToken);` after line 4 of `exerciseRoutes.ts` — the client already sends the token on every request via the axios interceptor, so nothing breaks. If public access is genuinely wanted, fix the docs instead and say so deliberately.

---

<a id="h4"></a>
## H4 · Cross-user access to workouts returns 500 instead of 403

**Where:** [workoutService.ts:48](server/src/services/workoutService.ts:48), [:99](server/src/services/workoutService.ts:99), [:177](server/src/services/workoutService.ts:177), [:355](server/src/services/workoutService.ts:355)

```ts
if (workout.userId !== userId) {
    throw new Error('Unauthorized');
}
```

**What is wrong:** These plain `Error`s are thrown from async controllers with no `try/catch`. Express 5 forwards them to `globalErrorHandler`, which returns `500 {"message":"Internal server error"}`. Affects `POST /workouts/start`, `POST /workouts/:id/sets`, `PATCH /workouts/:id/finish`, `GET /workouts/:id`. `getWorkoutById`'s "Workout not found" takes the same path, so a missing workout is also a 500. The header comment at [workoutController.ts:12-13](server/src/controllers/workoutController.ts:12) claims the opposite: *"Domain errors from services (e.g. 'Workout not found') are caught and returned as appropriate HTTP status codes."* There is no such catch.

**Why it matters:** Authorization still **fails closed** — no data leaks — so this is not a breach. But it is a broken API contract, and operationally it is worse than it looks: genuine authorization failures are indistinguishable from real server faults in the logs, so an actual attack in progress looks like ordinary 500 noise. It also means the client cannot react correctly (the axios interceptor logs users out on 401/403; a 500 leaves them staring at a broken page). And a Phase 3 test asserting "user A gets 403" would fail against correct-but-mislabelled behaviour.

**Smallest fix:** Define typed errors and map them once. Minimal version — add a `status` to the thrown errors and honour it in the handler:

```ts
// workoutService.ts
const err = new Error('Forbidden'); (err as any).status = 403; throw err;
```
```ts
// errorHandler.ts — before the generic 500
const status = (err as any).status;
if (status && status < 500) { res.status(status).json({ message: err.message }); return; }
```

---

<a id="h5"></a>
## H5 · The E2E suite reports success without testing anything, and fails silently on Windows

**Where:** [tests/test_workout_flow.py:392](tests/test_workout_flow.py:392), [tests/test_view_progress.py:250](tests/test_view_progress.py:250); silent-failure mechanism at [test_login.py:201](tests/test_login.py:201) and the four sibling files

**Two separate defects.**

**(a) The tests pass vacuously.** From my run of `test_workout_flow.py`:

```
[STEP 6] Adding a set with weight and reps...
! Could not add set: Message: no such element: Unable to locate element:
  {"method":"xpath","selector":"//button[contains(text(), 'Log Set')] | //button[contains(text(), 'Update Set')]"}
  Continuing with workout finish...
[STEP 8] Confirming workout finish in modal...
! No confirmation modal found (may have auto-confirmed)
[STEP 9] Verifying redirection to workout history/details...
  Current URL: https://pump-client.vercel.app/workout/active?dayId=9d4db59d-...
✓ Successfully redirected to workout history/details page
TEST PASSED
```

The set was never logged, the workout never finished, the page never navigated — and the test passed. The assertion at line 392 is `if "/workout/history" in current_url or "/workout/" in current_url:`, and `"/workout/"` matches `/workout/active`, the page it never left. `test_view_progress.py:250` has the same shape: it clicks the nav link `Exercises`, the URL does not change, and it prints `✓ ASSERTION PASSED: Successfully navigated to exercise page`.

**(b) Every test fails silently on any non-UTF-8 console.** All five print `✓`; on a `cp1252` console (Windows default) that raises `UnicodeEncodeError`. The `except Exception` handler then tries to print `✗`, which raises again — and `return test_passed` inside the `finally` block ([test_login.py:201](tests/test_login.py:201) and 4 others, each already flagged by Python's own `SyntaxWarning: 'return' in a 'finally' block`) **discards the in-flight exception**. You get `TEST FAILED` with zero diagnostic output. `PYTHONIOENCODING=utf-8 python run_all_tests.py` yields 5/5.

**Why it matters:** This is the only automated test coverage in the repository, and it provides no regression protection whatsoever — it will report green through a total breakage of set logging or workout completion. That is worse than no tests, because it manufactures false confidence. It is also the wrong foundation for the Phase 3 authorization suite: a security test that cannot fail is worthless.

**Smallest fix:** For (b), add `sys.stdout.reconfigure(encoding="utf-8")` at the top of `run_all_tests.py` and move each `return test_passed` out of its `finally` block. For (a), tighten the assertions — line 392 should be `if "/workout/history" in current_url or re.search(r"/workout/[0-9a-f-]{36}", current_url):` — and turn the `! Could not add set` warning path into a hard failure. Longer term, the Phase 3 suite should be API-level (`requests` against a seeded local server), not Selenium against production.

---

<a id="h6"></a>
## H6 · `/api/health/db` disconnects the shared Prisma pool, and leaks internals whenever `NODE_ENV !== 'production'`

**Where:** [server/src/app.ts:94-134](server/src/app.ts:94), specifically the `finally` at [:131-133](server/src/app.ts:131) and the dev branch at [:103-122](server/src/app.ts:103)

```ts
} finally {
    await prisma.$disconnect();
}
```

**What is wrong:** Two problems in one unauthenticated endpoint.

*Pool teardown:* `prisma` is the process-wide singleton from [prisma.ts](server/src/prisma.ts). Calling `$disconnect()` on it in a request handler tears down the connection pool that every other in-flight request is using. The keep-alive workflow is designed to hit exactly this endpoint on a schedule.

*Information disclosure:* `isProduction` is evaluated once at module load from `NODE_ENV` ([app.ts:93](server/src/app.ts:93)). `NODE_ENV` is **not in `.env.example`** and is not set by `deploy.sh` or `startup.sh`. If it is unset on the deployed host, this public endpoint returns the Postgres version string, the total user count, and every table name in the `public` schema.

**Why it matters:** The pool teardown causes intermittent, hard-to-reproduce connection errors and latency spikes under any concurrency — the classic symptom is "the API randomly 500s for a few seconds every so often," which is very hard to diagnose after the fact. The disclosure branch hands an attacker your user count (business intelligence), your exact Postgres version (CVE targeting), and your schema — and whether it is live depends on an environment variable nobody documented. The same `NODE_ENV` gate also controls whether `/forgot-password` returns the reset token directly in its HTTP response ([authController.ts:153](server/src/controllers/authController.ts:153)); that branch keys on `=== 'development'` so it is off unless explicitly enabled, but the pattern is fragile.

**Smallest fix:** Delete the `finally { await prisma.$disconnect(); }` block — the pool should live for the process lifetime. Then invert the gate so it fails safe: `const isProduction = process.env.NODE_ENV !== 'development';` and add `NODE_ENV` to `.env.example` and to the documented Render variables.

---

<a id="h7"></a>
## H7 · There is no CI, and the only workflow points at a decommissioned host

**Where:** [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml) — the repository's only workflow

**What is wrong:** Nothing runs on push or pull request. No build, no typecheck, no lint, no tests. The single workflow is a cron job that `curl`s `https://pump-server-ghhkhhggb7dfaegx.israelcentral-01.azurewebsites.net/api/health/db` — an Azure hostname, while the documented backend is Render (`PROJECT_DOCUMENTATION.md:127`) — and swallows all errors with `|| true`, so it reports success indefinitely regardless.

**Why it matters:** Every quality gate in this repo is manual. The dead keep-alive means Render cold starts are not actually being prevented, which is the 60-second-timeout problem the tests work around. And it is a direct blocker for **Phase 3**: the requirement is that the authorization suite "must run in CI on every commit," and there is currently no CI pipeline to add it to. That pipeline has to be built as part of Phase 3, not assumed.

**Smallest fix:** Add `.github/workflows/ci.yml` triggered on `push` and `pull_request` running, for both workspaces, `npm ci` → `npx prisma generate` (server) → `tsc --noEmit` → `npm run build`. Point the keep-alive `curl` at the real Render URL and drop the `|| true` so failures are visible. Both are small, independent commits.

---

<a id="h8"></a>
## H8 · OAuth JWT is delivered in a URL query string

**Where:** [server/src/controllers/authController.ts:217](server/src/controllers/authController.ts:217); consumed at [client/src/pages/Login.tsx:17-22](client/src/pages/Login.tsx:17)

```ts
res.redirect(`${clientUrl}/login?token=${token}`);
```

**What is wrong:** A 24-hour bearer token is placed in a URL. URLs are written to browser history, to Vercel's access logs, to any intermediate proxy log, and are exposed via `document.referrer` to any resource the `/login` page subsequently loads.

**Why it matters:** Every one of those is a durable, often long-retained copy of a credential that grants full account access for 24 hours with no revocation mechanism ([Section 5](#jwt-expiry-and-refresh)). On a shared or managed device, browser history alone is enough. The `Referrer-Policy: strict-origin-when-cross-origin` header helps for cross-origin subresources but does not address history or server-side logs.

**Smallest fix:** Redirect to `${clientUrl}/login#token=${token}` — fragments are never sent to servers and stay out of access logs — and read it from `window.location.hash` in `Login.tsx`, calling `history.replaceState` immediately to scrub it. The robust fix is to set an `httpOnly; Secure; SameSite=Lax` cookie in the callback instead, but that is a larger change to the whole token-storage model.

---

# Findings — Medium

<a id="m1"></a>
## M1 · Auth rate limiter is bypassable with a spoofed `X-Forwarded-For` outside Render's exact topology

**Where:** [server/src/app.ts:33](server/src/app.ts:33); limiter at [rateLimiter.ts:44-52](server/src/middleware/rateLimiter.ts:44)

**What is wrong:** With `trust proxy: 1`, Express derives `req.ip` from the client-supplied `X-Forwarded-For` header. Measured locally — after five attempts returned `429`, every subsequent request with a fresh `X-Forwarded-For: 10.9.9.N` header returned `500` (i.e. it passed the limiter) again, indefinitely.

**Being precise about production:** on Render this is *correct as configured*, because Render's load balancer appends the real client IP to `X-Forwarded-For` and `trust proxy: 1` reads that appended value, ignoring anything the client prepended. So this is not an exploitable bypass of the live deployment today. It is a **defense-in-depth gap**: the brute-force protection on `/login` depends entirely on the deployment sitting behind exactly one appending proxy, and nothing in the code documents or enforces that. Add a second proxy hop, move hosts, expose the service directly, or run locally, and the limiter silently becomes a no-op with no error and no log. Combined with the vulnerable `express-rate-limit` version ([Section 6](#reachable--worth-fixing)), the login brute-force defense rests on two fragile assumptions.

**Smallest fix:** After upgrading `express-rate-limit`, add a `keyGenerator` that only honours the forwarded IP when a shared secret header from your proxy is present, or pin the trusted proxy by address rather than hop count (`app.set('trust proxy', '<render-lb-cidr>')`). At minimum, add a comment at `app.ts:33` recording that the value `1` encodes a specific topology assumption.

---

<a id="m2"></a>
## M2 · `logSet` accepts another user's `dayExerciseId`, and the freestyle path writes a corrupt record

**Where:** [workoutController.ts:44](server/src/controllers/workoutController.ts:44), [workoutService.ts:135-146](server/src/services/workoutService.ts:135)

```ts
// controller
dayExerciseId: dayExerciseId || exerciseId,
// service
const dayExercise = await prisma.dayExercise.findUnique({ where: { id: setData.dayExerciseId } });
exerciseId: dayExercise?.exerciseId || '',
exerciseName: dayExercise?.exercise?.nameEn || 'Unknown Exercise',
```

**What is wrong:** Two defects sharing one line. First, the `DayExercise` lookup is a bare `findUnique` with **no ownership predicate** — every other controller in the codebase scopes this through `day: { program: { userId } }`, but this one does not. A user can pass any `dayExerciseId` and have it written as a foreign key on their own `ExerciseLog`. Second, when the client sends only `exerciseId` (the documented freestyle path — `logSetSchema` explicitly allows `dayExerciseId` to be null), that id is passed to a `DayExercise` lookup, misses, and the `||` fallbacks silently persist `exerciseId: ''` and `exerciseName: 'Unknown Exercise'`.

**Why it matters:** The ownership gap does not leak data — the joined `Exercise` is shared reference data — but it creates cross-tenant foreign keys, and it is the one place in the codebase that breaks the ownership-check pattern. That is precisely the kind of drift the Phase 3 suite should catch. The corrupt-record path is worse in practice: records with `exerciseId: ''` are invisible to PR calculation ([PRService.ts:90](server/src/services/PRService.ts:90) filters falsy ids), to progress charts, and to the muscle heatmap — so freestyle workouts appear to log successfully and then silently vanish from every statistic.

**Smallest fix:** Scope the lookup and stop guessing:

```ts
const dayExercise = setData.dayExerciseId
    ? await prisma.dayExercise.findFirst({
        where: { id: setData.dayExerciseId, day: { program: { userId } } },
        include: { exercise: true },
      })
    : null;
if (setData.dayExerciseId && !dayExercise) throw new Error('Day exercise not found');
```

and pass the real `exerciseId` through the controller separately rather than collapsing the two ids with `||`.

---

<a id="m3"></a>
## M3 · Rejected CORS origins produce a 500 and a logged stack trace

**Where:** [server/src/app.ts:62-66](server/src/app.ts:62)

**What is wrong:** The rejection path is `callback(new Error('Not allowed by CORS'))`, which propagates to `globalErrorHandler`. Verified — a request with `Origin: https://evil.example.com` returned `500 {"message":"Internal server error"}` and wrote a full stack trace to stdout.

**Why it matters:** The browser blocks the response either way, so this is not a security hole. It is an observability and availability problem: an attacker (or a misconfigured client, or a preview deployment) can fill your log stream with stack traces at 100 req/min per IP, and genuine 500s become impossible to spot. It also makes CORS misconfiguration much harder to diagnose than it needs to be.

**Smallest fix:** `callback(null, false)` instead of throwing. The CORS headers are simply omitted, the browser blocks it, and no error is logged.

---

<a id="m4"></a>
## M4 · `/forgot-password` and `/register` disclose which emails are registered

**Where:** [authController.ts:130-133](server/src/controllers/authController.ts:130), [authController.ts:51-54](server/src/controllers/authController.ts:51)

**What is wrong:** `forgot-password` returns `404 {"message":"User not found"}` for unknown emails and `200` for known ones. `register` returns `400 {"message":"User already exists"}`.

**Why it matters:** An oracle for enumerating which email addresses have accounts. The `authLimiter` (5/15min) slows bulk enumeration considerably, which is why this is Medium rather than High — but targeted checks against specific addresses are trivially cheap. For a fitness app the membership fact itself is mildly sensitive, and the enumerated list feeds credential-stuffing against the login endpoint.

**Smallest fix:** Return the same `200 {"message":"Password reset instructions sent to your email"}` regardless of whether the user exists (move the whole token-and-email block inside `if (user)`). Register is harder to make fully opaque without changing the signup UX; at minimum make it consistent with whatever you decide.

---

<a id="m5"></a>
## M5 · Weak `JWT_SECRET` only warns; the documented ≥32-character rule is not enforced

**Where:** [server/src/config/validateEnv.ts:31-36](server/src/config/validateEnv.ts:31); claim at `PROJECT_DOCUMENTATION.md:701`

**What is wrong:** The length check is a `console.warn`. A four-character secret boots normally. The docs describe this as a mandatory ≥32-character requirement.

**Why it matters:** The JWT secret is the single key protecting every session — with RLS bypassed ([C1](#c1)) and no token revocation, forging one token is full account takeover. A short secret is brute-forceable offline from any captured token. A warning printed at startup on Render scrolls past unread; the file exists specifically to convert this class of mistake into a hard failure, and here it does not.

**Smallest fix:** Change the `console.warn` to a `throw`, matching the treatment of a missing variable eleven lines above.

---

<a id="m6"></a>
## M6 · Password reset tokens are stored in plaintext and survive password changes

**Where:** [authController.ts:139-145](server/src/controllers/authController.ts:139)

**What is wrong:** The reset JWT is written verbatim to `User.resetPasswordToken`. Separately, changing a password does not invalidate outstanding JWTs.

**Why it matters:** Anyone with read access to the `User` table — a SQL injection elsewhere, a leaked backup, or simply the committed database credentials from [C2](#c2) — can take over any account with a pending reset by replaying the stored token, no email access required. The reset flow itself is otherwise well built (signature + DB match + expiry + single-use), which makes storing the raw token the one weak link. The second half matters for incident response: a user who resets after a compromise is still exposed for up to 24 hours because the attacker's existing token stays valid.

**Smallest fix:** Store `crypto.createHash('sha256').update(resetToken).digest('hex')` and compare hashes in `resetPassword`. For the revocation half, add a `tokensValidFrom` timestamp to `User`, set it on password change, and reject JWTs whose `iat` precedes it in `authenticateToken` — that is a slightly larger change and belongs in its own commit.

---

<a id="m7"></a>
## M7 · Service worker retains authenticated API responses after logout

**Where:** [client/vite.config.ts:72-88](client/vite.config.ts:72); logout at [MainLayout.tsx:21](client/src/components/layout/MainLayout.tsx:21) and [useDashboard.ts:265-266](client/src/hooks/useDashboard.ts:265)

**What is wrong:** Every `GET /api/**` response is cached under `StaleWhileRevalidate` for 24 hours in Cache Storage, with `cacheableResponse: { statuses: [0, 200] }`. Logout clears only `localStorage.token` and `localStorage.user`; nothing calls `caches.delete('api-cache')`.

**Why it matters:** One user's workout history, programs, personal records and profile persist in the browser's cache after they log out. On a shared device the next person can read them straight out of DevTools, and because the strategy is stale-while-revalidate the cached copy is what renders first. Including status `0` means opaque responses are cached too. This is a genuine privacy leak for a PWA explicitly designed to be installed on personal-but-shared phones.

**Smallest fix:** Extract the logout logic into one shared helper (it is currently duplicated in three places) that awaits `caches.delete('api-cache')` before redirecting.

---

<a id="m8"></a>
## M8 · Warmup sets are excluded from PR calculation in three places and included in two

**Where:** [workoutController.ts:234-236](server/src/controllers/workoutController.ts:234) (`getPersonalRecords`), [migrationController.ts:35-37](server/src/controllers/migrationController.ts:35) (`recalculatePRs`)

**What is wrong:** `PRService`, `getExerciseProgress` and `deleteWorkout` all filter `(s.type || 'NORMAL') !== 'WARMUP'` before computing metrics. `getPersonalRecords` and `recalculatePRs` do not — they run `Math.max` across all sets including warmups.

**Why it matters:** The documented rule (`PROJECT_DOCUMENTATION.md:546-549`) is that warmups never count toward PRs; that is also the user-facing promise. The Personal Records page reads from `getPersonalRecords`, so the numbers a user sees there can disagree with the numbers on the progress chart for the same exercise. Worse, `recalculatePRs` *writes* warmup-inclusive flags back to the database, so triggering it corrupts previously-correct PR flags. Note the mismatch is somewhat masked today because the `isWeightPR` flags gating these records were themselves set correctly — but the displayed *values* come from the unfiltered recomputation.

**Smallest fix:** Apply the same filter both places. `PRService.calculateExerciseMetrics()` already implements it exactly — call it instead of recomputing inline.

---

<a id="m9"></a>
## M9 · All `@types/*` packages and `typescript` are runtime dependencies

**Where:** [server/package.json:22-30](server/package.json:22) and [:43](server/package.json:43)

**What is wrong:** `@types/bcrypt`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/node`, `@types/nodemailer`, `@types/passport`, `@types/passport-google-oauth20`, `@types/pg` and `typescript` are all in `dependencies`, not `devDependencies`.

**Why it matters:** These ship into the production install. `@types/nodemailer` in particular depends on `@aws-sdk/client-sesv2`, which pulls in 20+ AWS packages and `fast-xml-parser` — **the sole source of the only Critical-severity advisory in the server tree** (CVSS 9.3), for code that is never executed. Moving them to `devDependencies` removes that Critical from the production dependency graph entirely, along with a large amount of image size and audit noise. It also means `npm audit --omit=dev` starts telling the truth about production risk, which is what you want before a commercial launch.

**Smallest fix:** Move all ten entries to `devDependencies` and re-run `npm install`. Verify `deploy.sh` still builds — it runs `npm ci --only=production` *before* `npm run build`, which already looks wrong for a TypeScript build and should be checked in the same commit.

---

<a id="m10"></a>
## M10 · No token refresh: hard logout at 24 hours, mid-workout

**Where:** [authController.ts:104](server/src/controllers/authController.ts:104), [apiClient.ts:28-46](client/src/services/apiClient.ts:28)

**What is wrong:** Tokens expire in 24 hours with no refresh mechanism. On any 401/403 the axios interceptor wipes `localStorage` and does `window.location.href = '/login'`.

**Why it matters:** For a workout-tracking app, a hard redirect can land in the middle of an active session and discard unsaved sets — the exact scenario the PWA's `registerType: 'prompt'` was chosen to avoid for service-worker updates. It also creates a perverse pressure to extend the token lifetime instead, which makes the no-revocation problem worse.

**Smallest fix:** Not a one-liner — this needs a refresh-token endpoint plus rotation, and it interacts with [H8](#h8) and [M6](#m6). Recommend scoping it as a single "session lifecycle" work item covering token storage, refresh, and revocation together rather than patching any one piece.

---

<a id="m11"></a>
## M11 · `POST /api/migrations/recalculate-prs` is an unbounded N+1 loop open to any user

**Where:** [server/src/routes/workoutRoutes.ts:50](server/src/routes/workoutRoutes.ts:50), [migrationController.ts:40-51](server/src/controllers/migrationController.ts:40)

**What is wrong:** Any authenticated user can invoke it. It iterates every completed workout × every exercise log, issuing one `findMany` **and** one `update` per exercise log — no batching, no transaction, no limit. It is undocumented and no client code calls it.

**Why it matters:** A user with a long history triggers hundreds of sequential round-trips per call, and the global limiter permits 100 calls per minute. On Render's free tier and Supabase's connection limits, that is a straightforward way to exhaust the connection pool for everyone. It also writes warmup-inclusive PR flags ([M8](#m8)), so calling it actively corrupts data. A one-off maintenance script has been left mounted as a public API route.

**Smallest fix:** Delete the route (line 50 of `workoutRoutes.ts`) and run the logic as a script when needed. If it must stay, gate it behind an admin check and wrap the writes in a single transaction.

---

<a id="m12"></a>
## M12 · Google OAuth links to an existing account on email match without checking `email_verified`

**Where:** [server/src/config/passport.ts:23-32](server/src/config/passport.ts:23)

**What is wrong:** If no user matches `googleId`, the strategy looks up by `profile.emails[0].value` and, on a hit, attaches the Google identity to that existing password account. It never inspects Google's `email_verified` claim.

**Why it matters:** The standard OAuth account-linking hazard: if an identity provider ever asserts an unverified email, an attacker who controls that provider account inherits the existing password-based account. Google verifies consumer Gmail addresses, so exploitation is not realistic today — but the guarantee is Google's policy, not something this code checks, and it silently becomes wrong if another provider is added later. Minor secondary bug: if `profile.emails` is absent, `findUnique({ where: { email: undefined } })` throws inside the strategy.

**Smallest fix:** Require `profile.emails?.[0]?.verified === true` (or read `email_verified` from the profile JSON) before the linking branch; otherwise create a distinct account or return an error.

---

# Findings — Low

<a id="l1"></a>
**L1 · `useOfflineMutation` is dead code.** [client/src/hooks/useOfflineMutation.ts](client/src/hooks/useOfflineMutation.ts) — 155 lines, never imported. `PROJECT_DOCUMENTATION.md:781-794` documents the offline queue, its FIFO rules and its 4xx/5xx behaviour as a shipped feature; none of it runs. *Fix:* either wire it into the mutation paths in `ActiveWorkoutPage` or delete the hook and its documentation section. Do not leave it in this state — it reads as a working feature.

**L2 · `DashboardHeader` is dead code.** [client/src/components/dashboard/DashboardHeader.tsx](client/src/components/dashboard/DashboardHeader.tsx) — barrel-exported at `index.ts:6`, never rendered. *Fix:* delete both lines.

**L3 · Unreachable AI error branch.** [aiController.ts:64-68](server/src/controllers/aiController.ts:64) handles `LLM_EMPTY_RESPONSE` / `LLM_INVALID_FORMAT`, but [aiService.ts:231-234](server/src/services/aiService.ts:231) catches every error and returns the mock report, so those never propagate. Users silently receive fabricated coaching data whenever Groq fails. *Fix:* re-throw the two sentinel errors from the service catch, or drop the controller branch and document that failures always degrade to mock.

<a id="l4"></a>
**L4 · API reference documents the wrong verbs and paths.** `PROJECT_DOCUMENTATION.md:500-535` lists `PUT /programs/:id` (code: `PATCH`), `PUT|DELETE /programs/:programId/days/:dayId` (code: `PATCH|DELETE /days/:id`), `PUT|DELETE /days/:dayId/exercises/:exerciseId` (code: `PATCH|DELETE /day-exercises/:id`), and omits `POST /api/migrations/recalculate-prs`. `PROJECT_DOCUMENTATION.md:635` says `/exercise/:id/progress`; the route is `/exercise/:exerciseId/progress`. *Fix:* regenerate the table from the router files.

<a id="l5"></a>
**L5 · Keep-alive workflow targets a decommissioned Azure host.** [.github/workflows/keep-alive.yml:17](.github/workflows/keep-alive.yml:17) pings `pump-server-...azurewebsites.net` every 10 minutes; the docs claim Render every 14. Errors are swallowed with `|| true`. Covered under [H7](#h7); listed separately because the URL fix is a one-liner.

**L6 · Compiled Python bytecode is committed.** `tests/__pycache__/*.pyc` (5 files) are tracked. *Fix:* `git rm -r --cached tests/__pycache__` and add `__pycache__/` to `.gitignore`.

**L7 · Invalid tokens return 403 where 401 is correct.** [middleware/auth.ts:39](server/src/middleware/auth.ts:39). A malformed or expired bearer token is an authentication failure (401 + `WWW-Authenticate`), not an authorization one. The client treats both identically so nothing breaks today, but it will confuse any API consumer and muddies the Phase 3 assertions. *Fix:* return 401.

**L8 · 775 kB single JS bundle, no code splitting.** Vite warns explicitly (`Some chunks are larger than 500 kB`). Recharts and lucide-react are the likely bulk. *Fix:* lazy-load the chart-heavy routes (`ExerciseProgressPage`, `PersonalRecordsPage`) with `React.lazy`.

**L9 · Dead Prisma seed hook.** [server/package.json:12-14](server/package.json:12) points `prisma.seed` at `prisma/seed.js`, which does not exist — only `seed.sql`. `npx prisma db seed` fails. *Fix:* remove the block, or add the wrapper script the docs' `prisma db execute` step implies.

**L10 · `ProtectedRoute` checks token expiry only on mount.** [client/src/App.tsx:36-50](client/src/App.tsx:36) has an empty dependency array, so a token expiring during a session is not detected until the next API 401. Minor, and the interceptor covers it. *Fix:* add a periodic check or re-validate on route change.

**L11 · `prisma generate` requires `DATABASE_URL` to be set.** [server/prisma.config.ts:11-13](server/prisma.config.ts:11) resolves `env("DATABASE_URL")` eagerly, so a fresh clone cannot generate the client (or typecheck) before configuring a database — verbatim error in [Section 1](#verbatim-failures). Any value works; a connection is not needed. *Fix:* note it in the README quick-start, which currently implies `npm install` then `npx prisma generate` works standalone.

---

## Appendix A: What I could not verify

Stated explicitly so nothing here is mistaken for a checked fact.

1. **The production `DATABASE_URL` role.** It lives in Render's environment settings, not the repo. My conclusion in [C1](#c1) does not depend on it — both possible answers lead to "RLS provides zero protection" — but the two `psql` commands in [Section 3](#which-role-does-database_url-connect-as) will confirm the specific role in about ten seconds.
2. **Whether the RLS script was ever actually applied to the live database.** The file's header claims it was executed on Supabase in January 2026. Unverified either way; also immaterial to the conclusion.
3. **Live cross-user IDOR testing.** Neither Docker nor a local Postgres is available on this machine, so I could not stand up a database, seed two users, and fire real cross-tenant requests. Section 4 is therefore a complete static read of all 37 routes rather than an empirical result. **Standing up that environment is a hard prerequisite for Phase 3** — the authorization suite you described cannot exist without it, and it will also convert Section 4 from analysis into proof.
4. **Whether `pump-db-server.postgres.database.azure.com` is still live.** I did not attempt to connect — probing a database with leaked credentials is not something I should do unprompted. Rotation in [C2](#c2) is warranted regardless.
5. **`NODE_ENV` on the deployed Render service.** Determines whether [H6](#h6)'s disclosure branch is currently active in production. Checkable in the Render dashboard.
6. **Runtime behaviour under a real database** — PR calculation correctness, streak arithmetic across year boundaries, and the AI Coach pipeline were reviewed by reading only.

---

## Suggested Phase 2 ordering

Not a decision — the selection is yours. Offered because several of these interact and the order matters.

**Rotate first, before any code change:** [C2](#c2) database password and Google OAuth secret, [C3](#c3) the production test account password. These are live exposures; code changes do not help until the credentials are dead.

**Then, one concern per commit:** [H1](#h1) (unblocks anyone else running the project) → [C1](#c1) documentation correction → [H3](#h3) → [H6](#h6) → [H2](#h2) → [H4](#h4) → [M2](#m2) → dependency upgrades from [Section 6](#reachable--worth-fixing) → [H7](#h7) CI pipeline.

[H7](#h7) is worth pulling earlier than its position suggests: Phase 3 requires CI to exist, and having the pipeline green before the authorization suite lands means the suite's first run is meaningful.

---

*End of Phase 1. No code, schema, or configuration was modified. Awaiting your selection before Phase 2.*
