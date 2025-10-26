# 🚀 Quick Deployment Guide

Deploy Superio AI to production in 10 minutes!

## Prerequisites

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Install Vercel CLI
npm i -g vercel

# Login
heroku login
vercel login
```

---

## Step 1: Deploy Backend to Heroku (5 min)

### A. Create Heroku App

```bash
# Create app
heroku create superio-backend

# Or with custom name
heroku create your-backend-name
```

### B. Set Environment Variables (Easy Way)

```bash
# Run the helper script
./scripts/heroku-set-env.sh superio-backend
```

**Or manually:**

```bash
# IMPORTANT: Replace with your actual API keys from server/.env
heroku config:set \
  ASI_API_KEY="your_asi_api_key_here" \
  CHART_IMG_API_KEY="your_chart_img_api_key_here" \
  GOOGLE_API_KEY="your_google_api_key_here" \
  MONGODBURI="your_mongodb_uri_here" \
  -a superio-backend
```

### C. Deploy

```bash
# Make sure you're on main branch
git add .
git commit -m "Ready for deployment"

# Deploy to Heroku
git push heroku main

# Watch it build (takes ~2-3 minutes)
```

### D. Verify Backend is Running

```bash
# Check status
heroku ps -a superio-backend

# View logs
heroku logs --tail -a superio-backend

# Test health endpoint
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

✅ **Backend URL:** `https://superio-backend.herokuapp.com`

---

## Step 2: Deploy Frontend to Vercel (3 min)

### A. Deploy

```bash
# From project root
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → superio (or your preferred name)
- **Directory?** → ./
- **Override settings?** → No

### B. Set Environment Variable

```bash
# Add backend URL
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, enter:
https://superio-backend.herokuapp.com
```

### C. Redeploy with Environment Variable

```bash
vercel --prod
```

✅ **Frontend URL:** `https://superio.vercel.app` (or your custom domain)

---

## Step 3: Update CORS (1 min)

Update your Vercel domain in the backend CORS settings:

```bash
# SSH into local code or edit on GitHub
# In server/api/server.py line 27, update:
"https://superio.vercel.app",  # Your actual Vercel domain
```

Then redeploy backend:

```bash
git add server/api/server.py
git commit -m "Update CORS with Vercel domain"
git push heroku main
```

---

## Step 4: Test Everything (1 min)

### Test Backend

```bash
curl https://superio-backend.herokuapp.com/api/health
```

### Test Frontend

1. Open `https://superio.vercel.app` (your actual domain)
2. Connect wallet
3. Send a message
4. Check if chat works

### Check Logs

```bash
# Backend logs
heroku logs --tail -a superio-backend

# Frontend logs (in Vercel dashboard)
vercel logs
```

---

## 🎉 You're Live!

- **Frontend:** https://superio.vercel.app
- **Backend:** https://superio-backend.herokuapp.com

---

## Common Issues & Fixes

### ❌ Backend shows "Application Error"

**Fix:**
```bash
# Check logs
heroku logs --tail -a superio-backend

# Restart
heroku restart -a superio-backend
```

### ❌ Frontend can't connect to backend

**Fix:**
1. Check NEXT_PUBLIC_API_URL is set:
   ```bash
   vercel env ls
   ```
2. Verify CORS includes your Vercel domain
3. Check browser console for CORS errors

### ❌ MongoDB connection failed

**Fix:**
1. Whitelist all IPs in MongoDB Atlas:
   - Go to Network Access
   - Add IP: `0.0.0.0/0`
2. Check MONGODBURI is set:
   ```bash
   heroku config -a superio-backend | grep MONGO
   ```

### ❌ Chart images not loading

**Fix:**
Charts are generated on-demand. On Heroku free/eco, they're stored temporarily and may be lost on dyno restart. Upgrade to demo_charts for persistent storage (already configured).

---

## Upgrade to Remove Sleep (Recommended)

Free Heroku dynos sleep after 30 minutes. Upgrade to Eco ($5/month):

```bash
heroku ps:scale web=1:eco -a superio-backend
```

Benefits:
- ✅ No sleep
- ✅ Better performance
- ✅ More reliable

---

## Monitoring

### Check dyno status
```bash
heroku ps -a superio-backend
```

### View recent logs
```bash
heroku logs -n 200 -a superio-backend
```

### Check resource usage
```bash
heroku logs --tail -a superio-backend | grep memory
```

---

## Useful Commands

```bash
# View all config vars
heroku config -a superio-backend

# Set a single var
heroku config:set KEY=VALUE -a superio-backend

# Restart app
heroku restart -a superio-backend

# Open in browser
heroku open -a superio-backend

# SSH into dyno (for debugging)
heroku run bash -a superio-backend
```

---

## Next Steps

- [ ] Add custom domain to Vercel
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics
- [ ] Configure MongoDB backups
- [ ] Set up CI/CD with GitHub Actions

---

## Cost Summary

### Current Setup:
- **Backend (Heroku Free):** $0/month (sleeps after 30 min)
- **Frontend (Vercel Free):** $0/month
- **Database (MongoDB Atlas M0):** $0/month
- **Total:** $0/month

### Recommended Production:
- **Backend (Heroku Eco):** $5/month (no sleep)
- **Frontend (Vercel Free):** $0/month
- **Database (MongoDB Atlas M0):** $0/month
- **Total:** $5/month

---

## Support

- **Heroku Issues:** https://help.heroku.com
- **Vercel Issues:** https://vercel.com/support
- **MongoDB Issues:** https://support.mongodb.com

**Happy Deploying! 🚀**
