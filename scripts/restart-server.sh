아 그#!/bin/bash

# Schedule GLTR-OUS Server Restart Script
# This script manages the production server and Cloudflare Tunnel restart

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_FILE="$PROJECT_DIR/server.js"
APP_NAME="schedule-gltr-ous"
LOG_DIR="$PROJECT_DIR/logs"
TUNNEL_SERVICE="cloudflared-hyun-schedule"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Schedule GLTR-OUS Full Stack Restart${NC}"
echo -e "${GREEN}============================================${NC}"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}Error: PM2 is not installed${NC}"
    echo "Please install PM2: npm install -g pm2"
    exit 1
fi

# Stop existing PM2 process if running
echo -e "${YELLOW}Stopping existing server...${NC}"
pm2 delete "$APP_NAME" 2>/dev/null || echo "No existing process found"

# Start server with PM2
echo -e "${YELLOW}Starting server with PM2...${NC}"
cd "$PROJECT_DIR"
pm2 start "$SERVER_FILE" \
    --name "$APP_NAME" \
    --time \
    --log "$LOG_DIR/combined.log" \
    --error "$LOG_DIR/error.log" \
    --output "$LOG_DIR/output.log" \
    --env production

# Save PM2 configuration
pm2 save

# Display server status
echo -e "${GREEN}✓ Node.js server started successfully!${NC}"
pm2 status

# Wait for server to be ready
echo -e "\n${YELLOW}Waiting for server to be ready...${NC}"
sleep 3

# Restart Cloudflare Tunnel
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}Restarting Cloudflare Tunnel...${NC}"
echo -e "${BLUE}======================================${NC}"

if sudo systemctl is-active --quiet "$TUNNEL_SERVICE"; then
    echo -e "${YELLOW}Restarting $TUNNEL_SERVICE...${NC}"
    sudo systemctl restart "$TUNNEL_SERVICE"
    sleep 2
else
    echo -e "${YELLOW}Starting $TUNNEL_SERVICE...${NC}"
    sudo systemctl start "$TUNNEL_SERVICE"
    sleep 2
fi

# Check Cloudflare Tunnel status
if sudo systemctl is-active --quiet "$TUNNEL_SERVICE"; then
    echo -e "${GREEN}✓ Cloudflare Tunnel is running${NC}"
    sudo systemctl status "$TUNNEL_SERVICE" --no-pager | head -15
else
    echo -e "${RED}✗ Cloudflare Tunnel failed to start${NC}"
    echo -e "${YELLOW}Check logs with: sudo journalctl -u $TUNNEL_SERVICE -n 50${NC}"
fi

# Show recent app logs
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}Recent Node.js App Logs:${NC}"
echo -e "${GREEN}======================================${NC}"
pm2 logs "$APP_NAME" --lines 15 --nostream

# Test local connection
echo -e "\n${YELLOW}Testing local connection to port 4312...${NC}"
if curl -s http://localhost:4312 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ App is responding on port 4312${NC}"
else
    echo -e "${RED}✗ App is not responding on port 4312${NC}"
    echo -e "${YELLOW}Check PM2 logs: pm2 logs $APP_NAME${NC}"
fi

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "App URL:      ${BLUE}https://hyun-schedule.moondo.ai${NC}"
echo -e "Local:        ${BLUE}http://localhost:4312${NC}"
echo -e "\n${GREEN}Commands:${NC}"
echo -e "  PM2 logs:           ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "  PM2 monitor:        ${YELLOW}pm2 monit${NC}"
echo -e "  PM2 restart:        ${YELLOW}pm2 restart $APP_NAME${NC}"
echo -e "  Tunnel logs:        ${YELLOW}sudo journalctl -u $TUNNEL_SERVICE -f${NC}"
echo -e "  Tunnel status:      ${YELLOW}sudo systemctl status $TUNNEL_SERVICE${NC}"
echo -e "  Tunnel restart:     ${YELLOW}sudo systemctl restart $TUNNEL_SERVICE${NC}"
echo -e "${GREEN}============================================${NC}"
