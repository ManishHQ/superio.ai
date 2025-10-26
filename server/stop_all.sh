#!/bin/bash

# Superio AI - Stop All Services
# This script stops all agents and the API server

echo "🛑 Stopping Superio AI Services..."
echo "=================================="

# Kill Flask server on port 5001
echo "  Stopping Flask API Server..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Kill all Python processes related to agents
echo "  Stopping all agent processes..."
pkill -f "python -m agents.coordinator_agent" 2>/dev/null || true
pkill -f "python -m agents.defi_agent" 2>/dev/null || true
pkill -f "python -m agents.fgi_agent" 2>/dev/null || true
pkill -f "python -m agents.coin_agent" 2>/dev/null || true
pkill -f "python -m agents.trading_agent" 2>/dev/null || true

# Wait a moment
sleep 1

echo ""
echo "✅ All services stopped!"
echo "=================================="
