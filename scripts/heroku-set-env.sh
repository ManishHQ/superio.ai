#!/bin/bash

# Script to set Heroku environment variables from .env file
# Usage: ./scripts/heroku-set-env.sh <app-name>

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <heroku-app-name>${NC}"
    echo ""
    echo "Example: $0 superio-backend"
    exit 1
fi

APP_NAME=$1

echo -e "${BLUE}🔧 Setting environment variables for: ${GREEN}$APP_NAME${NC}"
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env file not found!${NC}"
    echo "Please create it first from server/.env.example"
    exit 1
fi

# Load .env file and extract values
source server/.env

echo -e "${YELLOW}Setting API keys...${NC}"
heroku config:set \
    ASI_API_KEY="$ASI_API_KEY" \
    CHART_IMG_API_KEY="$CHART_IMG_API_KEY" \
    GOOGLE_API_KEY="$GOOGLE_API_KEY" \
    -a $APP_NAME

echo -e "${YELLOW}Setting database...${NC}"
heroku config:set \
    MONGODBURI="$MONGODBURI" \
    -a $APP_NAME

echo -e "${YELLOW}Setting Flask configuration...${NC}"
heroku config:set \
    FLASK_DEBUG=False \
    -a $APP_NAME

echo -e "${YELLOW}Setting agent ports...${NC}"
heroku config:set \
    COORDINATOR_PORT="$COORDINATOR_PORT" \
    DEFI_AGENT_PORT="$DEFI_AGENT_PORT" \
    FGI_AGENT_PORT="$FGI_AGENT_PORT" \
    COIN_AGENT_PORT="$COIN_AGENT_PORT" \
    -a $APP_NAME

echo ""
echo -e "${GREEN}✅ Environment variables set successfully!${NC}"
echo ""
echo -e "${BLUE}Verify with:${NC} heroku config -a $APP_NAME"
