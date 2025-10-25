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
        from agents.swap_agent import SwapParser
        from openai import OpenAI

        # Get ASI API key
        asi_key = os.getenv("ASI_API_KEY")
        print(f"ASI API Key present: {bool(asi_key and asi_key != 'your_asi_api_key_here')}")

        if not asi_key or asi_key == "your_asi_api_key_here":
            return jsonify({"error": "ASI API key not configured"}), 500

        # STEP 0: Check for swap intent FIRST (before AI classification)
        print(f"🔄 Checking for swap intent...")
        if SwapParser.detect_swap_intent(message):
            swap_data = SwapParser.parse_swap_request(message)
            if swap_data:
                print(f"✅ Swap detected: {swap_data['from_amount']} {swap_data['from_token']} -> {swap_data['to_token']}")
                swap_response = SwapParser.generate_swap_response(swap_data)
                return jsonify(swap_response), 200

        # Initialize OpenAI client
        client = OpenAI(
            api_key=asi_key,
            base_url="https://api.asi1.ai/v1"
        )

        # STEP 1: Classify intent using AI
        print(f"🔍 Classifying intent with AI...")
        
        try:
            classification_prompt = f"""You are classifying user messages into one of two categories.

User Message: "{message}"

Categories:
- GENERAL: Greetings ("hi", "hello", "hey"), casual conversation, questions about general topics, compliments, farewells
- CRYPTO: Specific cryptocurrency names (bitcoin, ethereum, etc.), price questions, trading advice, DeFi protocols, market analysis

IMPORTANT RULES:
- Simple greetings like "hi", "hello", "how are you" → GENERAL
- Questions without crypto keywords → GENERAL  
- Only classify as CRYPTO if the message explicitly mentions cryptocurrency, coins, trading, or prices

Respond with ONLY the word: GENERAL or CRYPTO"""

            classification_response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an intent classifier. You respond with only one word: GENERAL or CRYPTO. Greetings and casual conversation are GENERAL."},
                    {"role": "user", "content": classification_prompt}
                ],
                model="asi1-mini",
                max_tokens=5,
                temperature=0.1
            )

            intent = classification_response.choices[0].message.content.strip().upper()
            print(f"✅ AI classified intent as: {intent}")

        except Exception as e:
            print(f"❌ Error in AI classification: {e}")
            # Fallback classification - be very conservative
            message_lower = message.lower().strip()
            
            # Greetings should always be GENERAL
            greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "what's up"]
            if any(greeting in message_lower for greeting in greetings):
                intent = "GENERAL"
            # Only classify as CRYPTO if explicit crypto keywords
            elif any(kw in message_lower for kw in ["bitcoin", "btc", "ethereum", "eth", "price", "trading", "defi", "crypto", "coin"]):
                intent = "CRYPTO"
            else:
                intent = "GENERAL"
                
            print(f"⚠️ Using fallback classification: {intent}")

        # STEP 2: Route based on intent
        if intent == "CRYPTO":
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
        
        # Generate AI response
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model="asi1-mini",
            max_tokens=400,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content
        print(f"✅ AI Response: {ai_response[:100]}...")

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
