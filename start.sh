#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║       🚀 Maintenance System V3 - Quick Start              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Redis
echo -e "${BLUE}[1/6] Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}Redis is not running. Attempting to start...${NC}"
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
        sleep 2
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis started successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start Redis${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Redis is not installed${NC}"
        echo -e "${YELLOW}Install with: brew install redis${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Redis is running${NC}"
fi

# Check PostgreSQL
echo -e "${BLUE}[2/6] Checking PostgreSQL...${NC}"
if ! pg_isready > /dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo -e "${YELLOW}Start with: brew services start postgresql${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
fi

# Pull latest changes
echo -e "${BLUE}[3/6] Pulling latest changes...${NC}"
cd /Users/iivoiil/maintenance-system/maintenance-system
BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: ${BRANCH}${NC}"
git pull origin "$BRANCH" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${YELLOW}⚠ Could not pull latest changes (continuing anyway)${NC}"
fi

# Install dependencies
echo -e "${BLUE}[4/6] Installing dependencies...${NC}"
cd v3
npm install --silent > /dev/null 2>&1 &
NPM_PID=$!
while kill -0 $NPM_PID 2>/dev/null; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Generate Prisma Client
echo -e "${BLUE}[5/6] Generating Prisma Client...${NC}"
cd apps/api
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Failed to generate Prisma Client${NC}"
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}⚠ Please edit .env with your database credentials${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
fi

# Start servers
echo -e "${BLUE}[6/6] Starting servers...${NC}"
cd ../..

# Kill any existing processes on ports
lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1
lsof -ti:3001 | xargs kill -9 > /dev/null 2>&1

npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for servers to start
echo -n "Waiting for servers to start"
for i in {1..10}; do
    echo -n "."
    sleep 1
    if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        break
    fi
done
echo ""

# Check if servers are running
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Servers started successfully${NC}"
else
    echo -e "${YELLOW}⚠ API might still be starting...${NC}"
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   ✅ Maintenance System V3 Started Successfully!           ║"
echo "║                                                            ║"
echo "║   📍 API Server:  http://localhost:3000                    ║"
echo "║   📍 API Docs:    http://localhost:3000/docs               ║"
echo "║   📍 Frontend:    http://localhost:3001                    ║"
echo "║   📍 Prisma:      npx prisma studio                        ║"
echo "║                                                            ║"
echo "║   👤 Default Admin Login:                                  ║"
echo "║      Email:    admin@maintenance.com                       ║"
echo "║      Password: Admin@123456                                ║"
echo "║                                                            ║"
echo "║   🛑 To stop: Press Ctrl+C or run: npm run stop            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Keep script running
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}Stopping servers...${NC}"; kill $SERVER_PID 2>/dev/null; echo -e "${GREEN}Servers stopped${NC}"; exit 0' INT

# Wait
wait $SERVER_PID
