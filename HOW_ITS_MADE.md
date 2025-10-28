# How Superio AI is Made - Technical Deep Dive

## Overview
Superio AI is built as a full-stack, AI-powered platform that bridges conversational interfaces with blockchain execution. This document explains the technical architecture, data flows, and implementation details.

---

## 1. System Architecture

### High-Level Flow
```
User Input → Frontend (Next.js) → Backend (Flask) → AI Agents → Tools/APIs → Response → Frontend Display
```

### Component Layers

#### **Layer 1: Frontend (Next.js 14)**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: React 18 components with Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)
- **Blockchain**: wagmi (Hooks) + viem (Utilities)
- **Wallet Integration**: RainbowKit
- **Deployment**: Vercel

#### **Layer 2: Backend API (Flask)**
- **Framework**: Flask (Python)
- **Database**: MongoDB (via PyMongo)
- **AI Integration**: OpenAI-compatible ASI1-Mini
- **Deployment**: Heroku

#### **Layer 3: AI Agents (Python)**
- **Framework**: Custom Python modules
- **Agents**: Coordinator, Swap, Trading, Blockscout, DeFi, Coin, FGI
- **Communication**: Function calls (not distributed yet)

#### **Layer 4: External Services**
- **Chart-IMG API**: TradingView chart images
- **Google Gemini**: Vision analysis
- **Blockscout MCP**: On-chain data
- **CoinGecko**: Market data

---

## 2. Detailed Component Breakdown

### 2.1 Frontend Architecture

#### **Chat Interface (`components/chat/chat-interface.tsx`)**

**Purpose**: Main conversational UI

**How it works:**
```typescript
1. User types message → triggers onSendMessage
2. Message added to local state
3. POST to /api/chat with message + wallet address
4. Display response with:
   - Text content
   - Chart images (if tool.chart_url exists)
   - Swap UI (if swap_ui exists)
   - Tools used metadata
5. Save to local state and chat history
```

**Key Features:**
- Auto-scrolling to latest message
- Loading indicators
- Wallet address as user_id
- Chat history persistence

#### **Message Component (`components/chat/message.tsx`)**

**Purpose**: Render individual chat messages

**Rendering Order:**
1. Chart images (if `tool.chart_url` present)
2. Markdown content
3. Swap/Send UI components
4. Yield pools (if present)
5. MeTTa knowledge graph (if present)
6. Tools used section

**Special Handling:**
- Chart images displayed prominently at top
- Recommendation badges (BUY/SELL/HOLD)
- Error handling for failed image loads

#### **Wallet Integration (`wagmi` + `RainbowKit`)**

**Setup:**
```typescript
// providers.tsx
config = getDefaultConfig({
  chains: [sepolia, mainnet, ...],
  projectId: "your_walletconnect_id"
})

// Usage
const { address, isConnected } = useAccount()
const { writeContract } = useWriteContract()
```

**How it works:**
1. User clicks "Connect Wallet"
2. RainbowKit shows wallet options
3. User approves connection
4. `address` becomes available globally
5. Used as `user_id` for chat history

---

### 2.2 Backend Architecture

#### **Flask Server (`server/api/server.py`)**

**Main Endpoints:**

```
POST /api/chat              - Main chat handler
GET  /api/chat/history      - Get chat history by wallet
GET  /api/yield/metta       - MeTTa knowledge graph
GET  /api/chart/<filename>  - Serve chart images
GET  /api/health            - Health check
```

**Chat Handler Flow:**

```python
@app.route('/api/chat', methods=['POST'])
def chat():
    # 1. Extract message and user_id from request
    message = data['message']
    user_id = data.get('user_id', 'anonymous')
    
    # 2. Load recent chat history for context
    recent_messages = db.get_recent_messages(user_id, limit=5)
    context = ChatSummarizer.create_context_string(recent_messages)
    
    # 3. Save user message to database
    db.add_message(user_id, 'user', message)
    
    # 4. Call chat handler with AI
    result = handle_chat_request(message, user_id, client, asi_key, context)
    
    # 5. Save AI response to database
    db.add_message(user_id, 'assistant', result['response'])
    
    # 6. Return JSON response
    return jsonify(result)
```

#### **AI Chat Handler (`server/api/chat_handler_new.py`)**

**How it works:**

1. **Intent Classification**
   ```python
   response = client.chat.completions.create(
       messages=[
           {"role": "system", "content": system_prompt},
           {"role": "user", "content": user_message}
       ],
       model="asi1-mini",
       tools=all_tools,  # Function definitions
       tool_choice="auto"  # Let AI decide
   )
   ```

2. **Function Calling**
   - AI decides which tool to use based on intent
   - Returns `tool_calls` with function name and arguments
   - Example: `analyze_chart({"symbol": "ETH"})`

