#!/bin/bash

# Superio AI - Start All Services
# This script starts all agents and the API server

echo "🚀 Starting Superio AI Services..."
echo "=================================="

# Activate virtual environment
source venv/bin/activate

# Kill any existing processes on port 5001
echo "🧹 Cleaning up existing processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
sleep 1

# Create logs directory if it doesn't exist
mkdir -p logs

# Start all agents in the background
echo ""
echo "🤖 Starting Agents..."
echo "-----------------------------------"

echo "  ✓ Starting Coordinator Agent..."
python -m agents.coordinator_agent > logs/coordinator.log 2>&1 &
COORDINATOR_PID=$!
sleep 1

echo "  ✓ Starting DeFi Agent..."
python -m agents.defi_agent > logs/defi.log 2>&1 &
DEFI_PID=$!
sleep 1

echo "  ✓ Starting FGI Agent..."
python -m agents.fgi_agent > logs/fgi.log 2>&1 &
FGI_PID=$!
sleep 1

echo "  ✓ Starting Coin Agent..."
python -m agents.coin_agent > logs/coin.log 2>&1 &
COIN_PID=$!
sleep 1

echo "  ✓ Starting Trading Agent..."
python -m agents.trading_agent > logs/trading.log 2>&1 &
TRADING_PID=$!
sleep 1

# Start the Flask API server
echo ""
echo "🌐 Starting Flask API Server..."
echo "-----------------------------------"
python api/server.py > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

echo ""
echo "✅ All services started successfully!"
echo "=================================="
echo ""
echo "📋 Process IDs:"
echo "  Coordinator Agent: $COORDINATOR_PID"
echo "  DeFi Agent: $DEFI_PID"
echo "  FGI Agent: $FGI_PID"
echo "  Coin Agent: $COIN_PID"
echo "  Trading Agent: $TRADING_PID"
echo "  API Server: $SERVER_PID"
echo ""
echo "🔗 Server running at: http://localhost:5001"
echo "📁 Logs directory: ./logs/"
echo ""
echo "💡 To view logs:"
echo "  tail -f logs/server.log     # API Server"
echo "  tail -f logs/coordinator.log # Coordinator"
echo "  tail -f logs/defi.log        # DeFi Agent"
echo "  tail -f logs/fgi.log         # FGI Agent"
echo "  tail -f logs/coin.log        # Coin Agent"
echo "  tail -f logs/trading.log     # Trading Agent"
echo ""
echo "🛑 To stop all services:"
echo "  ./stop_all.sh"
echo ""
echo "Press Ctrl+C to view logs in real-time..."

# Follow the server log
tail -f logs/server.log
