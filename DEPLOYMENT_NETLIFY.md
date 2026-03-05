# Deploy from GitHub Repo (Netlify + Render)

Host the app by connecting your **GitHub repo** to Netlify (frontend) and Render (backend + database). Every push to the repo can trigger a new deploy.

---

## Step 0: Push your code to GitHub

1. Create a repo on [github.com](https://github.com) (e.g. `your-username/skillhub-hrm`).
2. In your project folder:

   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git add .
   git commit -m "Add deployment config"
   git push -u origin main
   ```

   (Use your default branch name if it’s not `main`.)

---

## Step 1: Connect GitHub and deploy backend (Render)

1. Go to [render.com](https://render.com) and sign in with GitHub.

2. **Create a PostgreSQL database**
   - Dashboard → **New +** → **PostgreSQL**
   - Name: `skillhub-db`
   - Create, then copy the **Internal Database URL**.

3. **Create Web Service from GitHub**
   - **New +** → **Web Service**
   - **Connect a repository** → choose your GitHub account → select your repo
   - Configure:
     - **Root directory:** `backend`
     - **Environment:** Node
     - **Build command:** `npm install && npx prisma generate && npm run build`
     - **Start command:** `npx prisma migrate deploy && node dist/index.js`

4. **Environment variables** (in the Web Service):
   - `DATABASE_URL` → Internal Database URL from step 2
   - `JWT_SECRET` → strong random string (32+ chars)
   - `NODE_ENV` → `production`
   - `OPENAI_API_KEY` → (optional)

5. Click **Create Web Service**. After deploy, copy the backend URL (e.g. `https://your-app-name.onrender.com`).

---

## Step 2: Connect GitHub and deploy frontend (Netlify)

1. Go to [netlify.com](https://netlify.com) and sign in (optionally with GitHub).

2. **Add site from Git**
   - **Add new site** → **Import an existing project**
   - **Connect to Git provider** → **GitHub** → authorize Netlify
   - Choose your **repository** and the **branch** (e.g. `main`)

3. **Build settings** (often auto-filled from `netlify.toml` in the repo)
   - **Base directory:** (leave empty)
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`

4. **Environment variables**
   - **Site settings** → **Environment variables** → **Add a variable**
   - Key: `VITE_API_URL`
   - Value: `https://your-app-name.onrender.com/api` (use the real Render URL from Step 1)

5. **Deploy site**. Netlify builds from the repo and hosts at a URL like `https://random-name.netlify.app`. Later pushes to the connected branch will trigger new deploys.

---

## Step 3: Custom domain (skillhub365.co.in)

### On Netlify

1. Site settings → Domain management → Add custom domain  
2. Add `skillhub365.co.in`  
3. Configure DNS at your domain registrar:
   - **A record**: `@` → Netlify’s load balancer IP (shown in Netlify)
   - **CNAME** (if you use `www`): `www` → `your-site-name.netlify.app`

### CORS

Your backend uses `cors({ origin: true })`, so requests from `https://skillhub365.co.in` are allowed.

---

## Step 4: First-time setup

After the backend is deployed:

1. Run migrations (Render runs them automatically on start).
2. Run the seed once. Options:
   - Add a one-off seed command in Render (if supported), or  
   - Connect to the backend container and run:  
     `npx prisma migrate deploy && npm run db:seed`  
     (or run seed from your local machine with `DATABASE_URL` set to the external DB URL, if Render provides one).

---

## Summary

| Part        | Host    | Connected to     |
|------------|---------|------------------|
| Frontend   | Netlify | GitHub repo      |
| Backend    | Render  | GitHub repo      |
| Database   | Render  | Backend service  |

- **Netlify** and **Render** both deploy from your GitHub repo; pushing to the linked branch triggers a new deploy.
- Frontend calls the backend using `VITE_API_URL` (set in Netlify env).
- Optional: add custom domain (e.g. skillhub365.co.in) in Netlify → Domain management.
