"""
Flask API Server - HTTP interface for frontend
Bridges HTTP requests to uAgents communication
"""
import os
import sys
import asyncio
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from server directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])

# Store agent clients (will be initialized)
agent_clients = {}

# Store pending requests for async agent communication
pending_responses = {}


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Superio AI API Server",
        "version": "1.0.0"
    }), 200


@app.route('/api/asi-health', methods=['GET'])
def asi_health_check():
    """
    ASI API health check endpoint
    Tests if ASI API key is loaded and LLM is working
    """
    try:
        print(f"\n{'='*60}")
        print(f"🏥 ASI HEALTH CHECK")
        print(f"{'='*60}")

        # Check if API key is loaded
        asi_key = os.getenv("ASI_API_KEY")
        key_loaded = bool(asi_key and asi_key != "your_asi_api_key_here")

        print(f"🔑 ASI API Key Loaded: {key_loaded}")
        if key_loaded:
            print(f"🔑 Key prefix: {asi_key[:10]}...")

        if not key_loaded:
            print(f"❌ ASI API key not configured")
            return jsonify({
                "status": "error",
                "asi_api_key_loaded": False,
                "asi_api_working": False,
                "error": "ASI_API_KEY not found in environment variables"
            }), 500

        # Test LLM with a simple request
        from tools.defi_tools import ASI1API

        print(f"🤖 Testing ASI1 Mini LLM...")
        test_response = ASI1API.analyze_defi_data(
            api_key=asi_key,
            coin_data={
                "name": "Bitcoin",
                "symbol": "BTC",
                "current_price": 50000,
                "price_change_percentage_24h": 2.5,
                "market_cap": 1000000000000,
                "total_volume": 50000000000
            },
            fgi_data=None,
            query="Test query"
        )

        if test_response:
            print(f"✅ ASI1 Mini responded successfully")
            print(f"📝 Response length: {len(test_response)} characters")
            print(f"📝 Response preview: {test_response[:100]}...")

            return jsonify({
                "status": "healthy",
                "asi_api_key_loaded": True,
                "asi_api_working": True,
                "test_response_length": len(test_response),
                "test_response_preview": test_response[:100] + "..." if len(test_response) > 100 else test_response,
                "message": "ASI1 Mini is working correctly"
            }), 200
        else:
            print(f"❌ ASI1 Mini did not respond")
            return jsonify({
                "status": "error",
                "asi_api_key_loaded": True,
                "asi_api_working": False,
                "error": "ASI1 Mini did not respond to test query"
            }), 500

    except Exception as e:
        print(f"❌ Error testing ASI API: {e}")
        import traceback
        traceback.print_exc()

        return jsonify({
            "status": "error",
            "asi_api_key_loaded": key_loaded if 'key_loaded' in locals() else False,
            "asi_api_working": False,
            "error": str(e)
        }), 500


