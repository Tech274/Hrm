# HIREFLOW – Recruitment Governance Platform

Production-ready SaaS platform that enforces mandatory structured interviewer feedback before offer release.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt
- **Frontend:** React, TypeScript, Vite, TailwindCSS, React Router, Axios
- **Infra:** Docker, Docker Compose

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use Docker)
- npm or pnpm

## Deploy locally

You can run the app locally in two ways.

### Option 1 – One script + two terminals (recommended)

1. **Install dependencies** (once):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Postgres and prepare DB:**
   ```powershell
   .\start-local.ps1
   ```
   This starts Postgres in Docker, runs migrations, and seeds demo data.

3. **Run backend and frontend** in two separate terminals:
   - **Terminal 1:** `cd backend` → `npm run dev`
   - **Terminal 2:** `cd frontend` → `npm run dev`

4. **Open:** http://localhost:5173 — Login: **admin@hireflow.com** / **Admin123!**

### Option 2 – Full stack in Docker

```bash
docker compose up -d --build
```

- **App:** http://localhost:5173  
- **API:** http://localhost:4000  

If the backend container exits (e.g. Prisma/OpenSSL in image), run migrations and seed from your machine:
```powershell
cd backend
$env:DATABASE_URL="postgresql://hireflow:hireflow_secret@localhost:5432/hireflow"
npx prisma migrate deploy
npm run db:seed
```
Then use Option 1 to run backend and frontend with `npm run dev` while Postgres stays in Docker.

---

## Quick Start (Development)

### 1. Install Dependencies

```bash
cd Hrm
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

`.env` and `backend/.env` are already created. Edit if needed:

- `DATABASE_URL` – PostgreSQL connection string (default: `postgresql://hireflow:hireflow_secret@localhost:5432/hireflow`)
- `JWT_SECRET` – Strong secret for production

### 3. Database

**Option A – Docker (recommended):** Start Docker Desktop, then:

```bash
docker-compose up -d postgres
```

**Option B – Local PostgreSQL:** Create a database named `hireflow` and update `DATABASE_URL` in `backend/.env`.

**Then run migrations:**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

### 4. Run

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### 5. Demo Login

| Email | Password | Role |
|-------|----------|------|
| admin@hireflow.com | Admin123! | admin |
| manager@hireflow.com | Admin123! | manager |
| interviewer1@hireflow.com | Admin123! | interviewer |
| recruiter@hireflow.com | Admin123! | recruiter |

## Docker (Full Stack)

Build and run the entire stack (Postgres + Backend + Frontend):

```bash
# Optional: set JWT_SECRET and OPENAI_API_KEY in .env at project root
# JWT_SECRET=your-secure-secret
# OPENAI_API_KEY=sk-your-key  # for Draft Assistant

docker-compose up -d --build
```

**Access:**
- **App:** http://localhost:5173
- **Backend API:** http://localhost:4000

Migrations run automatically on backend startup. To seed demo users:

```bash
docker-compose exec backend npm run db:seed
```

**Login:** admin@hireflow.com / Admin123!

## Project Structure

```
/hireflow
  /backend          # Express API
    /prisma         # Schema, migrations, seed
    /src
      /config
      /lib
      /middleware
      /routes
      /services
      /validators
  /frontend         # React SPA
    /src
      /components
      /context
      /lib
      /pages
  docker-compose.yml
  README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` – Register user
- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Current user (auth required)

### Candidates
- `GET /api/candidates` – List
- `POST /api/candidates` – Create
- `GET /api/candidates/:id` – Get one
- `PUT /api/candidates/:id` – Update
- `DELETE /api/candidates/:id` – Delete
- `GET /api/candidates/:id/governance-status` – Governance status

### Interviews
- `POST /api/interviews` – Create
- `GET /api/interviews?candidateId=` – List
- `PUT /api/interviews/:id` – Update

### Feedback
- `POST /api/feedback` – Submit
- `GET /api/feedback/:interviewId` – Get by interview
- `PUT /api/feedback/:id` – Update

### Offers
- `POST /api/offers/:candidateId` – Create offer
- `POST /api/offers/:candidateId/validate` – Validate governance
- `POST /api/offers/:candidateId/release` – Release (manager only)

### Approvals
- `POST /api/approvals` – Create
- `PUT /api/approvals/:id` – Update (manager only)

### Audit
- `GET /api/audit?entityType=&entityId=` – List logs (admin only)

### Users
- `GET /api/users` – List (admin only)

## Governance Rules

Offer can be released only when:

1. All interviews have submitted feedback
2. All feedback is digitally signed off
3. Manager has approved
4. No high-risk feedback without manager override

## License

Proprietary.
