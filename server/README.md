# Superio AI - DeFi Agent Backend

Multi-agent system for cryptocurrency and DeFi analysis using **uAgents** framework with **ASI1 Mini LLM** integration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│                  http://localhost:3000                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Flask API Server (Port 5000)                   │
│           REST API for Frontend Integration                │
└─────────────────────┬───────────────────────────────────────┘
                      │ Agent Protocol
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Coordinator Agent (Port 8000)                      │
│        Intent Classification & Request Routing             │
└────────┬────────────────────────────────────┬───────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐            ┌──────────────────────┐
│   DeFi Agent        │            │   Other Agents       │
│   (Port 8001)       │            │   (Future)           │
└────────┬────────────┘            └──────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│ Coin Agent  │  │  FGI Agent  │  │  ASI1 Mini   │
│ (Port 8004) │  │ (Port 8003) │  │     LLM      │
└─────────────┘  └─────────────┘  └──────────────┘
      │                │
      ▼                ▼
┌─────────────┐  ┌─────────────┐
│  CoinGecko  │  │  Fear &     │
│     API     │  │  Greed API  │
└─────────────┘  └─────────────┘
```

## 🤖 Agents

### 1. **Coordinator Agent** (Port 8000)
- **Role**: Routes requests to specialized agents based on intent
- **Capabilities**:
  - Intent classification (DeFi, Crypto, General)
  - Request routing and orchestration
  - Health monitoring
- **Communication**: Receives from Flask API, sends to DeFi Agent

### 2. **DeFi Agent** (Port 8001)
- **Role**: Main DeFi analysis coordinator
- **Capabilities**:
  - Orchestrates multi-agent requests
  - Integrates coin data + sentiment data
  - Uses ASI1 Mini for intelligent analysis
  - Provides SELL/HOLD/BUY recommendations
- **Communication**: Receives from Coordinator, sends to Coin & FGI agents

### 3. **Coin Info Agent** (Port 8004)
- **Role**: Fetches cryptocurrency data
- **Data Source**: CoinGecko API
- **Provides**:
  - Current price, market cap, volume
  - 24h price changes
  - Market cap rank
  - Last updated timestamp

### 4. **FGI Agent** (Port 8003)
- **Role**: Provides market sentiment data
- **Data Source**: Fear & Greed Index API (alternative.me)
- **Provides**:
  - Sentiment value (0-100)
  - Classification (Extreme Fear, Fear, Neutral, Greed, Extreme Greed)
  - Timestamp

## 📡 Message Flow Example

```
User Query: "Should I buy Bitcoin?"
     │
     ▼
Flask API (/api/chat)
     │
     ▼ CoordinatorRequest
Coordinator Agent
     │ (classifies as DEFI intent)
     ▼ DeFiAnalysisRequest
DeFi Agent
     ├──▶ CoinRequest ──▶ Coin Agent ──▶ CoinGecko API
     │         └──── CoinResponse ─────┘
     │
     └──▶ FGIRequest ──▶ FGI Agent ──▶ Fear & Greed API
               └──── FGIResponse ─────┘
     │
     ▼ (combines data)
ASI1 Mini LLM Analysis
     │
     ▼ DeFiAnalysisResponse
Coordinator Agent
     │
     ▼ CoordinatorResponse
Flask API
     │
     ▼ JSON Response
Frontend
```

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11+
- pip or pipenv
- API Keys:
  - ASI1 API Key (from asi1.ai)
  - (Optional) CoinMarketCap API Key

### Installation Steps

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

5. **Generate agent addresses**
   ```bash
   python scripts/setup_addresses.py
   ```
   This will generate agent addresses and optionally update your `.env` file.

6. **Edit .env file**
   Add your API keys:
   ```env
   ASI_API_KEY=your_asi_api_key_here
   ```

## 🎯 Running the System

### Option 1: Start All Services (Recommended)

```bash
./scripts/start_all.sh
```

This starts:
- Coin Info Agent (Port 8004)
- FGI Agent (Port 8003)
- DeFi Agent (Port 8001)
- Coordinator Agent (Port 8000)
- Flask API Server (Port 5000)

Logs are saved to `logs/` directory.

### Option 2: Start Services Individually

**Terminal 1 - Coin Agent:**
```bash
python -m agents.coin_agent
```

**Terminal 2 - FGI Agent:**
```bash
python -m agents.fgi_agent
```

**Terminal 3 - DeFi Agent:**
```bash
python -m agents.defi_agent
```

**Terminal 4 - Coordinator Agent:**
```bash
python -m agents.coordinator_agent
```

**Terminal 5 - Flask API:**
```bash
python api/server.py
```

### Stop All Services

```bash
./scripts/stop_all.sh
```

## 📚 API Endpoints

### Health & Info

- `GET /api/health` - Health check
- `GET /api/agents` - List all agents

### Chat & Analysis

- `POST /api/chat` - General chat (routes to coordinator)
  ```json
  {
    "message": "Should I buy Bitcoin?",
    "user_id": "user123"
  }
  ```

- `POST /api/defi/analyze` - Direct DeFi analysis
  ```json
  {
    "coin_id": "bitcoin",
    "query": "Analyze Bitcoin",
    "include_fgi": true
  }
  ```

### Cryptocurrency Data

- `GET /api/coin/<coin_id>` - Get coin data
  - Example: `/api/coin/bitcoin`

- `GET /api/trending` - Get trending coins

### Market Sentiment

- `GET /api/fgi` - Get Fear & Greed Index
  - Query params: `limit` (default: 1)

### DeFi Protocols

- `GET /api/protocols` - List top 50 DeFi protocols
- `GET /api/protocol/<protocol>` - Get specific protocol data
  - Example: `/api/protocol/aave`

## 🧪 Testing

### Test Individual Agents

**Test Coin Agent:**
```python
from uagents import Bureau
from agents.coin_agent import coin_agent

