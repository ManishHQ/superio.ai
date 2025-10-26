# Heroku Deployment Guide for Superio AI

## Overview

This guide will help you deploy both the backend and frontend to Heroku.

## Architecture

- **Backend**: Python Flask + Multi-Agent System (Port: dynamic from Heroku)
- **Frontend**: Next.js (Port: dynamic from Heroku)
- **Database**: MongoDB Atlas (external)

## Prerequisites

1. **Heroku CLI** installed
   ```bash
   brew install heroku/brew/heroku
   # or
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Heroku Account** (free tier available)
   - Sign up at https://heroku.com

3. **Git** repository initialized
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

## Deployment Steps

### 1. Backend Deployment

#### A. Create Heroku App for Backend

```bash
# Login to Heroku
heroku login

# Create backend app
heroku create superio-backend

# Or with custom name
heroku create your-custom-backend-name
```

#### B. Set Environment Variables

```bash
# IMPORTANT: Get your actual values from server/.env file
heroku config:set ASI_API_KEY="your_asi_api_key_here" -a superio-backend
heroku config:set CHART_IMG_API_KEY="your_chart_img_api_key_here" -a superio-backend
heroku config:set GOOGLE_API_KEY="your_google_api_key_here" -a superio-backend
heroku config:set MONGODBURI="your_mongodb_uri_here" -a superio-backend
heroku config:set FLASK_DEBUG="False" -a superio-backend
heroku config:set COORDINATOR_PORT="8000" -a superio-backend
heroku config:set DEFI_AGENT_PORT="8001" -a superio-backend
heroku config:set FGI_AGENT_PORT="8003" -a superio-backend
heroku config:set COIN_AGENT_PORT="8004" -a superio-backend
```

#### C. Set Python Version

Heroku will use `runtime.txt` (already created with Python 3.10.19)

#### D. Deploy Backend

```bash
# Deploy using Procfile (backend only)
git push heroku main

# Check logs
heroku logs --tail -a superio-backend
```

### 2. Frontend Deployment

#### A. Create Heroku App for Frontend

```bash
# Create frontend app
heroku create superio-frontend
```

#### B. Set Environment Variables

```bash
# Set backend API URL
heroku config:set NEXT_PUBLIC_API_URL="https://superio-backend.herokuapp.com" -a superio-frontend
```

#### C. Deploy Frontend

**Option 1: Deploy from same repo (using subdirectory)**

```bash
# Create a separate git remote for frontend
heroku git:remote -a superio-frontend -r heroku-frontend

# Deploy (this is tricky with monorepo)
# You'll need to use buildpack
heroku buildpacks:set heroku/nodejs -a superio-frontend
```

**Option 2: Use Vercel for Frontend (Recommended)**

Since you have a monorepo, it's easier to deploy frontend to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://superio-backend.herokuapp.com
```

### 3. Update Frontend API Calls

Update API endpoint in your frontend code:

```typescript
// In all API calls, replace localhost with production URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Example:
const response = await fetch(`${API_URL}/api/chat`, {...});
```

### 4. Update CORS in Backend

Update `server/api/server.py`:

```python
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "https://superio-frontend.herokuapp.com",  # If using Heroku for frontend
    "https://your-app.vercel.app",  # If using Vercel
    "https://*.vercel.app"  # Allow all Vercel preview deployments
])
```

## Testing

### Backend Health Check

```bash
curl https://superio-backend.herokuapp.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Superio AI API Server",
  "version": "1.0.0"
}
```

### Check Logs

```bash
# Backend logs
heroku logs --tail -a superio-backend

# Frontend logs (if on Heroku)
heroku logs --tail -a superio-frontend
```

## Scaling & Performance

### Eco Dynos ($5/month - No sleep)

```bash
# Upgrade to Eco dyno (recommended)
heroku ps:scale web=1:eco -a superio-backend
```

### Basic Dynos ($7/month - Better performance)

```bash
# Upgrade to Basic dyno
heroku ps:scale web=1:basic -a superio-backend
```

## Cost Breakdown

### Option 1: Both on Heroku
- Backend (Eco): $5/month
- Frontend (Eco): $5/month
- **Total: $10/month**

### Option 2: Backend Heroku + Frontend Vercel (Recommended)
- Backend (Eco): $5/month
- Frontend (Vercel Free): $0/month
- **Total: $5/month**

### Option 3: Free Tier (with limitations)
- Backend (Free): Sleeps after 30 min
- Frontend (Vercel Free): $0/month
- **Total: $0/month** (but slow)

## Troubleshooting

### Issue: "Application Error" on startup

Check logs:
```bash
heroku logs --tail -a superio-backend
```

Common fixes:
1. Check all env vars are set
2. Verify MongoDB connection
3. Check supervisor is installed

### Issue: Port binding error

Heroku sets PORT dynamically. Make sure Flask reads from `os.getenv("PORT")` ✅ (already fixed)

### Issue: Agents not starting

Check supervisor logs in Heroku logs. All agents should show "Started" status.

## Monitoring

```bash
# Check dyno status
heroku ps -a superio-backend

# Check resource usage
heroku logs --tail -a superio-backend | grep memory

# Restart if needed
heroku restart -a superio-backend
```

## Quick Deploy Commands

```bash
# Backend
git push heroku main
heroku logs --tail -a superio-backend

# Frontend (if on Heroku)
git push heroku-frontend main
heroku logs --tail -a superio-frontend

# Both at once
git push heroku main && git push heroku-frontend main
```

## Production Checklist

- [ ] All API keys added to Heroku config
- [ ] MongoDB Atlas whitelist 0.0.0.0/0 (allow all IPs)
- [ ] CORS updated with production domains
- [ ] Frontend API URL updated to production backend
- [ ] SSL/HTTPS enabled (automatic on Heroku)
- [ ] Logging configured
- [ ] Error monitoring setup (optional: Sentry)

## Recommended: Use Vercel for Frontend

Since Next.js is best on Vercel:

1. Deploy frontend to Vercel (free, fast, no config needed)
2. Deploy backend to Heroku Eco ($5/month)
3. Total cost: $5/month with best performance

```bash
# One command to deploy frontend
vercel --prod
```

## Support

- Heroku Docs: https://devcenter.heroku.com/
- Vercel Docs: https://vercel.com/docs

---

**Note**: For production, consider upgrading to at least Eco dynos ($5/month) to avoid cold starts and sleep timeouts.
