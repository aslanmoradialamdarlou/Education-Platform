# Production Deployment Guide

## Issue: Home Page Data Not Loading on Server

### Root Causes Identified:
1. **Frontend API URL misconfiguration** - Using relative path `/api` without proper reverse proxy
2. **CORS blocking** - Backend not allowing requests from production frontend IP

### Solution Applied:

#### 1. Frontend Configuration (`frontend/.env.production`)
Updated to use full server URL for API calls:
```
VITE_API_BASE_URL=http://195.177.255.8/api
```

#### 2. Backend CORS Configuration (`backend/config/cors.php`)
Updated to dynamically read frontend URL from environment and added production IP:
- Now reads `FRONTEND_URL` from `.env`
- Added production IP `195.177.255.8` to allowed origins

## Deployment Steps

### Backend Deployment:

1. **Update Environment File** on the server:
   ```bash
   cd /path/to/backend
   nano .env
   ```
   
   Update these critical values:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=http://195.177.255.8
   FRONTEND_URL=http://195.177.255.8
   SANCTUM_STATEFUL_DOMAINS=195.177.255.8,localhost
   ```

2. **Clear and rebuild cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan config:cache
   php artisan route:cache
   ```

3. **Restart PHP-FPM/Apache/Nginx**:
   ```bash
   sudo systemctl restart php8.2-fpm  # or your PHP version
   sudo systemctl restart nginx       # or apache2
   ```

### Frontend Deployment:

1. **Rebuild frontend** with production environment:
   ```bash
   cd /path/to/frontend
   npm run build
   ```
   This will use `.env.production` configuration automatically.

2. **Deploy built files**:
   ```bash
   # Copy dist folder to your web server directory
   sudo cp -r dist/* /var/www/html/
   # Or wherever your frontend is served from
   ```

## Server Configuration Options

### Option 1: Reverse Proxy (Recommended)

Use Nginx to proxy API requests:

```nginx
server {
    listen 80;
    server_name 195.177.255.8;
    root /var/www/html;
    index index.html;

    # Frontend (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (Laravel)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

If using reverse proxy, update `frontend/.env.production`:
```env
VITE_API_BASE_URL=/api
```

### Option 2: Separate Ports (Current Setup)

Backend runs on port 8000, frontend on port 80:
- Frontend: `http://195.177.255.8` → port 80
- Backend: `http://195.177.255.8:8000` → port 8000

Current configuration already supports this.

## Verification

After deployment, test the following endpoints:

1. **Health Check**:
   ```bash
   curl http://195.177.255.8/api/health
   # or
   curl http://195.177.255.8:8000/api/health
   ```

2. **Home Data**:
   ```bash
   curl http://195.177.255.8/api/v1/home
   ```

3. **Contents Count**:
   ```bash
   curl http://195.177.255.8/api/v1/contents/counts
   ```

4. **Questions Count**:
   ```bash
   curl http://195.177.255.8/api/v1/questions/count
   ```

All should return JSON responses without CORS errors.

## Troubleshooting

### Check Browser Console
Open browser DevTools (F12) → Console tab:
- Look for CORS errors
- Look for 404 errors on API calls
- Check Network tab for failed requests

### Check Laravel Logs
```bash
tail -f /path/to/backend/storage/logs/laravel.log
```

### Common Issues:

1. **CORS Error**: "Access to fetch at 'http://...' from origin 'http://...' has been blocked"
   - Solution: Verify `FRONTEND_URL` in backend `.env`
   - Clear config cache: `php artisan config:clear`

2. **404 on API calls**: API endpoints not found
   - Solution: Check if backend is running
   - Verify `VITE_API_BASE_URL` in frontend `.env.production`

3. **Empty counts/data**: API returns null or 0 for everything
   - Solution: Check if database has data
   - Run seeders if needed: `php artisan db:seed`

## Quick Fix Commands

```bash
# Backend
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache

# Frontend  
cd frontend
npm run build
```

## Files Modified

1. `frontend/.env.production` - Updated API URL
2. `backend/config/cors.php` - Added dynamic FRONTEND_URL and production IP
3. `backend/.env.production.example` - Created production environment example
4. `DEPLOYMENT.md` - This deployment guide