3. **Tool Execution**
   ```python
   if function_name == "analyze_chart":
       # Initialize trading agent
       trading_agent = TradingAgent()
       
       # Fetch chart and analyze
       chart_result = trading_agent.analyze_symbol(symbol)
       
       # Convert local path to URL
       filename = os.path.basename(chart_result["chart_url"])
       api_url = os.getenv("API_URL")
       chart_url = f"{api_url}/api/chart/{filename}"
       
       # Return response
       return {
           "response": analysis_text,
           "tools_used": [{"chart_url": chart_url, ...}]
       }
   ```

4. **Response Construction**
   - Format response with markdown
   - Add chart URLs, recommendations
   - Include metadata in `tools_used`

---

### 2.3 AI Agents System

#### **Trading Agent (`server/agents/trading_agent.py`)**

**Purpose**: Chart analysis with Gemini Vision

**Process:**
```python
def analyze_symbol(symbol, interval, exchange):
    # Step 1: Get chart image
    chart_path = ChartAnalyzer.get_chart_image(
        symbol=symbol,
        interval=interval,
        api_key=chart_api_key
    )
    
    # Step 2: Analyze with Gemini Vision
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content([
        analysis_prompt,
        PIL.Image.open(chart_path)  # Image input
    ])
    
    # Step 3: Extract recommendation
    if "BUY" in analysis.upper():
        recommendation = "BUY"
    elif "SELL" in analysis.upper():
        recommendation = "SELL"
    else:
        recommendation = "HOLD"
    
    return {
        "chart_url": chart_path,
        "analysis": response.text,
        "recommendation": recommendation
    }
```

#### **Chart Tools (`server/tools/chart_tools.py`)**

**Chart Fetching:**
```python
def get_chart_image(symbol, interval, api_key):
    # Build Chart-IMG API request
    url = "https://api.chart-img.com/v2/tradingview/advanced-chart"
    payload = {
        "symbol": f"BINANCE:{symbol}USDT",
        "interval": interval,
        "width": 800,
        "height": 600
    }
    
    response = requests.post(url, json=payload, headers={
        "x-api-key": api_key
    })
    
    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    temp_file.write(response.content)
    temp_file.close()
    
    return temp_file.name  # Returns local file path
```

#### **Blockscout Agent (`server/agents/blockscout_agent.py`)**

**Purpose**: On-chain blockchain data

**How it works:**
```python
class BlockscoutAgent:
    def get_transaction_info(self, chain_id, tx_hash):
        # Call Blockscout MCP Server
        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "get_transaction_info",
                "arguments": {
                    "chain_id": chain_id,
                    "transaction_hash": tx_hash
                }
            }
        }
        
        response = httpx.post(
            "https://mcp.blockscout.com/mcp",
            json=payload
        )
        
        return response.json()["result"]
```

**Reputation Calculation:**
```python
def calculate_reputation(address_data):
    score = 0
    factors = []
    
    if balance > 0:
        score += 10
        factors.append("💰 Has ETH balance")
    
    if tx_count > 10:
        score += 20
        factors.append("🔹 Active trader")
    
    # ... more factors
    
    if score >= 80:
        tier = "🏆 Elite"
    elif score >= 60:
        tier = "🌟 Veteran"
    # ...
    
    return {"tier": tier, "score": score, "factors": factors}
```

---

### 2.4 Data Flow Examples

#### **Example 1: Chart Analysis Request**

```
User: "analyze ETH chart"
  ↓
Frontend POST /api/chat {"message": "analyze ETH chart", "user_id": "0x..."}
  ↓
Backend receives in chat handler
  ↓
AI decides to call analyze_chart tool
  ↓
Trading Agent:
  1. Calls Chart-IMG API → gets PNG image
  2. Saves to temp file
  3. Loads image, sends to Gemini Vision
  4. Gemini analyzes chart, returns text
  5. Extracts recommendation
  ↓
Backend converts local path to URL:
  /tmp/chart_abc123.png → https://...herokuapp.com/api/chart/abc123.png
  ↓
Response returned:
  {
    "response": "Chart analysis...",
    "tools_used": [{"chart_url": "https://.../api/chart/abc123.png"}]
  }
  ↓
Frontend receives, displays:
  - Chart image from URL
  - Analysis text
  - BUY/SELL/HOLD recommendation
```

#### **Example 2: Token Swap Request**

```
User: "swap 0.001 eth to fet"
  ↓
AI calls swap_token tool:
  {
    "from_token": "ETH",
    "to_token": "FET",
    "from_amount": 0.001
  }
  ↓
Swap Agent:
  1. Fetches exchange rate from CoinGecko
  2. Calculates output amount
  3. Generates swap UI data
  ↓
Response:
  {
    "response": "Swap prepared...",
    "tools_used": [...],
    "swap_ui": {
      "from_token": "ETH",
      "from_amount": 0.001,
      "to_token": "FET",
      "to_amount": 1000,
      "rate": 1000,
      "contract_address": "0x..."
    }
  }
  ↓
Frontend renders SwapTransaction component
  ↓
User clicks "Swap" button
  ↓
wagmi writes contract:
  writeContract({
    address: "0x...",
    abi: swapABI,
    functionName: "swapETHforFET",
    value: parseEther("0.001")
  })
  ↓
MetaMask popup appears, user signs
  ↓
Transaction submitted to blockchain
```

