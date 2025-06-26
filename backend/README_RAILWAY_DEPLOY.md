# 🚀 Railway Deployment Guide - City Budget Backend

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Variables Required in Railway:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your-supabase-connection-string
ALLOWED_ORIGINS=https://city-budget-pilot2.vercel.app,https://city-budget-frontend-v2.vercel.app
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

### 3. **CORS Origins:**
```bash
# Add all your frontend domains
ALLOWED_ORIGINS=https://city-budget-pilot2.vercel.app,https://city-budget-frontend-v2.vercel.app
```

## 🛠️ **Deployment Steps:**

### Step 1: Railway Project Setup
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Connect your GitHub repository
4. Select the backend folder

### Step 2: Configure Build Settings
Railway will automatically detect the `Dockerfile` and `railway.json` configuration.

### Step 3: Set Environment Variables
In Railway Dashboard → Variables tab, add all the environment variables listed above.

### Step 4: Deploy
Click "Deploy" and monitor the logs.

## 🔍 **Troubleshooting:**

### Common Issues:

#### 1. **Database Connection Failed**
```bash
# Check DATABASE_URL format
# Ensure Supabase allows connections from Railway IPs
# Verify database credentials
```

#### 2. **CORS Errors**
```bash
# Update ALLOWED_ORIGINS with your actual domains
# Include both www and non-www versions if needed
```

#### 3. **Build Failures**
```bash
# Check logs for specific error messages
# Ensure all dependencies are in package.json
# Verify Node.js version compatibility
```

## 📊 **Health Check:**
Once deployed, test the health endpoint:
```bash
curl https://your-railway-domain.up.railway.app/health
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
2. Test all API endpoints
3. Monitor logs for any errors
4. Set up monitoring/alerts if needed

---
**📞 Support:** If deployment fails, check Railway logs and ensure all environment variables are set correctly. 