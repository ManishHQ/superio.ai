# System Architecture

## 🏛️ High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Port 3000)                   │  │
│  │  - Chat Interface  - Wallet Integration  - PWA Features    │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬───────────────────────────────┘
                                    │ HTTP/REST
                                    │
┌───────────────────────────────────▼───────────────────────────────┐
│                         API LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Flask API Server (Port 5000)                   │  │
│  │  - REST Endpoints  - CORS  - Request/Response Formatting   │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬───────────────────────────────┘
                                    │ uAgents Protocol
                                    │
┌───────────────────────────────────▼───────────────────────────────┐
│                      ORCHESTRATION LAYER                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           Coordinator Agent (Port 8000)                     │  │
│  │  - Intent Classification                                    │  │
│  │  - Request Routing                                          │  │
│  │  - Response Aggregation                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │ Agent-to-Agent Communication      │
                  │ (uAgents Protocol)                │
                  └─────────────────┬─────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────┐
│                      PROCESSING LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              DeFi Agent (Port 8001)                         │  │
│  │  - Multi-Agent Orchestration                                │  │
│  │  - Data Aggregation                                         │  │
│  │  - ASI1 Mini LLM Integration                                │  │
│  └───────────┬────────────────────────────────┬────────────────┘  │
│              │                                │                   │
│  ┌───────────▼───────────┐      ┌────────────▼───────────────┐  │
│  │   Coin Info Agent     │      │      FGI Agent             │  │
│  │    (Port 8004)        │      │     (Port 8003)            │  │
│  │  - CoinGecko API      │      │  - Fear & Greed Index      │  │
│  │  - Price Data         │      │  - Market Sentiment        │  │
│  └───────────────────────┘      └────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
┌─────────────────▼───────────┐      ┌────────────────▼──────────┐
│    EXTERNAL APIs            │      │    AI/ML LAYER            │
│  - CoinGecko                │      │  - ASI1 Mini LLM          │
│  - Alternative.me (FGI)     │      │  - Natural Language       │
│  - DeFiLlama                │      │  - Analysis & Insights    │
└─────────────────────────────┘      └───────────────────────────┘
```

## 🔄 Agent Communication Flow

### Scenario: User asks "Should I buy Bitcoin?"

```
┌─────────┐
│  USER   │ "Should I buy Bitcoin?"
└────┬────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ FRONTEND                                                   │
│ - User types message in chat                               │
│ - Sends POST to /api/chat                                  │
└────┬───────────────────────────────────────────────────────┘
     │ HTTP POST
     │ { "message": "Should I buy Bitcoin?" }
     ▼
┌────────────────────────────────────────────────────────────┐
│ FLASK API SERVER                                           │
│ - Receives HTTP request                                    │
│ - (Future: Converts to uAgent message)                     │
│ - For now: Directly calls DeFi tools                       │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ COORDINATOR AGENT                                          │
│ 1. Receives: CoordinatorRequest                            │
│    - query: "Should I buy Bitcoin?"                        │
│                                                            │
│ 2. Intent Classification:                                  │
│    - Analyzes keywords: "buy", "Bitcoin"                   │
│    - Classifies as: DEFI intent                            │
│    - Confidence: 0.9                                       │
│                                                            │
│ 3. Routing Decision:                                       │
│    - Target: DeFi Agent                                    │
│    - Extracts coin_id: "bitcoin"                           │
│                                                            │
│ 4. Sends: DeFiAnalysisRequest                              │
│    - coin_id: "bitcoin"                                    │
│    - query: "Should I buy Bitcoin?"                        │
│    - include_fgi: true                                     │
└────┬───────────────────────────────────────────────────────┘
     │ Agent Message
     │ (DeFiAnalysisRequest)
     ▼
