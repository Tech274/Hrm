# Deploy to skillhub365.co.in

## Overview

Deploy the full stack (Postgres, backend, frontend) so the app is available at **https://skillhub365.co.in**.

## Prerequisites

- A VPS or cloud server (DigitalOcean, AWS EC2, Linode, etc.) with Docker and Docker Compose
- Domain **skillhub365.co.in** pointed to your server IP (A record)
- Ports 80 and 443 open

---

## Option 1: Docker on VPS (recommended)

### 1. SSH into your server

```bash
ssh user@your-server-ip
```

### 2. Install Docker (if not installed)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

### 3. Clone the repo

```bash
git clone <your-repo-url> Hrm
cd Hrm
```

### 4. Create `.env.production` in project root

```env
POSTGRES_PASSWORD=your-secure-random-password
JWT_SECRET=your-secure-jwt-secret-at-least-32-chars
```

### 5. Build and run

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 6. Run migrations and seed (first time only)

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### 7. SSL with Let's Encrypt (HTTPS)

Use Caddy or nginx with certbot. Example with **Caddy**:

```bash
# Install Caddy, then create /etc/caddy/Caddyfile:
skillhub365.co.in {
    reverse_proxy localhost:80
}
```

Caddy auto-obtains and renews SSL. Restart Caddy and your site will be at https://skillhub365.co.in.

---

## Option 2: Use a platform (Render, Railway, Fly.io)

### Render

1. **Postgres**: Create a PostgreSQL database in Render, copy the external URL.
2. **Backend**: New Web Service from this repo, root directory `backend`, build: `npm install && npx prisma generate && npm run build`, start: `npx prisma migrate deploy && node dist/index.js`. Set `DATABASE_URL` and `JWT_SECRET`.
3. **Frontend**: New Static Site from this repo, root directory `frontend`, build: `npm install && npm run build`, publish directory `dist`. Set build env: `VITE_API_URL=https://your-backend-url.onrender.com/api`.
4. Point skillhub365.co.in to the frontend static site (or use Render’s custom domain).

### Railway

1. Create a new project, add Postgres, backend, and frontend services from this repo.
2. Configure env vars and custom domain for each service.
3. Point skillhub365.co.in to the frontend URL.

---

## Post-deploy

- **Login**: admin@hireflow.com / Admin123!
- Change default passwords in production.
- Ensure `JWT_SECRET` and `POSTGRES_PASSWORD` are strong and kept secret.
