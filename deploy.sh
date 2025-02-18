#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting BeatFlow deployment...${NC}\n"

# Frontend deployment
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
pnpm install
pnpm build

echo -e "${YELLOW}🚀 Deploying to GitHub Pages...${NC}"
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix frontend/dist origin gh-pages

# Backend deployment (if needed)
echo -e "\n${YELLOW}🔧 Building backend...${NC}"
cd ../backend
pnpm install
pnpm build

echo -e "${GREEN}✨ Deployment complete!${NC}\n"

# Print URLs
echo -e "Frontend URL: https://yourusername.github.io/BeatFlow"
echo -e "Backend URL: Your-Backend-URL" 