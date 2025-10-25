#!/bin/bash

# Stop all agents and API server

echo "🛑 Stopping Superio AI Backend Services..."
echo ""

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file=$2

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
        else
            echo "$name is not running"
            rm "$pid_file"
        fi
    else
        echo "No PID file found for $name"
    fi
}

# Stop all services
stop_service "Coin Agent" "logs/coin_agent.pid"
stop_service "FGI Agent" "logs/fgi_agent.pid"
stop_service "DeFi Agent" "logs/defi_agent.pid"
stop_service "Coordinator Agent" "logs/coordinator_agent.pid"
stop_service "API Server" "logs/api_server.pid"

echo ""
echo "✅ All services stopped"
