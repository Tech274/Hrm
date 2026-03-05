# Fix: "Environment variable not found: DATABASE_URL" on Render

Your backend service needs `DATABASE_URL` so Prisma can connect to Postgres.

## Option A: You already have a Postgres database on Render

1. In Render Dashboard, open your **PostgreSQL** service (e.g. `skillhub-db` or the one you created).
2. In **Info** or **Connect**, copy the **Internal Database URL** (use Internal, not External, for a service in the same Render account).
3. Open your **Web Service** (e.g. "Hrm").
4. Go to **Environment**.
5. Click **Add Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** paste the Internal Database URL.
6. Save. Render will redeploy; the next build should succeed.

## Option B: You don’t have a database yet

1. In Render Dashboard: **New +** → **PostgreSQL**.
2. Create it and copy the **Internal Database URL**.
3. In your **Web Service** → **Environment**, add:
   - **Key:** `DATABASE_URL`
   - **Value:** the Internal Database URL.
4. Add **JWT_SECRET** (and optionally **NODE_ENV** = `production`) if you haven’t already.
5. Save and let the service redeploy.

## Using the Blueprint next time

To have Render set `DATABASE_URL` for you from a database in the same Blueprint:

1. **New** → **Blueprint**.
2. Connect the same repo and branch.
3. Render will create the Postgres DB and Web Service and inject `DATABASE_URL` into the service.

Your current "Hrm" service can be fixed by adding `DATABASE_URL` manually as in Option A or B.