┌────────────────────────────────────────────────────────────┐
│ DEFI AGENT                                                 │
│ 1. Receives: DeFiAnalysisRequest                           │
│                                                            │
│ 2. Orchestrates Sub-Requests:                              │
│    ┌──────────────────────┐    ┌─────────────────────┐   │
│    │ Sends to Coin Agent  │    │ Sends to FGI Agent  │   │
│    │ CoinRequest          │    │ FGIRequest          │   │
│    │ coin_id: "bitcoin"   │    │ limit: 1            │   │
│    └──────────────────────┘    └─────────────────────┘   │
│                                                            │
│ 3. Waits for Responses...                                  │
└────┬───────────────────────────────────┬───────────────────┘
     │                                   │
     │ CoinRequest                       │ FGIRequest
     ▼                                   ▼
┌──────────────────────┐        ┌──────────────────────────┐
│ COIN INFO AGENT      │        │ FGI AGENT                │
│ 1. Receives Request  │        │ 1. Receives Request      │
│                      │        │                          │
│ 2. Calls CoinGecko   │        │ 2. Calls Alternative.me  │
│    GET /coins/btc    │        │    GET /fng?limit=1      │
│                      │        │                          │
│ 3. Sends Response:   │        │ 3. Sends Response:       │
│    CoinResponse      │        │    FGIResponse           │
│    - price: 45250    │        │    - value: "65"         │
│    - 24h: -5.2%      │        │    - classification:     │
│    - mcap: 880B      │        │      "Greed"             │
└──────┬───────────────┘        └──────┬───────────────────┘
       │ CoinResponse                  │ FGIResponse
       │                               │
       └───────────┬───────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│ DEFI AGENT (continued)                                     │
│ 4. Receives Both Responses:                                │
│    - coin_data: {price: 45250, change: -5.2%}              │
│    - fgi_data: {value: 65, classification: "Greed"}        │
│                                                            │
│ 5. Constructs Prompt for ASI1 Mini:                        │
│    "Analyze this cryptocurrency data:                      │
│     Coin: Bitcoin (BTC)                                    │
│     Price: $45,250                                         │
│     24h Change: -5.2%                                      │
│     Market Cap: $880B                                      │
│     Market Sentiment: Greed (65)                           │
│     User Query: Should I buy Bitcoin?                      │
│     Provide recommendation: SELL, HOLD, or BUY"            │
│                                                            │
│ 6. Calls ASI1 Mini API:                                    │
│    POST https://api.asi1.ai/v1/chat/completions            │
│                                                            │
│ 7. Receives AI Analysis:                                   │
│    "Given the 5.2% drop and high greed sentiment,          │
│     the market may be overheated. Consider waiting         │
│     for a better entry point. HOLD."                       │
│                                                            │
│ 8. Sends: DeFiAnalysisResponse                             │
│    - analysis: [AI response]                               │
│    - recommendation: "HOLD"                                │
│    - coin_data: [full data]                                │
│    - fgi_data: [sentiment data]                            │
└────┬───────────────────────────────────────────────────────┘
     │ DeFiAnalysisResponse
     ▼
┌────────────────────────────────────────────────────────────┐
│ COORDINATOR AGENT                                          │
│ 1. Receives: DeFiAnalysisResponse                          │
│                                                            │
│ 2. Formats for User:                                       │
│    - Combines analysis text                                │
│    - Adds coin data summary                                │
│    - Highlights recommendation                             │
│                                                            │
│ 3. Sends: CoordinatorResponse                              │
│    - query: [original query]                               │
│    - intent: "DEFI"                                        │
│    - response: [formatted text]                            │
│    - confidence: 0.9                                       │
└────┬───────────────────────────────────────────────────────┘
     │ CoordinatorResponse
     ▼
┌────────────────────────────────────────────────────────────┐
│ FLASK API SERVER                                           │
│ - Receives agent response                                  │
│ - Converts to JSON                                         │
│ - Returns HTTP response                                    │
└────┬───────────────────────────────────────────────────────┘
     │ HTTP 200 OK
     │ {
     │   "analysis": "...",
     │   "recommendation": "HOLD",
     │   "coin_data": {...},
     │   "fgi_data": {...}
     │ }
     ▼
