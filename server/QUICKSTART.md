# Quick Start Guide

Get the Superio AI DeFi Agent system running in 5 minutes!

## ⚡ Quick Setup

```bash
# 1. Navigate to server directory
cd server

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Setup environment
cp .env.example .env

# 5. Generate agent addresses
python scripts/setup_addresses.py
# Choose 'y' to update .env automatically

# 6. Add your ASI API key to .env
# Edit .env and add: ASI_API_KEY=your_key_here

# 7. Start all services
./scripts/start_all.sh
```

## 🎯 Test It Works

### Check API Health
```bash
curl http://localhost:5001/api/health
```

### Get Bitcoin Price
```bash
curl http://localhost:5001/api/coin/bitcoin | jq
```

### Get Market Sentiment
```bash
curl http://localhost:5001/api/fgi | jq
```

### Analyze Bitcoin
```bash
curl -X POST http://localhost:5001/api/defi/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "coin_id": "bitcoin",
    "query": "Should I buy Bitcoin?",
    "include_fgi": true
  }' | jq
```

### Get Trending Coins
```bash
curl http://localhost:5001/api/trending | jq
```

## 🔍 View Logs

```bash
# All logs
tail -f logs/*.log

# Specific agent
tail -f logs/defi_agent.log
tail -f logs/coordinator_agent.log
tail -f logs/api_server.log
```

## 🛑 Stop Services

```bash
./scripts/stop_all.sh
```

## 📱 Connect Frontend

Update your Next.js frontend to use the API:

```typescript
// In your frontend code
const API_URL = 'http://localhost:5001';

// Analyze crypto
const response = await fetch(`${API_URL}/api/defi/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coin_id: 'bitcoin',
    query: 'Should I buy?',
    include_fgi: true
  })
});

const data = await response.json();
console.log(data.analysis);
console.log(data.recommendation); // SELL, HOLD, or BUY
```

## 🎓 Example Queries

### DeFi Analysis

```bash
# Ethereum analysis
curl -X POST http://localhost:5001/api/defi/analyze \
  -H "Content-Type: application/json" \
  -d '{"coin_id":"ethereum","query":"Analyze ETH","include_fgi":true}'

# Solana analysis
curl -X POST http://localhost:5001/api/defi/analyze \
  -H "Content-Type: application/json" \
  -d '{"coin_id":"solana","query":"Is SOL a good investment?","include_fgi":true}'

# Cardano analysis
curl -X POST http://localhost:5001/api/defi/analyze \
  -H "Content-Type: application/json" \
  -d '{"coin_id":"cardano","query":"What about ADA?","include_fgi":true}'
```

### Coin Data

```bash
# Bitcoin
curl http://localhost:5001/api/coin/bitcoin

# Ethereum
curl http://localhost:5001/api/coin/ethereum

# Cardano
curl http://localhost:5001/api/coin/cardano

# Solana
curl http://localhost:5001/api/coin/solana
```

### DeFi Protocols

```bash
# Top protocols by TVL
curl http://localhost:5001/api/protocols | jq '.protocols[:10]'

# Specific protocol
curl http://localhost:5001/api/protocol/aave
curl http://localhost:5001/api/protocol/uniswap
curl http://localhost:5001/api/protocol/curve
```

## 🔑 Supported Coins

The system supports any coin available on CoinGecko. Common IDs:

| Name | CoinGecko ID |
|------|--------------|
| Bitcoin | `bitcoin` |
| Ethereum | `ethereum` |
| Cardano | `cardano` |
| Solana | `solana` |
| Ripple | `ripple` |
| Dogecoin | `dogecoin` |
| Polkadot | `polkadot` |
| Avalanche | `avalanche` |
| Polygon | `matic-network` |
| Chainlink | `chainlink` |

Full list: https://api.coingecko.com/api/v3/coins/list

## 🐛 Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :5000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Missing Dependencies
```bash
# Reinstall
pip install -r requirements.txt --force-reinstall
```

### Agent Address Errors
```bash
# Regenerate addresses
python scripts/setup_addresses.py
```

## 📊 Monitoring

Check agent status:
```bash
# List running agents
ps aux | grep python

# Check specific ports
lsof -i :5000  # API Server
lsof -i :8000  # Coordinator
lsof -i :8001  # DeFi Agent
lsof -i :8003  # FGI Agent
lsof -i :8004  # Coin Agent
```

## 🎉 Next Steps

1. ✅ Test all API endpoints
2. ✅ Connect your frontend
3. ✅ Add your ASI1 API key for better analysis
4. ✅ Explore the multi-agent communication
5. ✅ Build your DeFi application!

---

Need help? Check the full [README.md](./README.md) for detailed documentation.
