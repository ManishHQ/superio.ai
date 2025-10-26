# Superio AI - Architecture Documentation

## System Overview

Superio AI is an AI-powered DeFi intelligence platform that combines multiple AI agents, blockchain integrations, and real-time data sources to provide intelligent DeFi interactions.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js Frontend]
        CHAT[Chat Interface]
        PROFILE[Profile Page]
        YIELD[Yield Graph]
        CHART[Chart Display]
    end

    subgraph "Backend API Layer"
        SERVER[Flask Server<br/>Port 5001]
        CHAT_HANDLER[Chat Handler<br/>AI Router]
        CHAT_HISTORY[Chat History DB<br/>MongoDB]
        SUMMARIZER[Chat Summarizer]
    end

    subgraph "AI Agents Layer"
        AI_AGENT[ASI1-Mini LLM<br/>Main Orchestrator]
        COORDINATOR_AGENT[Coordinator Agent<br/>Task Routing]
        SWAP_AGENT[Swap Agent<br/>swap intent detection]
        SEND_AGENT[Send Agent<br/>transaction parsing]
        TRADING_AGENT[Trading Agent<br/>chart analysis]
        BLOCKSCOUT_AGENT[Blockscout Agent<br/>on-chain data]
        DEFI_AGENT[DeFi Agent<br/>DeFi queries]
        COIN_AGENT[Coin Agent<br/>crypto info]
        FGI_AGENT[FGI Agent<br/>market sentiment]
    end

    subgraph "Tools Layer"
        DEFI_TOOLS[DeFi Tools<br/>CoinGecko, Fear & Greed]
        YIELD_TOOLS[Yield Tools<br/>DeFiLlama]
        ACTION_TOOLS[Action Tools<br/>swap, send, lookup]
        KNOWLEDGE_BASE[MeTTa Knowledge Base<br/>Graph DB]
    end

    subgraph "Smart Contracts"
        SWAP_CONTRACT[Swap Contract<br/>Sepolia]
        FET_TOKEN[FET Token Contract<br/>ERC-20]
    end

    subgraph "External Services"
        COINGECKO[CoinGecko API]
        DEFILLAMA[DeFiLlama API]
        CHART_IMG[Chart-IMG API]
        GEMINI[Gemini 2.5 Vision]
        BLOCKSCOUT_API[Blockscout MCP Server]
    end

    subgraph "Data Flow"
        USER[User Request]
        WALLET[Wallet Connection<br/>wagmi]
    end

    %% User to Frontend
    USER --> CHAT
    WALLET --> UI

    %% Frontend to Backend
    CHAT --> SERVER
    PROFILE --> SERVER
    YIELD --> SERVER
    
    %% Backend Processing
    SERVER --> CHAT_HANDLER
    CHAT_HANDLER --> AI_AGENT
    AI_AGENT --> COORDINATOR_AGENT
    COORDINATOR_AGENT --> SWAP_AGENT
    COORDINATOR_AGENT --> SEND_AGENT
    COORDINATOR_AGENT --> TRADING_AGENT
    COORDINATOR_AGENT --> BLOCKSCOUT_AGENT
    COORDINATOR_AGENT --> DEFI_AGENT
    COORDINATOR_AGENT --> COIN_AGENT
    COORDINATOR_AGENT --> FGI_AGENT
    
    %% AI Decision Making
    AI_AGENT --> ACTION_TOOLS
    AI_AGENT --> YIELD_TOOLS
    AI_AGENT --> DEFI_TOOLS
    
    %% Agent-Specific Processing
    SWAP_AGENT --> DEFI_TOOLS
    SWAP_AGENT --> SWAP_CONTRACT
    SEND_AGENT --> WALLET
    TRADING_AGENT --> CHART_IMG
    TRADING_AGENT --> GEMINI
    BLOCKSCOUT_AGENT --> BLOCKSCOUT_API
    DEFI_AGENT --> COINGECKO
    COIN_AGENT --> COINGECKO
    FGI_AGENT --> COINGECKO
    
    %% Tools to External APIs
    DEFI_TOOLS --> COINGECKO
    YIELD_TOOLS --> DEFILLAMA
    YIELD_TOOLS --> KNOWLEDGE_BASE
    
    %% Contract Interactions
    UI --> SWAP_CONTRACT
    SWAP_CONTRACT --> FET_TOKEN
    
    %% Chat History
    CHAT_HANDLER --> CHAT_HISTORY
    CHAT_HISTORY --> SUMMARIZER
    SUMMARIZER --> AI_AGENT
    
    %% Display
    CHAT_HANDLER --> CHAT
    CHAT_HANDLER --> CHART
    YIELD_TOOLS --> YIELD

    style UI fill:#00ff41,stroke:#333,stroke-width:2px
    style SERVER fill:#0080ff,stroke:#333,stroke-width:2px
    style AI_AGENT fill:#ff0080,stroke:#333,stroke-width:2px
    style SWAP_CONTRACT fill:#ffff00,stroke:#333,stroke-width:2px