@app.route('/api/agents', methods=['GET'])
def list_agents():
    """List available agents"""
    agents = [
        {
            "name": "coordinator_agent",
            "description": "Routes requests to specialized agents",
            "port": int(os.getenv("COORDINATOR_PORT", 8000)),
            "status": "active"
        },
        {
            "name": "defi_agent",
            "description": "DeFi analysis with ASI1 Mini",
            "port": int(os.getenv("DEFI_AGENT_PORT", 8001)),
            "status": "active"
        },
        {
            "name": "fgi_agent",
            "description": "Fear & Greed Index sentiment data",
            "port": int(os.getenv("FGI_AGENT_PORT", 8003)),
            "status": "active"
        },
        {
            "name": "coin_agent",
            "description": "Cryptocurrency data from CoinGecko",
            "port": int(os.getenv("COIN_AGENT_PORT", 8004)),
            "status": "active"
        }
    ]

    return jsonify({"agents": agents}), 200


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    General chat endpoint - AI-powered intent classification with proper routing
    """
    try:
        data = request.get_json()
        print(f"\n{'='*50}")
        print(f"NEW CHAT REQUEST: {data}")
        print(f"{'='*50}")

        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' field"}), 400

        message = data['message']
        user_id = data.get('user_id', 'anonymous')
        print(f"Message: {message}")
        print(f"User ID: {user_id}")

        # Import tools
        from tools.defi_tools import CoinGeckoAPI, FearGreedIndexAPI, extract_recommendation, ASI1API
        from tools.yield_tools import DeFiLlamaYields, YieldAnalyzer, YIELD_TOOLS
        from agents.swap_agent import SwapParser
        from agents.send_agent import SendParser
        from openai import OpenAI
        import json

        # Get ASI API key
        asi_key = os.getenv("ASI_API_KEY")
        print(f"ASI API Key present: {bool(asi_key and asi_key != 'your_asi_api_key_here')}")

        if not asi_key or asi_key == "your_asi_api_key_here":
            return jsonify({"error": "ASI API key not configured"}), 500

        # Initialize OpenAI client
        client = OpenAI(
            api_key=asi_key,
            base_url="https://api.asi1.ai/v1"
        )

        # Define available tools/actions for the AI
        AVAILABLE_TOOLS = [
            {
                "type": "function",
                "function": {
                    "name": "send_token",
                    "description": "Send cryptocurrency tokens to a wallet address. Use this when user wants to transfer/send/pay tokens.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "amount": {"type": "number", "description": "Amount to send"},
                            "token": {"type": "string", "description": "Token symbol (ETH, SOL, USDC, etc.)"},
                            "to_address": {"type": "string", "description": "Recipient wallet address"}
                        },
                        "required": ["amount", "token", "to_address"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "swap_token",
                    "description": "Swap/exchange one cryptocurrency for another. Use this when user wants to swap/trade/convert tokens.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "from_amount": {"type": "number", "description": "Amount to swap"},
                            "from_token": {"type": "string", "description": "Token to swap from"},
                            "to_token": {"type": "string", "description": "Token to receive"}
                        },
                        "required": ["from_amount", "from_token", "to_token"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_crypto_info",
                    "description": "Get cryptocurrency market data, prices, and analysis. Use for questions about crypto prices, market cap, trading advice.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "coin": {"type": "string", "description": "Cryptocurrency name or symbol"},
                            "include_sentiment": {"type": "boolean", "description": "Include Fear & Greed Index"}
                        },
                        "required": ["coin"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "explain_transaction",
                    "description": "Explain how blockchain transactions work, gas fees, confirmations, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "topic": {"type": "string", "description": "Transaction topic to explain"}
                        },
                        "required": ["topic"]
                    }
                }
            }
        ]

        # STEP 1: Let AI decide which tool/action to use
        print(f"🤖 AI analyzing user request and selecting appropriate tools...")

        try:
            system_prompt = """You are Superio, an advanced onchain intelligence AI assistant. You help users with cryptocurrency operations, market analysis, and blockchain education.

Available capabilities:
- Send tokens to addresses
- Swap/exchange tokens
- Get cryptocurrency market data and analysis
- Explain blockchain transactions and concepts
- General conversation

When the user wants to perform an action (send, swap, etc.), call the appropriate function. For general questions, respond directly without calling functions."""

            initial_response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="asi1-mini",
                tools=AVAILABLE_TOOLS + YIELD_TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=600
            )

            response_message = initial_response.choices[0].message
            tools_used = []

            # Check if AI wants to call a tool
            if response_message.tool_calls:
                tool_call = response_message.tool_calls[0]
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                print(f"🔧 AI selected tool: {function_name} with args: {function_args}")

                # Route to appropriate handler based on tool
                if function_name == "send_token":
            print(f"💸 Handling as SEND query...")

            # Parse send request using SendParser
            send_data = SendParser.parse_send_request(message)
            if send_data:
                print(f"✅ Send parsed: {send_data['amount']} {send_data['token']} to {send_data['to_address'][:10]}...")
                send_response = SendParser.generate_send_response(send_data)
                return jsonify(send_response), 200
            else:
                # Couldn't parse send details, provide general guidance
                print(f"⚠️ Could not parse send details")
                response_text = """I'd be happy to help you send tokens! To perform a send transaction, please specify:

- **Amount**: How much you want to send (e.g., 0.01, 5, 100)
- **Token**: What token to send (e.g., ETH, SOL, USDC)
- **Address**: The recipient's wallet address

Example: "send 0.01 eth to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

**Supported tokens:** SOL, USDC, USDT, ETH, BTC, BONK, WIF, JUP, DAI, MATIC, AVAX, LINK

