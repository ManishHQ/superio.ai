#!/bin/bash

# Start all agents and API server
# This script starts all components of the Superio AI backend

set -e

echo "🚀 Starting Superio AI Backend Services..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your API keys!"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Create logs directory
mkdir -p logs

echo "Starting agents..."
echo ""

# Start Coin Info Agent
echo "📊 Starting Coin Info Agent (Port ${COIN_AGENT_PORT:-8004})..."
python -m agents.coin_agent > logs/coin_agent.log 2>&1 &
COIN_PID=$!
echo "   PID: $COIN_PID"
sleep 2

# Start FGI Agent
echo "📈 Starting FGI Agent (Port ${FGI_AGENT_PORT:-8003})..."
python -m agents.fgi_agent > logs/fgi_agent.log 2>&1 &
FGI_PID=$!
echo "   PID: $FGI_PID"
sleep 2

# Start DeFi Agent
echo "💰 Starting DeFi Agent (Port ${DEFI_AGENT_PORT:-8001})..."
python -m agents.defi_agent > logs/defi_agent.log 2>&1 &
DEFI_PID=$!
echo "   PID: $DEFI_PID"
sleep 2

# Start Coordinator Agent
echo "🎯 Starting Coordinator Agent (Port ${COORDINATOR_PORT:-8000})..."
python -m agents.coordinator_agent > logs/coordinator_agent.log 2>&1 &
COORDINATOR_PID=$!
echo "   PID: $COORDINATOR_PID"
sleep 2

# Start Flask API Server
echo "🌐 Starting Flask API Server (Port ${FLASK_PORT:-5000})..."
python api/server.py > logs/api_server.log 2>&1 &
API_PID=$!
echo "   PID: $API_PID"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📋 Process IDs:"
echo "   Coin Agent:        $COIN_PID"
echo "   FGI Agent:         $FGI_PID"
echo "   DeFi Agent:        $DEFI_PID"
echo "   Coordinator Agent: $COORDINATOR_PID"
echo "   API Server:        $API_PID"
echo ""
echo "📝 Logs are available in the logs/ directory"
echo "🌐 API Server: http://localhost:${FLASK_PORT:-5000}"
echo ""
echo "To stop all services, run: ./scripts/stop_all.sh"

# Save PIDs to file for stop script
echo "$COIN_PID" > logs/coin_agent.pid
echo "$FGI_PID" > logs/fgi_agent.pid
echo "$DEFI_PID" > logs/defi_agent.pid
echo "$COORDINATOR_PID" > logs/coordinator_agent.pid
echo "$API_PID" > logs/api_server.pid
