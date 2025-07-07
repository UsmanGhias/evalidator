#!/bin/bash

# Stop Email Validation Service

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Email Validation Service...${NC}"

# Kill processes by port
for port in 5000 3000; do
    pid=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || echo "")
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}   Stopping service on port $port (PID: $pid)${NC}"
        kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
        sleep 1
    fi
done

echo -e "${GREEN}✅ Email Validation Service stopped${NC}"
