# 📋 Deployment Checklist

Use this checklist before deploying to Heroku + Vercel.

## Pre-Deployment Checks

### ✅ Code Ready

- [ ] All changes committed to git
  ```bash
  git status  # Should be clean
  ```

- [ ] Tests passing locally (if you have tests)
  ```bash
  cd server && python -m pytest  # If applicable
  ```

- [ ] Backend starts locally
  ```bash
  cd server && python api/server.py
  # Should see: "Starting Flask API Server on port..."
  ```

- [ ] Frontend builds locally
  ```bash
  yarn build
  # Should complete without errors
  ```

### ✅ Environment Variables

- [ ] `server/.env` file exists with all required keys
  - ASI_API_KEY
  - CHART_IMG_API_KEY
  - GOOGLE_API_KEY
  - MONGODBURI

- [ ] MongoDB Atlas allows all IPs (0.0.0.0/0)
  - Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere

### ✅ Files Present

Check these files exist:

- [ ] `Procfile` (Heroku startup)
- [ ] `runtime.txt` (Python version)
- [ ] `server/requirements.txt` (Python dependencies)
- [ ] `server/scripts/start_heroku.sh` (Multi-process startup)
- [ ] `.slugignore` (Reduce deployment size)
- [ ] `app.json` (Heroku configuration)

### ✅ Configuration Verified

- [ ] CORS allows Vercel domains (in `server/api/server.py`)
  ```python
  "https://*.vercel.app",
  "https://superio.vercel.app",
  ```

- [ ] Flask reads PORT from environment (in `server/api/server.py`)
  ```python
  port = int(os.getenv("PORT") or os.getenv("FLASK_PORT", 5001))
  ```

- [ ] Supervisor installed in requirements
  ```bash
  grep supervisor server/requirements.txt
  # Should show: supervisor==4.2.5
  ```

---

## Deployment Steps

### 1️⃣ Heroku Backend

- [ ] Heroku CLI installed
  ```bash
  heroku --version
  ```

- [ ] Logged into Heroku
  ```bash
  heroku login
  ```

- [ ] Created Heroku app
  ```bash
  heroku create superio-backend
  ```

- [ ] Set environment variables
  ```bash
  ./scripts/heroku-set-env.sh superio-backend
  # Or manually with heroku config:set
  ```

- [ ] Deployed to Heroku
  ```bash
  git push heroku main
  ```

- [ ] Backend health check passes
  ```bash
  curl https://superio-backend.herokuapp.com/api/health
  # Should return: {"status": "healthy"}
  ```

- [ ] Logs show all services started
  ```bash
  heroku logs --tail -a superio-backend
  # Should see: coin_agent, fgi_agent, defi_agent, coordinator_agent, flask_api all "RUNNING"
  ```

### 2️⃣ Vercel Frontend

- [ ] Vercel CLI installed
  ```bash
  vercel --version
  ```

- [ ] Logged into Vercel
  ```bash
  vercel login
  ```

- [ ] Deployed to Vercel
  ```bash
  vercel --prod
  ```

- [ ] Environment variable set
  ```bash
  vercel env add NEXT_PUBLIC_API_URL production
  # Value: https://superio-backend.herokuapp.com
  ```

- [ ] Redeployed after env var
  ```bash
  vercel --prod
  ```

- [ ] Frontend loads in browser
  - Open: `https://your-app.vercel.app`
  - Should see: Landing page or chat interface

### 3️⃣ Integration Testing

- [ ] Frontend can connect to backend
  - Open frontend URL
  - Open browser console
  - Should see API requests to `https://superio-backend.herokuapp.com`

- [ ] Wallet connection works
  - Click "Connect Wallet"
  - Connect with MetaMask/RainbowKit
  - Should show connected address

- [ ] Chat functionality works
  - Send a test message
  - Should receive AI response
  - Check Heroku logs for processing

- [ ] Chart analysis works (if applicable)
  - Send: "analyze eth chart"
  - Should return chart analysis
  - Chart image should load

- [ ] Database persistence works
  - Send a message
  - Refresh page
  - Should see conversation in sidebar

---

## Post-Deployment

### ✅ Monitoring Setup

- [ ] Heroku logs accessible
  ```bash
  heroku logs --tail -a superio-backend
  ```

- [ ] Vercel deployment logs accessible
  - Check Vercel dashboard

- [ ] MongoDB Atlas metrics enabled
  - Check MongoDB Atlas dashboard

### ✅ Performance Optimization

- [ ] Consider upgrading to Eco dyno ($5/month)
  ```bash
  heroku ps:scale web=1:eco -a superio-backend
  ```

- [ ] Enable Vercel Analytics (optional)
  - Go to Vercel dashboard → Analytics

### ✅ Security

- [ ] API keys are in Heroku config (not in code)
  ```bash
  heroku config -a superio-backend
  # Should NOT show actual values in code
  ```

- [ ] MongoDB has authentication enabled
  - Check MongoDB Atlas settings

- [ ] CORS properly configured
  - Only allows your domains

### ✅ Documentation

- [ ] Update README with production URLs
- [ ] Document any deployment issues encountered
- [ ] Share access with team (if applicable)

---

## Rollback Plan

If something goes wrong:

### Heroku Rollback

```bash
# See recent releases
heroku releases -a superio-backend

# Rollback to previous version
heroku rollback -a superio-backend
```

### Vercel Rollback

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url> --prod
```

---

## Troubleshooting

### Issue: "Application Error" on Heroku

**Checks:**
1. `heroku logs --tail -a superio-backend`
2. Verify all env vars set: `heroku config -a superio-backend`
3. Check buildpack: `heroku buildpacks -a superio-backend`
4. Restart: `heroku restart -a superio-backend`

### Issue: Frontend can't connect to backend

**Checks:**
1. NEXT_PUBLIC_API_URL is set: `vercel env ls`
2. CORS allows Vercel domain (check server/api/server.py)
3. Backend is running: `curl https://superio-backend.herokuapp.com/api/health`
4. Check browser console for CORS errors

### Issue: Supervisor not starting all processes

**Checks:**
1. Check logs: `heroku logs --tail -a superio-backend | grep supervisor`
2. Verify start_heroku.sh is executable
3. Check supervisor config in logs
4. Verify all agent imports work

---

## Success Criteria

✅ **You're successfully deployed when:**

1. Backend health endpoint returns `{"status": "healthy"}`
2. Frontend loads without errors
3. Wallet connection works
4. Chat messages send and receive responses
5. Messages persist in database
6. Logs show all services running
7. No CORS errors in browser console

---

## Next Steps After Deployment

- [ ] Monitor logs for first 24 hours
- [ ] Set up error tracking (Sentry)
- [ ] Configure custom domain (optional)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Enable MongoDB backups
- [ ] Load testing (optional)
- [ ] Share with users!

---

**Good luck with your deployment! 🚀**
