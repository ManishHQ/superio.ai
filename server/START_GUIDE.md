# Superio AI - Service Management Guide

## Quick Start

### Start All Services
```bash
./start_all.sh
```

This will start:
- ✅ Coordinator Agent (port 8000)
- ✅ DeFi Agent (port 8001)
- ✅ FGI Agent (port 8003)
- ✅ Coin Agent (port 8004)
- ✅ Trading Agent
- ✅ Flask API Server (port 5001)

### Stop All Services
```bash
./stop_all.sh
```

## Viewing Logs

All logs are stored in the `logs/` directory:

```bash
# View API Server logs
tail -f logs/server.log

# View Coordinator Agent logs
tail -f logs/coordinator.log

# View DeFi Agent logs
tail -f logs/defi.log

# View FGI Agent logs
tail -f logs/fgi.log

# View Coin Agent logs
tail -f logs/coin.log

# View Trading Agent logs
tail -f logs/trading.log

# View all logs at once
tail -f logs/*.log
```

## Service Information

### Agents
All agents run in the background and communicate via uAgents protocol.

- **Coordinator Agent**: Routes requests to specialized agents
- **DeFi Agent**: Handles DeFi data and analysis
- **FGI Agent**: Provides Fear & Greed Index data
- **Coin Agent**: Fetches cryptocurrency data from CoinGecko
- **Trading Agent**: Handles trading-related requests

### API Server
- **URL**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health
- **ASI Health Check**: http://localhost:5001/api/asi-health

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
```bash
# Stop all services first
./stop_all.sh

# Then start again
./start_all.sh
```

### Check Running Processes
```bash
# Check if server is running on port 5001
lsof -ti:5001

# Check Python agent processes
ps aux | grep "python -m agents"
```

### Manual Start (for debugging)
If you need to start services individually:

```bash
# Activate virtual environment
source venv/bin/activate

# Start an agent
python -m agents.coordinator_agent

# Start the API server
python api/server.py
```

## Development

### Adding a New Agent
1. Create the agent file in `agents/` directory
2. Add it to `start_all.sh`:
   ```bash
   echo "  ✓ Starting Your Agent..."
   python -m agents.your_agent > logs/your_agent.log 2>&1 &
   YOUR_AGENT_PID=$!
   sleep 1
   ```
3. Add it to `stop_all.sh`:
   ```bash
   pkill -f "python -m agents.your_agent" 2>/dev/null || true
   ```

### Log Rotation
Logs will grow over time. To clear them:
```bash
rm logs/*.log
```

Or set up log rotation with logrotate.