┌────────────────────────────────────────────────────────────┐
│ FRONTEND                                                   │
│ - Receives JSON response                                   │
│ - Displays in chat UI:                                     │
│   "💰 Bitcoin (BTC)                                        │
│    Price: $45,250                                          │
│    24h: -5.2%                                              │
│                                                            │
│    📊 Market Sentiment: Greed (65)                         │
│                                                            │
│    Analysis: Given the 5.2% drop and high greed            │
│    sentiment, the market may be overheated...              │
│                                                            │
│    ⚠️  Recommendation: HOLD"                                │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌─────────┐
│  USER   │ Sees recommendation
└─────────┘
```

## 📡 Message Protocol Details

### Message Types

```python
# Request Messages
CoordinatorRequest      # User query → Coordinator
DeFiAnalysisRequest    # Coordinator → DeFi Agent
CoinRequest            # DeFi Agent → Coin Agent
FGIRequest             # DeFi Agent → FGI Agent

# Response Messages
CoordinatorResponse    # Coordinator → API/User
DeFiAnalysisResponse   # DeFi Agent → Coordinator
CoinResponse           # Coin Agent → DeFi Agent
FGIResponse            # FGI Agent → DeFi Agent

# Control Messages
AgentHealthRequest     # Health check request
AgentHealthResponse    # Health status
ErrorMessage           # Error handling
```

### Message Format Example

```python
# CoinRequest
{
    "coin_id": "bitcoin"
}

# CoinResponse
{
    "coin_id": "bitcoin",
    "name": "Bitcoin",
    "symbol": "BTC",
    "current_price": 45250.50,
    "market_cap": 880000000000,
    "total_volume": 25000000000,
    "price_change_24h": -2500.0,
    "price_change_percentage_24h": -5.2,
    "market_cap_rank": 1,
    "last_updated": "2025-10-25T12:00:00Z"
}
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. API Layer (Flask)                                   │
│     - CORS validation                                   │
│     - Input sanitization                                │
│     - Rate limiting (future)                            │
│                                                         │
│  2. Agent Layer (uAgents)                               │
│     - Address-based authentication                      │
│     - Message signing                                   │
│     - Encrypted communication (future)                  │
│                                                         │
│  3. External API Layer                                  │
│     - API key management via env vars                   │
│     - Request timeouts                                  │
│     - Error handling                                    │
│                                                         │
│  4. Data Layer                                          │
│     - No persistent storage (stateless)                 │
│     - In-memory request tracking                        │
│     - PII handling (future)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📊 Scalability Considerations

### Current Design (Single Server)
- All agents run on one machine
- Direct agent-to-agent communication
- Suitable for development and small deployments

### Future Enhancements

**1. Distributed Agents**
```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Server 1  │    │  Server 2  │    │  Server 3  │
│ Coordinator│◄──►│ DeFi Agent │◄──►│ Data Agents│
└────────────┘    └────────────┘    └────────────┘
```

**2. Agent Discovery**
- Use Fetch.ai Almanac for agent discovery
- Dynamic agent registration
- Load balancing across multiple instances

**3. Message Queuing**
- Add message broker (RabbitMQ, Redis)
- Async message processing
- Request buffering

**4. Caching Layer**
- Redis for API response caching
- Reduce external API calls
- Improve response times

## 🧩 Component Responsibilities

| Component | Responsibilities | External Dependencies |
|-----------|-----------------|----------------------|
| **Frontend** | UI/UX, User input, Display | None |
| **Flask API** | HTTP interface, Request routing | Flask, CORS |
| **Coordinator** | Intent classification, Routing | uAgents |
| **DeFi Agent** | Orchestration, AI analysis | uAgents, ASI1 API |
| **Coin Agent** | Crypto price data | CoinGecko API |
| **FGI Agent** | Market sentiment | Alternative.me API |

## 🎯 Design Principles

1. **Modularity**: Each agent is independent
2. **Loose Coupling**: Agents communicate via messages
3. **Scalability**: Easy to add new agents
4. **Resilience**: Agents handle errors gracefully
5. **Extensibility**: Simple to add new features

---

**Architecture Version**: 1.0
**Last Updated**: 2025-10-25