Would you like to try again with specific details?"""

                return jsonify({"response": response_text}), 200

        elif intent == "SWAP":
            print(f"🔄 Handling as SWAP query...")
            
            # Parse swap request using SwapParser
            swap_data = SwapParser.parse_swap_request(message)
            if swap_data:
                print(f"✅ Swap parsed: {swap_data['from_amount']} {swap_data['from_token']} -> {swap_data['to_token']}")
                swap_response = SwapParser.generate_swap_response(swap_data)
                return jsonify(swap_response), 200
            else:
                # Couldn't parse swap details, provide general guidance
                print(f"⚠️ Could not parse swap details")
                response_text = """I'd be happy to help you swap tokens! To perform a swap, please specify:
                
- **From token**: What you want to swap (e.g., SOL, ETH, USDC)
- **To token**: What you want to receive (e.g., USDC, USDT)
- **Amount**: How much you want to swap

Example: "swap 5 sol for usdc"

**Supported tokens:** SOL, USDC, USDT, ETH, BTC, BONK, WIF, JUP

Would you like to try again with specific details?"""
                
                return jsonify({"response": response_text}), 200
                
        elif intent == "CRYPTO":
            print(f"💰 Handling as CRYPTO query...")
            
            # Extract coin_id from message
            message_lower = message.lower()
            coin_map = {
                "bitcoin": "bitcoin", "btc": "bitcoin",
                "ethereum": "ethereum", "eth": "ethereum",
                "cardano": "cardano", "ada": "cardano",
                "solana": "solana", "sol": "solana",
                "ripple": "ripple", "xrp": "ripple",
                "dogecoin": "dogecoin", "doge": "dogecoin",
                "polkadot": "polkadot", "dot": "polkadot",
                "avalanche": "avalanche", "avax": "avalanche",
                "polygon": "matic-network", "matic": "matic-network",
                "chainlink": "chainlink", "link": "chainlink",
            }
            
            coin_id = None
            for key, value in coin_map.items():
                if key in message_lower:
                    coin_id = value
                    break
            
            # Only fetch data if we found a specific coin
            coin_data = None
            fgi_data = None
            
            if coin_id:
                print(f"🪙 Detected coin: {coin_id}")
                coin_data = CoinGeckoAPI.get_coin_data(coin_id)
                fgi_data = FearGreedIndexAPI.get_fgi_data()
            
            # Build crypto system prompt with live data
            system_prompt = "You are Superio, an advanced onchain intelligence AI assistant specializing in DeFi, cryptocurrency, and blockchain technology."
            
            if coin_data:
                system_prompt += f"\n\n**Current Market Data:**"
                system_prompt += f"\n- {coin_data['name']} ({coin_data['symbol']}): ${coin_data['current_price']:,.2f}"
                system_prompt += f"\n- 24h Change: {coin_data.get('price_change_percentage_24h', 0):.2f}%"
                system_prompt += f"\n- Market Cap: ${coin_data.get('market_cap', 0):,.0f}"
                
                if fgi_data:
                    system_prompt += f"\n- Market Sentiment: {fgi_data['value_classification']} ({fgi_data['value']}/100)"
                
                system_prompt += "\n\nProvide a helpful, data-driven response based on this information. Be concise but informative."
            else:
                system_prompt += "\n\nThe user is asking about cryptocurrency but no specific coin was detected. Provide helpful information about crypto/DeFi topics."
                
        else:
            # GENERAL conversation - no data fetching
            print(f"💬 Handling as GENERAL conversation...")
            system_prompt = """You are Superio, an advanced onchain intelligence AI assistant. You specialize in DeFi, cryptocurrency, and blockchain technology, but you're also friendly and capable of general conversation. Be conversational, helpful, and engaging. Keep responses concise (2-4 sentences). Never introduce yourself as ASI:One or any other identity - you are Superio."""

        print(f"🤖 Calling ASI1 Mini with {intent} context...")

        # Generate AI response with tool calling support
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model="asi1-mini",
            max_tokens=600,
            temperature=0.7,
            tools=YIELD_TOOLS,
            tool_choice="auto"
        )

        # Check if AI wants to call a tool
        response_message = response.choices[0].message

        if response_message.tool_calls:
            print(f"🔧 AI requested tool call: {response_message.tool_calls[0].function.name}")

            # Handle get_yield_pools tool call
            tool_call = response_message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            if function_name == "get_yield_pools":
                print(f"📊 Fetching yield pools with filters: {function_args}")

                # Fetch all pools
                all_pools = DeFiLlamaYields.get_all_pools()

                if not all_pools:
                    return jsonify({"response": "Sorry, I couldn't fetch yield pool data at the moment. Please try again later."}), 200

                # Apply filters
                filtered_pools = all_pools

                # Filter by chain
                chain = function_args.get('chain')
                if chain and chain != 'all':
                    filtered_pools = DeFiLlamaYields.filter_pools_by_chain(filtered_pools, chain)
                    print(f"🔗 Filtered by chain '{chain}': {len(filtered_pools)} pools")

                # Filter by token
                token = function_args.get('token')
                if token:
                    filtered_pools = DeFiLlamaYields.filter_pools_by_token(filtered_pools, token)
                    print(f"🪙 Filtered by token '{token}': {len(filtered_pools)} pools")

                # Filter by pool type
                pool_type = function_args.get('pool_type', 'all')
                min_tvl = function_args.get('min_tvl', 100000)

                if pool_type == 'safe':
                    filtered_pools = DeFiLlamaYields.get_safe_pools(filtered_pools, min_tvl=min_tvl, min_apy=7.0, max_apy=15.0)
                    print(f"🛡️ Filtered safe pools (APY 7-15%): {len(filtered_pools)} pools")
                elif pool_type == 'stablecoin':
                    filtered_pools = DeFiLlamaYields.get_stable_pools(filtered_pools, min_tvl=min_tvl)
                    print(f"💵 Filtered stablecoin pools: {len(filtered_pools)} pools")
                elif pool_type == 'high-apy':
                    filtered_pools = DeFiLlamaYields.get_top_pools_by_apy(filtered_pools, limit=10, min_tvl=min_tvl)
                    print(f"🚀 Top APY pools: {len(filtered_pools)} pools")
                else:
                    # Get top pools by APY
                    filtered_pools = DeFiLlamaYields.get_top_pools_by_apy(filtered_pools, limit=10, min_tvl=min_tvl)

                # Generate summary
                pool_summary = DeFiLlamaYields.get_pools_summary(filtered_pools)

                # Get AI analysis of the pools
                ai_analysis = YieldAnalyzer.analyze_pools_with_ai(asi_key, filtered_pools, message)

                final_response = pool_summary
                if ai_analysis:
                    final_response += f"\n\n**Analysis:**\n{ai_analysis}"

                # Add data source footer
                final_response += f"\n\n---\n📡 **Data Sources:** DeFiLlama API (live) • ASI:One Mini (analysis)"

                # Build tools metadata
                tools_used = [{
                    "name": "get_yield_pools",
                    "source": "DeFiLlama",
                    "filters": function_args,
                    "results_count": len(filtered_pools)
                }]

                # Prepare pools data for UI
                pools_ui = []
                for pool in filtered_pools[:10]:  # Limit to 10 pools for UI
                    apy_base = pool.get('apy', 0) or 0
                    apy_reward = pool.get('apyReward', 0) or 0
                    apy_total = apy_base + apy_reward
                    
                    pools_ui.append({
                        "pool_id": pool.get('pool', ''),
                        "project": pool.get('project', 'Unknown'),
                        "chain": pool.get('chain', 'Unknown'),
                        "symbol": pool.get('symbol', 'Unknown'),
                        "apy_total": round(apy_total, 2),
                        "apy_base": round(apy_base, 2),
                        "apy_reward": round(apy_reward, 2),
                        "tvl": round(pool.get('tvlUsd', 0) or 0, 0),
                        "url": pool.get('url', ''),
                    })

                print(f"✅ Returning {len(filtered_pools)} pools with AI analysis")
                return jsonify({
                    "response": final_response,
                    "tools_used": tools_used,
                    "yield_pools": pools_ui
                }), 200

        # No tool call - return normal response
        ai_response = response_message.content
        print(f"✅ AI Response: {ai_response[:100] if ai_response else 'None'}...")

        return jsonify({"response": ai_response}), 200

    except Exception as e:
        print(f"❌ Error in chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "response": "Sorry, I encountered an error. Please try again."}), 500


@app.route('/api/defi/analyze', methods=['POST'])
def analyze_defi():
    """
    DeFi analysis endpoint
    """
    try:
        data = request.get_json()

        if not data or 'coin_id' not in data:
            return jsonify({"error": "Missing 'coin_id' field"}), 400

        coin_id = data['coin_id']
        query = data.get('query', f"Analyze {coin_id}")
        include_fgi = data.get('include_fgi', True)

        # Import here to avoid circular imports
        from tools.defi_tools import CoinGeckoAPI, FearGreedIndexAPI, ASI1API, extract_recommendation

        # Fetch coin data
        coin_data = CoinGeckoAPI.get_coin_data(coin_id)

        if not coin_data:
            return jsonify({"error": f"Failed to fetch data for {coin_id}"}), 404

        # Fetch FGI data if requested
        fgi_data = None
        if include_fgi:
            fgi_data = FearGreedIndexAPI.get_fgi_data()

        # Analyze with ASI1 if key is available
        analysis = None
        recommendation = None
        asi_key = os.getenv("ASI_API_KEY")

        if asi_key:
            analysis = ASI1API.analyze_defi_data(
                api_key=asi_key,
                coin_data=coin_data,
                fgi_data=fgi_data,
                query=query
            )
            if analysis:
                recommendation = extract_recommendation(analysis)
        else:
            # Fallback analysis
            price_change = coin_data.get("price_change_percentage_24h", 0)
            analysis = f"Price analysis for {coin_data['name']}: "

            if price_change < -10:
                analysis += f"Significant drop of {price_change:.2f}% in 24h."
                recommendation = "SELL"
            elif price_change > 10:
                analysis += f"Strong gain of {price_change:.2f}% in 24h."
                recommendation = "BUY"
            else:
                analysis += f"Moderate change of {price_change:.2f}% in 24h."
                recommendation = "HOLD"

        response = {
            "coin_id": coin_id,
            "coin_data": coin_data,
            "fgi_data": fgi_data,
            "analysis": analysis,
            "recommendation": recommendation,
            "timestamp": get_timestamp()
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/coin/<coin_id>', methods=['GET'])
def get_coin(coin_id):
    """Get coin data"""
    try:
        from tools.defi_tools import CoinGeckoAPI

        coin_data = CoinGeckoAPI.get_coin_data(coin_id)

        if not coin_data:
            return jsonify({"error": f"Failed to fetch data for {coin_id}"}), 404

        return jsonify(coin_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/fgi', methods=['GET'])
def get_fgi():
    """Get Fear & Greed Index data"""
    try:
        from tools.defi_tools import FearGreedIndexAPI

        limit = request.args.get('limit', 1, type=int)
        fgi_data = FearGreedIndexAPI.get_fgi_data(limit=limit)

        if not fgi_data:
            return jsonify({"error": "Failed to fetch FGI data"}), 404

        return jsonify(fgi_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/trending', methods=['GET'])
def get_trending():
    """Get trending coins"""
    try:
        from tools.defi_tools import CoinGeckoAPI

        trending = CoinGeckoAPI.get_trending_coins()
        return jsonify({"trending": trending}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/protocols', methods=['GET'])
def get_protocols():
    """Get DeFi protocols"""
    try:
        from tools.defi_tools import DeFiLlamaAPI

        protocols = DeFiLlamaAPI.get_all_protocols()

        # Return top 50 by TVL
        top_protocols = sorted(protocols, key=lambda x: x.get('tvl', 0), reverse=True)[:50]

        return jsonify({"protocols": top_protocols}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/protocol/<protocol>', methods=['GET'])
def get_protocol(protocol):
    """Get specific protocol data"""
    try:
        from tools.defi_tools import DeFiLlamaAPI

        protocol_data = DeFiLlamaAPI.get_protocol_tvl(protocol)

        if not protocol_data:
            return jsonify({"error": f"Failed to fetch data for {protocol}"}), 404

        return jsonify(protocol_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_timestamp():
    """Get current timestamp"""
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"


if __name__ == '__main__':
    import sys

    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    print(f"Starting Flask API Server on port {port}...")
    print(f"CORS enabled for: http://localhost:3000, http://localhost:3001")
    print(f"ASI API Key loaded: {bool(os.getenv('ASI_API_KEY') and os.getenv('ASI_API_KEY') != 'your_asi_api_key_here')}")
    print(f"\nEndpoints available:")
    print(f"  - GET  /api/health")
    print(f"  - GET  /api/asi-health (Test ASI API)")
    print(f"  - POST /api/chat")
    print(f"  - GET  /api/agents")
    print(f"\nLogs will be printed to console...")
    sys.stdout.flush()

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
