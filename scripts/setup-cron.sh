#!/bin/bash

# Schedule automatic token refresh daily at 3 AM
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NODE_PATH="/home/hyun/.nvm/versions/node/v20.19.4/bin/node"

# Add cron job for daily token refresh at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * cd $SCRIPT_DIR/.. && $NODE_PATH scripts/auto-refresh-token.js check >> /tmp/token-refresh.log 2>&1") | crontab -

# Add cron job to restart server if it's down
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $SCRIPT_DIR/.. && pgrep -f 'node server.js' || $NODE_PATH server.js >> /var/log/schedule-server.log 2>&1 &") | crontab -

echo "Cron jobs added successfully!"
echo "Token will be refreshed daily at 3 AM"
echo "Server health check will run every 5 minutes"