#### **Example 3: Transaction Lookup**

```
User: "explain 0xabc123..."
  ↓
AI calls lookup_transaction tool
  ↓
Blockscout Agent:
  1. Queries Blockscout MCP Server
  2. Gets transaction details
  3. Gets human-readable summary
  4. Calculates gas analysis
  ↓
Response includes:
  - Transaction hash
  - From/To addresses
  - Value in ETH
  - Gas cost analysis
  - Token transfers
  - Contextual insights
  ↓
Frontend displays formatted transaction details
```

---

### 2.5 Database Schema

#### **Chat History Collection**

```json
{
  "_id": ObjectId("..."),
  "wallet_address": "0x6d07F6a8CdB8782B835Df12b1eF8339Ab1129129",
  "summary": "User discussed ETH trading and swaps",
  "messages": [
    {
      "role": "user",
      "content": "analyze ETH chart",
      "timestamp": ISODate("2024-12-26T21:35:00Z"),
      "metadata": null
    },
    {
      "role": "assistant",
      "content": "📊 Chart Analysis...",
      "timestamp": ISODate("2024-12-26T21:35:05Z"),
      "metadata": {
        "tools_used": [
          {
            "name": "analyze_chart",
            "chart_url": "https://...herokuapp.com/api/chart/eth_chart.png",
            "recommendation": "BUY"
          }
        ]
      }
    }
  ],
  "created_at": ISODate("2024-12-26T21:30:00Z"),
  "updated_at": ISODate("2024-12-26T21:35:05Z")
}
```

---

### 2.6 Chart Image Serving

#### **Flask Endpoint**

```python
@app.route('/api/chart/<path:filename>')
def serve_chart(filename):
    # Look for chart in demo_charts directory
    chart_path = os.path.join(
        os.path.dirname(__file__),
        "..", "demo_charts", filename
    )
    
    # Also check temp directory
    if not os.path.exists(chart_path):
        chart_path = os.path.join("/tmp", filename)
    
    if os.path.exists(chart_path):
        return send_file(chart_path, mimetype='image/png')
    else:
        return "Chart not found", 404
```

#### **URL Generation**

```python
# In chart_tools.py
filename = os.path.basename(chart_path)  # "eth_chart.png"
api_url = os.getenv("API_URL", "https://superio-c0e1ce720dee.herokuapp.com")
chart_url = f"{api_url}/api/chart/{filename}"

# Result: "https://superio-c0e1ce720dee.herokuapp.com/api/chart/eth_chart.png"
```

---

### 2.7 Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

**Backend (.env):**
```
ASI_API_KEY=your_key
MONGODBURI=mongodb://...
CHART_IMG_API_KEY=your_key
GOOGLE_API_KEY=your_key
API_URL=https://superio-c0e1ce720dee.herokuapp.com
```

---

### 2.8 Deployment

#### **Backend (Heroku)**

```bash
# Heroku deployment
git push heroku main

# Environment variables set in Heroku dashboard
heroku config:set ASI_API_KEY=...
heroku config:set MONGODBURI=...
```

**Procfile:**
```
web: python api/server.py
```

#### **Frontend (Vercel)**

```bash
# Auto-deploys on git push
vercel --prod

# Environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://superio-c0e1ce720dee.herokuapp.com
```

---

## 3. Key Design Decisions

### Why Flask + Next.js?
- **Flask**: Flexible Python backend, easy AI integration
- **Next.js**: Fast React development, good performance, easy deployment

### Why Function Calling Instead of uAgents?
- Function calling is faster for single-server deployment
- Easier debugging and testing
- Can evolve to distributed agents later

### Why Separate Chart and Analysis?
- Chart fetching can fail independently
- Allows caching of chart images
- More flexible for demo vs. production modes

---

## 4. Testing the System

### Local Development

```bash
# Terminal 1: Backend
cd server
source venv/bin/activate
python api/server.py  # Runs on http://localhost:5001

# Terminal 2: Frontend
npm run dev  # Runs on http://localhost:3000
```

### Testing Flow
1. Open http://localhost:3000
2. Connect wallet
3. Send message: "analyze ETH chart"
4. Verify chart loads in chat
5. Check backend logs for processing

---

## 5. Future Improvements

### Current Limitations
- All agents run on single server
- Chart images stored in temp files
- No real-time updates
- Limited multi-chain support

### Planned Enhancements
- Deploy agents to Agentverse
- Use cloud storage for charts (S3)
- WebSocket for real-time updates
- Add more blockchains

---

**This is how Superio AI is built! A seamless combination of AI, blockchain, and modern web technologies.**

