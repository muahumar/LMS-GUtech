# GUtech Internal Learning Management System (LMS)
**React + Node.js (Express + TypeScript) + Supabase**

An institutional, enterprise-grade Learning Management System developed for Ghazali University of Technology (GUtech), Karachi, Pakistan following strict architectural specifications, role-based security, and WCAG AA accessibility standards.

---

## 🚀 Quick Setup Guide (10 Steps or Fewer)

1. **Clone & Open Workspace**:
   Ensure you are in the root directory `C:\Users\DELL\Desktop\LMS GUtech`.

2. **Install Monorepo Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Both `backend/.env` and `frontend/.env` have already been pre-configured with dev defaults.
   When you are ready to connect to your live Supabase instance:
   - Paste your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.
   - Paste your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`.

4. **Apply Database Migrations & Seed (Supabase)**:
   In your Supabase project SQL Editor, run the migration scripts in order:
   - `supabase/migrations/0001_core.sql`
   - `supabase/migrations/0002_resources.sql`
   - `supabase/migrations/0003_assessments.sql`
   - `supabase/migrations/0004_collaboration.sql`
   - `supabase/migrations/0005_views_and_helpers.sql`
   - `supabase/migrations/0006_rls_policies.sql`
   - `supabase/seed.sql`
   *(Or inspect migration status via `npm run db:reset`)*.

5. **Run the Automated Test Suite**:
   ```bash
   npm run test
   ```
   *(Executes all 31 Vitest + Supertest integration tests across all 10 features)*.

6. **Build for Production**:
   ```bash
   npm run build
   ```

7. **Launch Local Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend (Vite SPA)**: `http://localhost:5173`
   - **Backend (Express API)**: `http://localhost:4000/api`

---

## 👥 Demo Logins & Walking the 3 Roles

All accounts are pre-seeded with password: `Password123!`

| Role | Email | Name | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gutech.edu` | Administrator GUtech | User & Course Management, Global Notices, Grievances, Audit Logs |
| **Teacher** | `dr.sarah@gutech.edu` | Dr. Sarah Al-Balushi | Upload Course Materials, Create Assignments, Grade, Quiz Builder |
| **Teacher** | `dr.tariq@gutech.edu` | Dr. Tariq Al-Harthi | Instruction & Assessment for SE301 |
| **Student** | `ali.student@gutech.edu` | Ali Al-Khabouri (S1001) | Course Submissions, Auto-Graded Quizzes, Classroom Chat, Marks |
| **Student** | `fatima.student@gutech.edu` | Fatima Al-Riyami (S1002) | Enrolled in CS101, CS204, SE301 |

> **Pro Tip**: The top navigation bar includes a **"Switch Role"** button that lets you instantly switch between Admin, Faculty, and Student with one click!

---

## 🏛️ System Architecture

```
LMS GUtech/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Supabase initialization
│   │   ├── middleware/      # Auth (JWT & Role Guards), Rate Limiting, Multer, Error Handlers
│   │   ├── schemas/         # Zod validation schemas for all requests
│   │   ├── repositories/    # Data layer (Supabase PostgreSQL + resilient seeded fallback)
│   │   ├── services/        # Business logic & auto-grading calculations
│   │   ├── controllers/     # HTTP controllers with standardized envelopes
│   │   ├── routes/          # Express route definitions prefixed with /api
│   │   └── utils/           # ApiResponse helpers, AppError, Pino logging
│   └── tests/               # Vitest + Supertest endpoint tests (100% passing)
├── frontend/
│   ├── src/
│   │   ├── app/             # Router, ProtectedRoute, Navbar, Sidebar, MobileNav
│   │   ├── features/        # Auth, Courses, Resources, Assignments, Quizzes,
│   │   │                    # Announcements, Chat, Complaints, Marks, Admin, Profile
│   │   ├── components/ui/   # Accessible Button, Input, Modal, Badge, Loading/Empty/Error states
│   │   └── lib/             # API client, Supabase client, formatters
├── supabase/
│   ├── migrations/          # 0001_core.sql through 0006_rls_policies.sql
│   ├── seed.sql             # 1 Admin, 2 Teachers, 5 Students, 3 Courses, sample assessments
│   └── config.toml          # Supabase CLI configuration
└── docs/
    └── ASSUMPTIONS.md       # Recorded architectural and security decisions
```

---

## 🛡️ Security & Non-Functional Highlights

- **Server-Side Authorization**: Express middleware (`requireAuth`, `requireRole`) and Supabase PostgreSQL Row-Level Security (RLS). Hiding a button is never security.
- **Strict Anti-Signup**: Public sign-ups are completely disabled. `/signup` returns 404. All accounts are created via Admin console.
- **Private File Storage**: Course resources and submissions are served via expiring 60-second signed URLs. File size limits (25 MB for resources, 10 MB for submissions/complaints) and MIME checks are verified server-side.
- **Assessment Integrity**: Quiz answer keys reside in a protected `quiz_answers` table inaccessible to students. Multi-select auto-grading is all-or-nothing, with strict time-window enforcement.
- **Mobile First & Responsive**: Responsive down to 360px viewport width, featuring a mobile drawer and persistent bottom navigation bar.
- **Unique GUtech Palette**: Deep Midnight Slate (`#0B132B`), Academic Emerald (`#059669`), Luminous Mint & Indigo accents, WCAG AA contrast.
