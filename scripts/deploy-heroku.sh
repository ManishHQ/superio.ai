#!/bin/bash

# Heroku Deployment Helper Script
# Usage: ./scripts/deploy-heroku.sh [backend|frontend|both]

set -e

BACKEND_APP="superio-backend"
FRONTEND_APP="superio-frontend"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Superio AI - Heroku Deployment${NC}"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI not found. Please install it first:${NC}"
    echo "   brew install heroku/brew/heroku"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    echo -e "${GREEN}📦 Deploying Backend...${NC}"
    echo ""

    # Check if app exists
    if ! heroku apps:info -a $BACKEND_APP &> /dev/null; then
        echo -e "${BLUE}Creating new Heroku app: $BACKEND_APP${NC}"
        heroku create $BACKEND_APP

        # Set environment variables
        echo -e "${BLUE}Setting environment variables...${NC}"
        heroku config:set \
            ASI_API_KEY="$ASI_API_KEY" \
            CHART_IMG_API_KEY="$CHART_IMG_API_KEY" \
            GOOGLE_API_KEY="$GOOGLE_API_KEY" \
            MONGODBURI="$MONGODBURI" \
            FLASK_DEBUG="False" \
            COORDINATOR_PORT="8000" \
            DEFI_AGENT_PORT="8001" \
            FGI_AGENT_PORT="8003" \
            COIN_AGENT_PORT="8004" \
            -a $BACKEND_APP
    fi

    # Deploy
    echo -e "${BLUE}Pushing to Heroku...${NC}"
    git push heroku main

    # Show logs
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    echo -e "${BLUE}View at: https://$BACKEND_APP.herokuapp.com${NC}"
    echo ""
    echo "View logs with: heroku logs --tail -a $BACKEND_APP"
}

# Function to show frontend deployment instructions
deploy_frontend() {
    echo -e "${GREEN}📱 Frontend Deployment${NC}"
    echo ""
    echo -e "${BLUE}Recommended: Deploy to Vercel (easier for Next.js)${NC}"
    echo ""
    echo "1. Install Vercel CLI:"
    echo "   npm i -g vercel"
    echo ""
    echo "2. Deploy:"
    echo "   vercel --prod"
    echo ""
    echo "3. Set environment variable:"
    echo "   vercel env add NEXT_PUBLIC_API_URL production"
    echo "   Value: https://$BACKEND_APP.herokuapp.com"
    echo ""
    echo -e "${BLUE}Alternative: Deploy to Heroku${NC}"
    echo "   (Not recommended for monorepo)"
}

# Main logic
case "${1:-both}" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    both)
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    *)
        echo "Usage: $0 [backend|frontend|both]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Done!${NC}"
