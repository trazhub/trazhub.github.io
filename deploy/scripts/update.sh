#!/usr/bin/env bash
# Zero-downtime-ish update script for TrazLinks
# Run from the app directory: sudo bash deploy/scripts/update.sh

set -euo pipefail

APP_DIR="/opt/trazlinks"
SERVICE="trazlinks"

echo "[update] Pulling latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

echo "[update] Installing dependencies (including dev for build)..."
npm ci

echo "[update] Building frontend..."
npm run build

echo "[update] Pruning dev dependencies..."
npm prune --omit=dev

echo "[update] Backing up database..."
bash deploy/scripts/backup.sh

echo "[update] Restarting service..."
systemctl restart "$SERVICE"

echo "[update] Waiting for service to come up..."
sleep 3
systemctl is-active --quiet "$SERVICE" && echo "[update] Done. Service is running." || (echo "[update] ERROR: Service failed to start. Check: journalctl -u $SERVICE -n 50" && exit 1)
