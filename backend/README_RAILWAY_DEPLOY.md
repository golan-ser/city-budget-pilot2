# 🚀 Railway Deployment Guide - City Budget Backend

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Variables Required in Railway:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your-supabase-connection-string
ALLOWED_ORIGINS=https://city-budget-pilot2.vercel.app,https://city-budget-frontend-v2.vercel.app,https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DEMO_TOKEN=PRODUCTION_SECURE_TOKEN_2024
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo-1106
OPENAI_MAX_TOKENS=800
LOG_LEVEL=warn
MAX_FILE_SIZE=10485760
FORCE_HTTPS=true
TRUST_PROXY=true
```

### 2. **Database Connection (Supabase):**
```bash
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. **CORS Origins (CRITICAL):**
```bash
# Add ALL your frontend domains - EXACT MATCH REQUIRED
ALLOWED_ORIGINS=https://city-budget-pilot2.vercel.app,https://city-budget-frontend-v2.vercel.app,https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app

# For testing only (NOT for production):
# ALLOWED_ORIGINS=*
```

## 🛠️ **Deployment Steps:**

### Step 1: Railway Project Setup
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Connect your GitHub repository
4. Select the backend folder

### Step 2: Configure Build Settings
Railway will automatically detect the `Dockerfile` and configuration.

### Step 3: Set Environment Variables
In Railway Dashboard → Variables tab, add all the environment variables listed above.

**⚠️ CRITICAL: Make sure ALLOWED_ORIGINS includes the EXACT Vercel domain:**
`https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app`

### Step 4: Deploy
Click "Deploy" and monitor the logs.

## 🔍 **Troubleshooting CORS Issues:**

### Common CORS Problems:

#### 1. **Missing Domain in ALLOWED_ORIGINS**
```bash
# Error: "No 'Access-Control-Allow-Origin' header is present"
# Solution: Add the EXACT domain to ALLOWED_ORIGINS
```

#### 2. **Preflight Request Failures**
```bash
# Error: "Response to preflight request doesn't pass access control check"
# Solution: Ensure OPTIONS method is allowed and headers are configured
```

#### 3. **Environment Variables Not Applied**
```bash
# After updating ALLOWED_ORIGINS, always REDEPLOY Railway
# Variables are only applied after deployment
```

## 📊 **Health Check:**
Once deployed, test the health endpoint:
```bash
curl https://impartial-luck-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T...",
  "environment": "production"
}
```

## 🎯 **Post-Deployment:**
1. Update frontend `VITE_API_URL` to point to Railway domain
2. Test all API endpoints with CORS
3. Monitor logs for any errors
4. Set up monitoring/alerts if needed

## 🚨 **Current Status:**
- **Backend URL:** `https://impartial-luck-production.up.railway.app`
- **Frontend URL:** `https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app`
- **Status:** CORS configuration updated, needs Railway redeploy

---
**📞 Support:** If CORS errors persist, ensure ALLOWED_ORIGINS in Railway matches EXACTLY the frontend domain. 