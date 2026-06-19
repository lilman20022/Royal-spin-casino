#!/bin/bash

set -e

echo "🎰 Royal Spin Casino - Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm found${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Create production environment file
echo -e "${YELLOW}Creating production environment configuration...${NC}"
cat > .env.production.local << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
HOUSE_EDGE=0.05
MIN_BET=1
MAX_BET=10000
DAILY_WITHDRAWAL_LIMIT=50000
VITE_API_URL=${VITE_API_URL}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
EOF

echo -e "${GREEN}✓ Environment configuration created${NC}"

# Run database migrations
echo -e "${YELLOW}Running database setup...${NC}"
npm run db:setup

# Seed games
echo -e "${YELLOW}Seeding games...${NC}"
npm run db:seed

echo -e "${GREEN}✓ Database setup complete${NC}"

# Build Docker image (if deploying to Docker)
if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t casino-platform:latest .
    echo -e "${GREEN}✓ Docker image built${NC}"
fi

echo -e "${GREEN}=================================================="
echo -e "✓ Deployment preparation complete!"
echo -e "=================================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy backend to Railway: railway up"
echo "2. Deploy frontend to Vercel: vercel --prod"
echo "3. Configure Stripe webhooks"
echo "4. Run smoke tests"
echo ""
