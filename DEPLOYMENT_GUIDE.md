# 🚀 Odisha MargDarshak — Complete Deployment Guide

This guide covers all production deployment strategies for the **Odisha MargDarshak Smart Logistics & Disaster AI Platform** (Next.js 16 + FastAPI + PostGIS/SQLite).

---

## 🌟 Method 1: Free Cloud Deployment (Recommended for SIH & Demos)

Deploy the **Frontend on Vercel** and the **Backend on Render.com / Railway** with free automatic SSL & live URLs in under 5 minutes.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: production ready deployment"
git push origin main
```

### Step 2: Deploy Backend to Render.com (Free)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `odisha-margdarshak-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   - `PROJECT_NAME` = `Odisha MargDarshak Intelligence Platform`
   - `SECRET_KEY` = `generate-any-random-32-character-secret-key`
   - `BACKEND_CORS_ORIGINS` = `["*"]`
5. Click **Create Web Service**.
6. Copy your live backend URL (e.g., `https://odisha-margdarshak-backend.onrender.com`).

### Step 3: Deploy Frontend to Vercel (Free)
1. Go to [Vercel Dashboard](https://vercel.com/new) and import your GitHub repository.
2. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
3. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://odisha-margdarshak-backend.onrender.com/api/v1`
4. Click **Deploy**.
5. Your live app is now live with global CDN & SSL (e.g., `https://odisha-margdarshak.vercel.app`)!

---

## 🖥️ Method 2: Cloud VM / VPS Deployment (AWS EC2 / DigitalOcean / Hostinger / GCP)

Deploy on an Ubuntu Linux virtual server with persistent background processes.

### 1. Connect to Server & Clone
```bash
ssh root@your-server-ip
git clone https://github.com/rajks9477/Odisha-MargDarshak.git
cd Odisha-MargDarshak
```

### 2. Run Automated Linux Startup Script
```bash
chmod +x start_production.sh
./start_production.sh
```

### 3. (Optional) Nginx Reverse Proxy with Free SSL (Certbot)
Install Nginx and Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/nermargdarshak`:
```nginx
server {
    server_name nermargdarshak.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & generate SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/nermargdarshak /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nermargdarshak.yourdomain.com
```

---

## 🐳 Method 3: Docker & Docker Compose

For environments with Docker and Docker Compose installed:

```bash
# Build and run all microservices in production mode
docker-compose -f docker-compose.prod.yml up -d --build

# Inspect running containers
docker-compose ps

# View live telemetry logs
docker-compose logs -f
```

---

## ⚡ Method 4: Local Windows Server Production Run

Simply double-click [`start_production.bat`](file:///d:/TECH/PROJECT/NER-MargDarshi/start_production.bat) or run from PowerShell:
```powershell
.\start_production.bat
```
This automatically sets up Python virtualenv, installs backend packages, builds the Next.js production bundle, and launches both services on ports 8000 and 3000!

---

## 🛡️ Default RBAC Demo Credentials for Evaluators

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Central Admin (Odisha State Command)** | `admin@odishamargdarshak.gov.in` | `Admin@Odisha2026` | Odisha State Command Desk |
| **Driver (Essential Carrier)** | `driver.biren@odishamargdarshak.in` | `Driver@Pass123` | Driver Console & GPS Navigator |
| **Field Officer (Bhadrak / ODRAF)** | `officer.bhadrak@odishamargdarshak.gov.in` | `Officer@Bhadrak2026` | Live Camera Incident Reporting Desk |
| **Citizen (Bhubaneswar, Khordha)** | `citizen.bhubaneswar@odishamargdarshak.in` | `Citizen@Pass123` | 360° Safety Map & Community Reports |
| **District Admin (Balasore DDMA)** | `district.balasore@odishamargdarshak.gov.in` | `Admin@Balasore2026` | District Logistics & Approvals |