if __name__ == "__main__":
    bureau = Bureau()
    bureau.add(coin_agent)
    bureau.run()
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:5001/api/health

# Get Bitcoin data
curl http://localhost:5001/api/coin/bitcoin

# Get Fear & Greed Index
curl http://localhost:5001/api/fgi

# Analyze Bitcoin
curl -X POST http://localhost:5001/api/defi/analyze \
  -H "Content-Type: application/json" \
  -d '{"coin_id":"bitcoin","query":"Should I buy?","include_fgi":true}'
```

## 📁 Project Structure

```
server/
├── agents/                 # uAgent implementations
│   ├── coordinator_agent.py   # Main router
│   ├── defi_agent.py          # DeFi orchestrator
│   ├── coin_agent.py          # Coin data fetcher
│   └── fgi_agent.py           # Sentiment data fetcher
├── api/                    # HTTP API layer
│   └── server.py              # Flask application
├── models/                 # Pydantic message models
│   ├── messages.py            # All agent messages
│   └── __init__.py
├── tools/                  # External API integrations
│   ├── defi_tools.py          # CoinGecko, FGI, DeFiLlama, ASI1
│   └── __init__.py
├── scripts/                # Utility scripts
│   ├── start_all.sh           # Start all services
│   ├── stop_all.sh            # Stop all services
│   └── setup_addresses.py     # Generate agent addresses
├── config/                 # Configuration files
├── logs/                   # Log files (generated)
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ASI_API_KEY` | ASI1 API key for LLM | Required |
| `CMC_API_KEY` | CoinMarketCap API key | Optional |
| `COORDINATOR_PORT` | Coordinator agent port | 8000 |
| `DEFI_AGENT_PORT` | DeFi agent port | 8001 |
| `MEDICAL_AGENT_PORT` | Medical agent port | 8002 |
| `FGI_AGENT_PORT` | FGI agent port | 8003 |
| `COIN_AGENT_PORT` | Coin agent port | 8004 |
| `FLASK_PORT` | Flask API port | 5000 |
| `FLASK_DEBUG` | Enable Flask debug mode | False |

### Agent Addresses

Agent addresses are deterministic based on the seed phrase. Generate them using:

```bash
python scripts/setup_addresses.py
```

## 🌟 Features

### Agent-to-Agent Communication

Agents communicate using **uAgents** protocol with typed Pydantic messages:

```python
# Example: DeFi Agent requesting coin data
coin_request = CoinRequest(coin_id="bitcoin")
await ctx.send(COIN_AGENT_ADDRESS, coin_request)

# Coin Agent responds
coin_response = CoinResponse(
    coin_id="bitcoin",
    current_price=45000.50,
    ...
)
await ctx.send(sender, coin_response)
```

### ASI1 Mini Integration

The DeFi Agent uses ASI1 Mini for intelligent analysis:

```python
analysis = ASI1API.analyze_defi_data(
    api_key=asi_key,
    coin_data=coin_data,
    fgi_data=fgi_data,
    query="Should I buy Bitcoin?"
)
```

### Multi-Source Data Aggregation

DeFi Agent combines data from multiple sources:
1. **CoinGecko** - Price, market cap, volume
2. **Fear & Greed Index** - Market sentiment
3. **ASI1 Mini** - AI-powered analysis
4. **DeFiLlama** - Protocol TVL and data (future)

## 🔐 Security Notes

- Never commit `.env` file with real API keys
- Use environment variables for all sensitive data
- API keys are not included in agent messages
- CORS is configured for localhost only (update for production)

## 🐛 Troubleshooting

### Agents won't start
- Check if ports are available: `lsof -i :8000-8004`
- Verify `.env` file exists and has agent addresses
- Check logs in `logs/` directory

### "Module not found" errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### Agent communication fails
- Verify all agent addresses are set in `.env`
- Check agents are running on correct ports
- Review logs for error messages

### API requests fail
- Ensure Flask server is running on port 5000
- Check CORS settings if accessing from different origin
- Verify API keys are valid

## 📝 Development

### Adding New Agents

1. Create agent file in `agents/`
2. Define message models in `models/messages.py`
3. Add agent info to `.env.example`
4. Update `scripts/start_all.sh`
5. Document in README

### Adding New API Endpoints

1. Add route in `api/server.py`
2. Update API documentation
3. Test with curl or Postman

## 📖 Resources

- [uAgents Documentation](https://fetch.ai/docs/guides/agents)
- [ASI1 API Docs](https://docs.asi1.ai)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Fear & Greed Index](https://alternative.me/crypto/fear-and-greed-index/)
- [DeFiLlama API](https://defillama.com/docs/api)

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using uAgents, Flask, and ASI1 Mini**
