#!/bin/bash
set -e

echo "======================================================="
echo "   Odisha MargDarshak Production Startup Script (Linux)   "
echo "======================================================="

# 1. Backend Setup
echo "[1/3] Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "Backend started on port 8000 (PID: $!)."
cd ..

# 2. Frontend Setup
echo "[2/3] Setting up Frontend..."
cd frontend
npm install
npm run build
nohup npm start > frontend.log 2>&1 &
echo "Frontend started on port 3000 (PID: $!)."
cd ..

echo "======================================================="
echo "   Odisha MargDarshak Platform is LIVE!                  "
echo "   Frontend : http://0.0.0.0:3000                     "
echo "   Backend  : http://0.0.0.0:8000                     "
echo "======================================================="