```

## Agent Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant Server
    participant AI
    participant Agent
    participant Tools
    participant Contract
    participant External

    User->>Chat: "swap 0.001 eth to fet"
    Chat->>Server: POST /api/chat
    
    Server->>AI: Analyze intent with context
    AI->>AI: Function call decision
    AI->>Server: swap_token({
        from_token: "ETH",
        to_token: "FET",
        from_amount: 0.001
    })
    
    Server->>Agent: SwapAgent.parse()
    Agent->>Tools: Get exchange rate (ETH→FET)
    Tools->>External: CoinGecko API
    External-->>Tools: Rate: 1 ETH = 1000 FET
    Tools-->>Agent: Rate data
    
    Agent->>Agent: Calculate swap details
    Agent-->>Server: Swap UI data
    
    Server-->>Chat: Swap transaction ready
    Chat->>User: Display swap UI
    
    User->>Chat: Click "Swap" button
    Chat->>Contract: writeContract(swapETHforFET)
    Contract->>User: Wallet popup
    User->>Wallet: Sign transaction
    Wallet->>Contract: Execute swap
    Contract-->>Chat: Transaction hash
    Chat-->>User: Success confirmation
```

## Agent Details

### 1. Swap Agent
**Purpose**: Parse swap intents and generate swap UIs

**Input**: User message (e.g., "swap 0.001 eth to fet")
**Process**:
1. Detect swap keywords
2. Extract token pairs and amounts
3. Fetch real-time exchange rates
4. Calculate output amounts
5. Generate swap UI data

**Output**: Swap UI with transaction details

---

### 2. Send Agent
**Purpose**: Parse send/transfer intents

**Input**: User message (e.g., "send 0.1 eth to 0x...")
**Process**:
1. Detect send keywords
2. Extract recipient address
3. Extract amount
4. Generate send UI

**Output**: Send transaction UI

---

### 3. Trading Agent
**Purpose**: Analyze cryptocurrency charts

**Input**: Symbol, exchange, interval
**Process**:
1. Fetch chart image from Chart-IMG API
2. Analyze with Gemini 2.5 Vision
3. Generate BUY/SELL/HOLD recommendation
4. Provide technical analysis

**Output**: Chart image + analysis + recommendation

---

### 4. Blockscout Agent
**Purpose**: Query on-chain blockchain data

**Input**: Transaction hash or address
**Process**:
1. Query Blockscout MCP Server
2. Parse transaction/address data
3. Calculate reputation metrics
4. Generate on-chain analytics

**Output**: Transaction details or address analytics

---

### 5. Coordinator Agent
**Purpose**: Route tasks to appropriate specialized agents

**Input**: User intent classification
**Process**:
1. Analyze request type
2. Determine required data sources
3. Dispatch to appropriate agents
4. Aggregate responses
5. Return unified result

**Output**: Coordinated multi-agent response

---

### 6. DeFi Agent
**Purpose**: Handle DeFi-specific queries

**Input**: DeFi-related questions
**Process**:
1. Query DeFi data from CoinGecko
2. Analyze yield farming opportunities
3. Provide liquidity pool information
4. Calculate APY and risks

**Output**: DeFi analytics and recommendations

---

### 7. Coin Agent
**Purpose**: Provide cryptocurrency information

**Input**: Coin name or symbol
**Process**:
1. Fetch coin data from CoinGecko
2. Get price, market cap, volume
3. Analyze price trends
4. Provide market insights

**Output**: Cryptocurrency information and market data

---

### 8. FGI Agent (Fear & Greed Index)
**Purpose**: Analyze market sentiment

**Input**: General market queries
**Process**:
1. Fetch Fear & Greed Index
2. Calculate sentiment score
3. Correlate with market trends
4. Provide sentiment analysis

**Output**: Market sentiment indicators and analysis

---

## Data Flow Architecture

```mermaid
graph LR
    subgraph "User Request Flow"
        A[User Message] --> B[AI Intent Classification]
        B --> C{Intent Type}
        C -->|Swap| D[Swap Agent]
        C -->|Send| E[Send Agent]
        C -->|Chart| F[Trading Agent]
        C -->|On-chain| G[Blockscout Agent]
        C -->|DeFi| H1[DeFi Agent]
        C -->|Crypto Info| H2[Coin Agent]
        C -->|Sentiment| H3[FGI Agent]
        C -->|Yield| H[Yield Tools]
        C -->|General| I[Direct AI Response]
    end

    subgraph "Tool Execution"
        D --> J[Get Exchange Rate]
        J --> K[CoinGecko API]
        E --> L[Validate Address]
        F --> M[Chart-IMG API]
        F --> N[Gemini Vision]
        G --> O[Blockscout MCP]
        H1 --> K
        H2 --> K
        H3 --> AA1[Alternative.me API]
        H --> P[DeFiLlama API]
        H --> Q[MeTTa Knowledge Base]
    end

    subgraph "Response Generation"
        J --> R[Swap UI]
        L --> S[Send UI]
        M --> T[Chart Image]
        N --> U[Analysis Text]
        O --> V[Transaction Details]
        H1 --> BB1[DeFi Analytics]
        H2 --> BB2[Crypto Info]
        H3 --> BB3[Sentiment Score]
        P --> W[Yield Pools Graph]
        Q --> W
    end

    subgraph "Blockchain Execution"
        R --> X[Smart Contract Call]
        S --> Y[Direct Transfer]
        X --> Z[Wallet Signing]
        Y --> Z
        Z --> AA[On-chain Execution]
    end
```

