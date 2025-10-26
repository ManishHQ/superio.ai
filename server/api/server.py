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

# CORS Configuration - Allow Vercel and local development
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",  # All Vercel preview deployments
    "https://superio.vercel.app",  # Production Vercel (update with your domain)
]

# Check for custom frontend URL in environment
custom_frontend = os.getenv("FRONTEND_URL")
if custom_frontend:
    ALLOWED_ORIGINS.append(custom_frontend)

CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"]
)

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

        # Import database and services
        from db.chat_history_db import db
        from services.summarizer import ChatSummarizer

        # Get recent chat history for context
        context = ""
        if user_id and user_id != 'anonymous' and user_id != 'web_user':
            try:
                recent_messages = db.get_recent_messages(user_id, limit=5)
                if recent_messages:
                    context = ChatSummarizer.create_context_string(recent_messages)
                    print(f"📝 Loaded {len(recent_messages)} messages for context")
            except Exception as e:
                print(f"⚠️ Failed to load context: {e}")

        # Save user message to database
        if user_id and user_id != 'anonymous' and user_id != 'web_user':
            try:
                db.add_message(
                    wallet_address=user_id,
                    role='user',
                    content=message
                )
                print(f"✅ Saved user message to database")
            except Exception as e:
                print(f"⚠️ Failed to save user message: {e}")

        # Import tools
        from tools.defi_tools import CoinGeckoAPI, FearGreedIndexAPI, extract_recommendation, ASI1API
        from tools.yield_tools import DeFiLlamaYields, YieldAnalyzer, YIELD_TOOLS
        from tools.action_tools import ACTION_TOOLS
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

        # Use the AI-driven chat handler with context
        from api.chat_handler_new import handle_chat_request

        result = handle_chat_request(message, user_id, client, asi_key, context)
        
        # Save assistant response to database
        if user_id and user_id != 'anonymous' and user_id != 'web_user':
            try:
                db.add_message(
                    wallet_address=user_id,
                    role='assistant',
                    content=result.get('response', ''),
                    metadata={
                        'swap_ui': result.get('swap_ui'),
                        'send_ui': result.get('send_ui'),
                        'tools_used': result.get('tools_used'),
                        'yield_pools': result.get('yield_pools'),
                        'metta_knowledge': result.get('metta_knowledge'),
                    }
                )
                print(f"✅ Saved assistant response to database")
                
                # Auto-update summary if needed
                try:
                    chat = db.get_chat_history(user_id)
                    if chat and chat.get('messages'):
                        message_count = len(chat['messages'])
                        ChatSummarizer.update_summary_if_needed(
                            user_id, 
                            message_count, 
                            db, 
                            client
                        )
                except Exception as e:
                    print(f"⚠️ Failed to update summary: {e}")
                    
            except Exception as e:
                print(f"⚠️ Failed to save assistant response: {e}")
        
        return jsonify(result), 200

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


@app.route('/api/yield/metta', methods=['GET'])
def get_metta_knowledge():
    """Get MeTTa knowledge graph from yield pools"""
    try:
        from tools.yield_tools import DeFiLlamaYields, YieldAnalyzer
        import os
        
        # Get API keys
        defillama_key = os.getenv("DEFILLAMA_API_KEY")
        
        # Fetch all pools
        pools = DeFiLlamaYields.get_all_pools(api_key=defillama_key)
        
        if not pools:
            return jsonify({"error": "Failed to fetch yield pools"}), 500
        
        # Filter for safe pools (APY 7-15%, TVL > $1M)
        safe_pools = [
            p for p in pools 
            if 7 <= (p.get('apy', 0) or 0) + (p.get('apyReward', 0) or 0) <= 15
            and p.get('tvlUsd', 0) >= 1000000
        ][:20]  # Take top 20
        
        print(f"✅ Found {len(safe_pools)} safe pools for MeTTa knowledge graph")
        
        # Create MeTTa knowledge base
        metta_kb = YieldAnalyzer.create_metta_knowledge_base(safe_pools)
        
        if not metta_kb or not metta_kb.get('graph_data'):
            return jsonify({"error": "Failed to create MeTTa knowledge base"}), 500
        
        return jsonify(metta_kb), 200
        
    except Exception as e:
        print(f"❌ Error in get_metta_knowledge: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============= Chat History Endpoints =============

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a wallet address"""
    try:
        wallet_address = request.args.get('wallet_address')
        
        if not wallet_address:
            return jsonify({"error": "wallet_address parameter required"}), 400
        
        from db.chat_history_db import db
        
        history = db.get_chat_history(wallet_address)
        
        if not history:
            return jsonify({
                "wallet_address": wallet_address,
                "summary": "New conversation",
                "messages": []
            }), 200
        
        return jsonify(history), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/message', methods=['POST'])
def add_chat_message():
    """Add a message to chat history"""
    try:
        data = request.json
        
        wallet_address = data.get('wallet_address')
        role = data.get('role')  # 'user' or 'assistant'
        content = data.get('content')
        metadata = data.get('metadata')
        
        if not wallet_address or not role or not content:
            return jsonify({"error": "wallet_address, role, and content required"}), 400
        
        from db.chat_history_db import db
        
        success = db.add_message(wallet_address, role, content, metadata)
        
        if success:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"error": "Failed to add message"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/summary', methods=['PUT'])
def update_chat_summary():
    """Update chat summary"""
    try:
        data = request.json
        
        wallet_address = data.get('wallet_address')
        summary = data.get('summary')
        
        if not wallet_address or not summary:
            return jsonify({"error": "wallet_address and summary required"}), 400
        
        from db.chat_history_db import db
        
        success = db.update_summary(wallet_address, summary)
        
        if success:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"error": "Failed to update summary"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chart/<path:filename>', methods=['GET'])
def serve_chart(filename):
    """Serve chart images from demo_charts directory"""
    try:
        # Try demo_charts directory first (for hackathon demo)
        demo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'demo_charts', filename)
        
        if os.path.exists(demo_path):
            from flask import send_file
            return send_file(demo_path, mimetype='image/png')
        
        # Fallback to temp directory for dynamically generated charts
        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        if os.path.exists(temp_path):
            from flask import send_file
            return send_file(temp_path, mimetype='image/png')
        
        # If neither exists, return 404
        return jsonify({"error": f"Chart image not found: {filename}"}), 404
    except Exception as e:
        print(f"❌ Error serving chart: {e}")
        return jsonify({"error": str(e)}), 500


def get_timestamp():
    """Get current timestamp"""
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"


if __name__ == '__main__':
    import sys

    # Heroku sets PORT env var, use that first, then FLASK_PORT, then default to 5001
    port = int(os.getenv("PORT") or os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    print(f"Starting Flask API Server on port {port}...")
    print(f"CORS enabled for: http://localhost:3000, http://localhost:3001")
    print(f"ASI API Key loaded: {bool(os.getenv('ASI_API_KEY') and os.getenv('ASI_API_KEY') != 'your_asi_api_key_here')}")
    print(f"\nEndpoints available:")
    print(f"  - GET  /api/health")
    print(f"  - GET  /api/asi-health (Test ASI API)")
    print(f"  - POST /api/chat")
    print(f"  - GET  /api/agents")
    print(f"  - GET  /api/chat/history?wallet_address=<address>")
    print(f"  - POST /api/chat/message (Add message)")
    print(f"  - PUT  /api/chat/summary (Update summary)")
    print(f"\nLogs will be printed to console...")
    sys.stdout.flush()

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
