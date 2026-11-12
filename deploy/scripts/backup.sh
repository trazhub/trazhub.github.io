#!/usr/bin/env bash
# Automated SQLite backup for TrazLinks
# Install: sudo cp deploy/scripts/backup.sh /opt/trazlinks/backup.sh
#          sudo chmod +x /opt/trazlinks/backup.sh
#          sudo chown trazlinks:trazlinks /opt/trazlinks/backup.sh
#
# Add to crontab (runs as root, backs up as trazlinks user):
#   sudo crontab -e
#   0 3 * * * /opt/trazlinks/backup.sh >> /var/log/trazlinks-backup.log 2>&1

set -euo pipefail

APP_DIR="/opt/trazlinks"
DB_FILE="$APP_DIR/db/app.db"
BACKUP_DIR="$APP_DIR/db/backups"
KEEP_DAYS=30

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/app_$DATE.db"

mkdir -p "$BACKUP_DIR"

# Use SQLite's online backup API — safe while the app is running
sqlite3 "$DB_FILE" ".backup $BACKUP_FILE"

# Compress the backup
gzip -f "$BACKUP_FILE"

echo "[$DATE] Backup saved: ${BACKUP_FILE}.gz ($(du -sh "${BACKUP_FILE}.gz" | cut -f1))"

# Delete backups older than KEEP_DAYS days
find "$BACKUP_DIR" -name "app_*.db.gz" -mtime +$KEEP_DAYS -delete
echo "[$DATE] Pruned backups older than $KEEP_DAYS days"
