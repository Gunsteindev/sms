# Deployment Guide

## Overview

The app is a standard Next.js application. It can be deployed anywhere Node.js runs: Vercel, a VPS, a Docker container, or an on-premise server. The only external dependencies are Microsoft Dataverse and (optionally) Anthropic's API.

## Pre-Deployment Checklist

- [ ] `npm run lint` passes (no errors), `npm test` passes, and `npm run build` passes with zero TypeScript errors — all three run in CI (`.github/workflows/ci.yml`)
- [ ] All required environment variables are set (see [Setup](./setup.md))
- [ ] `AUTH_SECRET` is at least 32 random characters — generate with `openssl rand -base64 32`. **Production throws at runtime if it is missing or weak.**
- [ ] `ADMIN_PASSWORD` is strong (≥12 characters, mixed case, numbers, symbols)
- [ ] Per-school admin passwords changed from the `School@2025` default
- [ ] Azure AD app registration has correct permissions to Dataverse
- [ ] `.env.local` or `.env` is **not** committed to the repository
- [ ] `NEXTAUTH_URL` points to the production HTTPS URL

---

## Option 1 — Vercel (Recommended)

Vercel is the simplest deployment path for Next.js.

1. Push the repository to GitHub / GitLab / Bitbucket
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repository
3. Under **Environment Variables**, add all variables from the [Setup guide](./setup.md)
4. Set `NEXTAUTH_URL` to your Vercel domain (e.g. `https://sms.vercel.app`)
5. Click **Deploy**

Vercel auto-detects Next.js and runs `npm run build`. Each push to the main branch triggers a new deployment.

---

## Option 2 — Docker

A `docker-compose.yml` is included in the project root.

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

Set environment variables via a `.env` file alongside `docker-compose.yml`:

```env
DATAVERSE_URL=https://yourorg.crm.dynamics.com
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AUTH_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
ADMIN_EMAIL=admin@school.edu.gh
ADMIN_PASSWORD=...
```

The container listens on port `3000`. Use a reverse proxy (Nginx, Caddy, Traefik) to terminate TLS and forward to port `3000`.

### Sample Nginx config

```nginx
server {
    listen 443 ssl;
    server_name sms.yourschool.edu.gh;

    ssl_certificate     /etc/letsencrypt/live/sms.yourschool.edu.gh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sms.yourschool.edu.gh/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 3 — Node.js on a VPS

```bash
# On the server
git clone <repo-url>
cd sms
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name sms -- start
pm2 save
pm2 startup
```

---

## HTTPS

The app must be served over HTTPS in production:
- The session cookie uses `sameSite: lax` — browsers may not send it over plain HTTP
- `NEXTAUTH_URL` must be an HTTPS URL in production
- Azure AD OAuth requires HTTPS callback URLs

Use [Let's Encrypt](https://letsencrypt.org/) (free) with Certbot for TLS certificates on a VPS.

---

## Scaling

The app is stateless — session state is stored in the JWT cookie, not server memory. Multiple instances can run behind a load balancer without sticky sessions.

The only shared state is Dataverse. Dataverse handles concurrent connections natively.

> **Caveat — login rate limiting is in-memory** (`src/lib/rate-limit.ts`), so limits are per-instance. For a multi-instance / serverless deployment, back it with a shared store (e.g. Redis/Upstash) so brute-force limits hold across instances.

### Dataverse API Limits

Microsoft Dataverse enforces API call limits based on your license tier. Monitor usage in the Power Platform admin center. The app mitigates this with:
- Bearer token caching (refreshed only 5 minutes before expiry, not per request)
- Client-side pagination (reduces rows fetched per request)
- `AsyncLocalStorage` ensures one token fetch per request, not per Dataverse call

---

## Environment-Specific Settings

| Setting | Development | Production |
|---------|-------------|------------|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://your-domain.com` |
| Cookie `secure` flag | Not set | Set (HTTPS only) |
| Error messages | Full details | Generic message |
| `NODE_ENV` | `development` | `production` (set by build) |

`serverError()` in `src/lib/api-guard.ts` automatically returns full errors in dev and generic messages in prod.

---

## Updating the App

```bash
git pull origin main
npm install          # in case dependencies changed
npm run build
pm2 restart sms      # or: docker compose up --build -d
```

---

## Backup

All data lives in Microsoft Dataverse — no local database to back up.

Back up your Dataverse environment via:

**Power Platform Admin Center → Environments → Your Environment → Backups**

Dataverse also supports data export to Azure Blob Storage or CSV via Dataflows.
