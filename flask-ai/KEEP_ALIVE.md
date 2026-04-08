# Keep-Alive Solutions for Render Free Tier

Render's free tier spins down services after **15 minutes of inactivity**. The health check logs you see are from Render's own monitoring, but they don't count as "activity" to prevent spin-down.

## The Problem

Your logs show Render sending SIGTERM (graceful shutdown) after health checks. This happens because:
1. No real traffic hits your service within 15 minutes
2. Render spins down free services to save resources

## Solutions (Pick One)

### Option 1: GitHub Actions (FREE - Recommended)

Create `.github/workflows/keep-alive.yml` in your repo:

```yaml
name: Keep Render Service Alive

on:
  schedule:
    # Run every 10 minutes (render spins down after 15 min)
    - cron: '*/10 * * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Service
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            https://fitness-app-backend-ap0r.onrender.com/api/ping
```

**Pros:** Completely free, no external dependencies  
**Cons:** Requires public repo or GitHub Pro for private repo scheduled actions

### Option 2: UptimeRobot (FREE)

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free tier)
2. Add monitor: HTTPS → `https://your-service.onrender.com/api/ping`
3. Set interval: 5 minutes
4. Optional: Add email alert for actual downtime

**Pros:** Simple, monitors actual uptime too  
**Cons:** 5-min interval means 10-min gaps possible (still usually works)

### Option 3: Cron-Job.org (FREE)

1. Go to [cron-job.org](https://cron-job.org)
2. Create account → "Create cronjob"
3. URL: `https://your-service.onrender.com/api/ping`
4. Schedule: Every 10 minutes
5. Timeout: 30 seconds

**Pros:** Purpose-built for this, reliable  
**Cons:** Another external dependency

### Option 4: Better Uptime (FREE)

1. [betterstack.com](https://betterstack.com) - free tier includes monitoring
2. Similar setup to UptimeRobot

## Recent Changes Made

1. **Disabled `preload_app`** in `gunicorn.conf.py` - Models now lazy-load on first request, reducing startup memory
2. **Added `/api/ping` endpoint** - Ultra-lightweight (no model loading) for keep-alive pings
3. **Added `healthCheckTimeout: 60`** in `render.yaml` - Gives time for lazy model loading
4. **Updated `/api/health`** - No longer triggers model loading, responds quickly

## Deploy Changes

```bash
git add .
git commit -m "Optimize for Render free tier - lazy loading + keep-alive endpoints"
git push origin main
```

## Verify

After deploy, test the endpoints:

```bash
# Fast ping (for keep-alive services)
curl https://your-service.onrender.com/api/ping

# Health check (for Render's monitoring)
curl https://your-service.onrender.com/api/health

# First API call (will lazy-load models, takes ~5-10s)
curl -X POST https://your-service.onrender.com/api/diet \
  -H "Content-Type: application/json" \
  -d '{"age": 30, "weight": 70, "height": 175, "activity_level": "moderate"}'
```

## Important Notes

- **First request after spin-up will be slow** (~5-10s) due to model loading - this is normal
- **512MB RAM limit** - If you still get SIGTERM during startup, models may be too large. Consider:
  - Using smaller/fewer ML models
  - Upgrading to Render's starter tier ($7/month)
- **Free tier limitations** are unavoidable - these solutions work around Render's spin-down policy