## Smart Contract Architecture

```mermaid
classDiagram
    class FETToken {
        -ERC20 token
        -totalSupply: 10M
        +mint(to, amount)
        +transfer(to, amount)
        +balanceOf(address)
    }

    class SimpleSwap {
        -FETToken fetToken
        -EXCHANGE_RATE: 1000
        +swapETHforFET()
        +getFETAmount(ethAmount)
        +getFETBalance()
        +getETHBalance()
    }

    class User {
        +wallet: address
        +sendTransaction()
        +signMessage()
    }

    User --> SimpleSwap: calls swapETHforFET()
    SimpleSwap --> FETToken: transfers FET
    FETToken --> User: receives FET
```

## Knowledge Graph Architecture (MeTTa)

```mermaid
graph TB
    subgraph "Knowledge Base Creation"
        YIELD_DATA[DeFiLlama Yield Data]
        POOLS[Filter Safe Pools<br/>APY 7-15%, TVL >$1M]
        METTA_KB[MeTTa Knowledge Base]
    end

    subgraph "Graph Structure"
        NODES[Graph Nodes<br/>Pools, Tokens, Chains]
        EDGES[Graph Edges<br/>Relationships]
        PROPERTIES[Node Properties<br/>APY, TVL, Chain ID]
    end

    subgraph "Visualization"
        REACT_FORCE[react-force-graph-2d]
        NODE_COLORS[Color Coding<br/>Yellow: Pools<br/>Blue: Tokens<br/>Pink: Chains]
        INTERACTIVE[Click & Hover Events]
    end

    YIELD_DATA --> POOLS
    POOLS --> METTA_KB
    METTA_KB --> NODES
    METTA_KB --> EDGES
    METTA_KB --> PROPERTIES
    NODES --> REACT_FORCE
    EDGES --> REACT_FORCE
    REACT_FORCE --> NODE_COLORS
    REACT_FORCE --> INTERACTIVE
```

## Chat History & Context Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant Server
    participant MongoDB
    participant Summarizer
    participant AI

    User->>Chat: Send message
    Chat->>Server: POST /api/chat
    Server->>MongoDB: Save user message
    MongoDB-->>Server: Confirmed
    
    Server->>MongoDB: Get recent messages (limit: 5)
    MongoDB-->>Server: Chat history
    
    Server->>Summarizer: Create context string
    Summarizer-->>Server: Formatted context
    
    Server->>AI: Message + Context
    AI-->>Server: Response
    
    Server->>MongoDB: Save AI response
    Server->>Summarizer: Check if summary needed
    Summarizer->>MongoDB: Update summary (if needed)
    MongoDB-->>Server: Updated
    
    Server-->>Chat: Response data
    Chat-->>User: Display response
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React, Tailwind CSS
- **Blockchain**: wagmi, viem
- **Charts**: react-force-graph-2d
- **State**: React Hooks

### Backend
- **API Server**: Flask (Python)
- **AI**: ASI1-Mini LLM
- **Database**: MongoDB
- **Image Analysis**: Google Gemini 2.5
- **Blockchain**: Blockscout MCP Server

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Network**: Ethereum Sepolia
- **Libraries**: OpenZeppelin 5.0

### External APIs
- **Crypto Data**: CoinGecko
- **DeFi Data**: DeFiLlama
- **Charts**: Chart-IMG
- **Blockchain**: Blockscout

## API Endpoints

### Chat & Messaging
- `POST /api/chat` - Main chat endpoint
- `GET /api/chat/history?wallet_address=<addr>` - Get chat history
- `POST /api/chat/message` - Add message
- `PUT /api/chat/summary` - Update summary

### Data & Visualization
- `GET /api/yield/metta` - Get MeTTa knowledge graph
- `GET /api/chart/<filename>` - Serve chart images

### Health & Status
- `GET /api/health` - Health check
- `GET /api/asi-health` - ASI API status

## Security Features

1. **CSP (Content Security Policy)** - Restricts resource loading
2. **CORS Configuration** - Controlled cross-origin requests
3. **Input Validation** - All user inputs sanitized
4. **Reentrancy Protection** - Smart contract guard
5. **Rate Limiting** - API protection (ready for implementation)

## Deployment

- **Frontend**: Vercel (Automatic deployment)
- **Backend**: Heroku (Flask server)
- **Database**: MongoDB Atlas (Cloud)
- **Contracts**: Sepolia Testnet (Hardhat)

## Future Enhancements

1. **Multi-chain Support** - Add Polygon, Base, Arbitrum
2. **Advanced Trading** - Limit orders, stop-loss
3. **Portfolio Tracking** - Multi-wallet aggregation
4. **Social Features** - Share trades, leaderboards
5. **Mobile App** - React Native implementation
