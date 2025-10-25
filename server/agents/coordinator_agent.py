"""
Coordinator Agent - Routes requests to specialized DeFi agents
Handles intent classification and orchestrates multi-agent communication
"""
import os
import sys
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from uagents import Agent, Context
from models.messages import (
    CoordinatorRequest,
    CoordinatorResponse,
    DeFiAnalysisRequest,
    DeFiAnalysisResponse,
    AgentHealthRequest,
    AgentHealthResponse,
    ErrorMessage,
    create_timestamp,
)


# Create agent
coordinator_agent = Agent(
    name="coordinator_agent",
    port=int(os.getenv("COORDINATOR_PORT", 8000)),
    seed="coordinator_agent_seed_phrase_12345",
    endpoint=["http://127.0.0.1:8000/submit"],
)

# Agent addresses
DEFI_AGENT_ADDRESS = os.getenv("DEFI_AGENT_ADDRESS", "")


@coordinator_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Coordinator Agent started")
    ctx.logger.info(f"Agent address: {coordinator_agent.address}")
    ctx.storage.set("requests_processed", 0)
    ctx.storage.set("startup_time", create_timestamp())
    ctx.storage.set("pending_requests", {})


def classify_intent_with_ai(query: str) -> Dict[str, Any]:
    """Classify user intent using ASI1 Mini LLM"""
    try:
        from tools.defi_tools import ASI1API
        from openai import OpenAI

        asi_key = os.getenv("ASI_API_KEY")

        if not asi_key or asi_key == "your_asi_api_key_here":
            print("⚠️ ASI API key not available, using fallback classification")
            return classify_intent_fallback(query)

        print(f"🤖 Classifying intent with AI: '{query[:50]}...'")

        # Create OpenAI client pointing to ASI1 endpoint
        client = OpenAI(
            api_key=asi_key,
            base_url="https://api.asi1.ai/v1"
        )

        # Construct classification prompt
        prompt = f"""Analyze this user query and classify the intent.

User Query: "{query}"

Available Intents:
1. DEFI - Questions about cryptocurrency prices, DeFi protocols, trading, market analysis, specific coins
2. GENERAL - General conversation, greetings, or questions not related to DeFi/crypto

Respond with ONLY ONE WORD: either "DEFI" or "GENERAL"
"""

        # Call ASI1 Mini
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an intent classification expert. Respond with only one word: DEFI or GENERAL."},
                {"role": "user", "content": prompt}
            ],
            model="asi1-mini",
            max_tokens=10,
            temperature=0.3
        )

        intent_response = completion.choices[0].message.content.strip().upper()
        print(f"✅ AI classified intent as: {intent_response}")

        # Parse response
        if "DEFI" in intent_response:
            return {
                "intent": "DEFI",
                "confidence": 0.9,
                "agent": "defi_agent",
                "method": "ai"
            }
        else:
            return {
                "intent": "GENERAL",
                "confidence": 0.8,
                "agent": "coordinator_agent",
                "method": "ai"
            }

    except Exception as e:
        print(f"❌ Error in AI classification: {e}")
        return classify_intent_fallback(query)


def classify_intent_fallback(query: str) -> Dict[str, Any]:
    """Fallback keyword-based intent classification"""
    query_lower = query.lower()

    # DeFi/Crypto keywords
    defi_keywords = [
        "price", "coin", "crypto", "bitcoin", "ethereum", "token",
        "defi", "trading", "market", "tvl", "protocol", "yield",
        "liquidity", "apy", "fear", "greed", "sentiment", "buy", "sell",
        "btc", "eth", "ada", "sol", "xrp", "doge", "dot", "avax", "matic"
    ]

    # Check for DeFi intent
    defi_score = sum(1 for keyword in defi_keywords if keyword in query_lower)

    if defi_score > 0:
        return {
            "intent": "DEFI",
            "confidence": min(0.5 + (defi_score * 0.1), 1.0),
            "agent": "defi_agent",
            "method": "keyword"
        }

    # Default to general
    return {
        "intent": "GENERAL",
        "confidence": 0.3,
        "agent": "coordinator_agent",
        "method": "keyword"
    }


@coordinator_agent.on_message(model=CoordinatorRequest)
async def handle_coordinator_request(ctx: Context, sender: str, msg: CoordinatorRequest):
    """Handle routing requests to appropriate agents"""
    print(f"\n{'='*60}")
    print(f"📥 COORDINATOR: Received request from {sender}")
    print(f"📝 Query: {msg.query}")
    print(f"{'='*60}")
    ctx.logger.info(f"Received request from {sender}: {msg.query[:50]}...")

    try:
        # Classify intent with AI
        print(f"🔍 Starting AI-powered intent classification...")
        classification = classify_intent_with_ai(msg.query)
        intent = classification["intent"]
        confidence = classification["confidence"]
        method = classification.get("method", "unknown")

        print(f"✅ Intent: {intent} | Confidence: {confidence:.2f} | Method: {method}")
        ctx.logger.info(f"Classified intent: {intent} (confidence: {confidence}, method: {method})")

        # Route to appropriate agent
        if intent == "DEFI" and DEFI_AGENT_ADDRESS:
            # Extract coin_id from query (simple extraction)
            coin_id = extract_coin_id(msg.query)
            print(f"🪙 Extracted coin_id: {coin_id}")

            # Forward to DeFi agent
            defi_request = DeFiAnalysisRequest(
                coin_id=coin_id,
                query=msg.query,
                include_fgi=True
            )

            # Store pending request
            request_id = f"{sender}_{create_timestamp()}"
            pending = ctx.storage.get("pending_requests") or {}
            pending[request_id] = {
                "sender": sender,
                "original_query": msg.query,
                "intent": intent,
                "confidence": confidence
            }
            ctx.storage.set("pending_requests", pending)
            ctx.storage.set("current_request_id", request_id)

            print(f"📤 Forwarding to DeFi Agent at {DEFI_AGENT_ADDRESS}")
            await ctx.send(DEFI_AGENT_ADDRESS, defi_request)
            ctx.logger.info(f"Forwarded request to DeFi Agent")

        else:
            # Handle directly (fallback)
            print(f"💬 Handling as GENERAL query with fallback response")
            response = CoordinatorResponse(
                query=msg.query,
                intent=intent,
                agent_used="coordinator_agent",
                response="I can help you with cryptocurrency and DeFi analysis. Try asking about Bitcoin, Ethereum, or other cryptocurrencies!",
                confidence=confidence,
                timestamp=create_timestamp()
            )

            print(f"📤 Sending fallback response to {sender}")
            await ctx.send(sender, response)

            # Update stats
            count = ctx.storage.get("requests_processed") or 0
            ctx.storage.set("requests_processed", count + 1)
            print(f"✅ Request processed (total: {count + 1})")

    except Exception as e:
        ctx.logger.error(f"Error handling coordinator request: {e}")
        error = ErrorMessage(
            error=str(e),
            error_type="ROUTING_ERROR",
            timestamp=create_timestamp()
        )
        await ctx.send(sender, error)


@coordinator_agent.on_message(model=DeFiAnalysisResponse)
async def handle_defi_response(ctx: Context, sender: str, msg: DeFiAnalysisResponse):
    """Handle DeFi analysis response and forward to original requester"""
    ctx.logger.info(f"Received DeFi analysis response for {msg.coin_id}")

    try:
        # Get pending request
        request_id = ctx.storage.get("current_request_id")
        pending = ctx.storage.get("pending_requests") or {}

        if request_id and request_id in pending:
            request_data = pending[request_id]
            original_sender = request_data["sender"]

            # Format response
            response_text = f"{msg.analysis}\n\n"
            if msg.recommendation:
                response_text += f"Recommendation: {msg.recommendation}\n\n"

            if msg.coin_data:
                response_text += f"💰 {msg.coin_data.name} ({msg.coin_data.symbol})\n"
                response_text += f"Price: ${msg.coin_data.current_price:,.2f}\n"
                response_text += f"24h Change: {msg.coin_data.price_change_percentage_24h:.2f}%\n"
                response_text += f"Market Cap: ${msg.coin_data.market_cap:,.0f}\n"

            if msg.fgi_data:
                response_text += f"\n📊 Market Sentiment: {msg.fgi_data.value_classification} ({msg.fgi_data.value})"

            # Create coordinator response
            response = CoordinatorResponse(
                query=request_data["original_query"],
                intent=request_data["intent"],
                agent_used="defi_agent",
                response=response_text,
                confidence=request_data["confidence"],
                metadata={
                    "coin_id": msg.coin_id,
                    "recommendation": msg.recommendation
                },
                timestamp=create_timestamp()
            )

            await ctx.send(original_sender, response)

            # Update stats
            count = ctx.storage.get("requests_processed") or 0
            ctx.storage.set("requests_processed", count + 1)
            ctx.storage.set("last_request_time", create_timestamp())

            # Clean up
            del pending[request_id]
            ctx.storage.set("pending_requests", pending)

            ctx.logger.info(f"Forwarded DeFi response to {original_sender}")

    except Exception as e:
        ctx.logger.error(f"Error handling DeFi response: {e}")


@coordinator_agent.on_message(model=AgentHealthRequest)
async def handle_health_request(ctx: Context, sender: str, msg: AgentHealthRequest):
    """Handle agent health check requests"""
    ctx.logger.info(f"Received health check from {sender}")

    try:
        startup_time = ctx.storage.get("startup_time")
        requests_processed = ctx.storage.get("requests_processed") or 0
        last_request = ctx.storage.get("last_request_time")

        # Calculate uptime
        from datetime import datetime
        if startup_time:
            start = datetime.fromisoformat(startup_time.replace("Z", "+00:00"))
            now = datetime.utcnow()
            uptime = (now - start).total_seconds()
        else:
            uptime = 0

        response = AgentHealthResponse(
            agent_name="coordinator_agent",
            status="HEALTHY",
            uptime=uptime,
            requests_processed=requests_processed,
            last_request_timestamp=last_request,
            metadata={
                "defi_agent_connected": bool(DEFI_AGENT_ADDRESS)
            }
        )

        await ctx.send(sender, response)

    except Exception as e:
        ctx.logger.error(f"Error handling health request: {e}")


def extract_coin_id(query: str) -> str:
    """Extract coin ID from query (simple mapping)"""
    query_lower = query.lower()

    # Common coin mappings
    coin_map = {
        "bitcoin": "bitcoin",
        "btc": "bitcoin",
        "ethereum": "ethereum",
        "eth": "ethereum",
        "cardano": "cardano",
        "ada": "cardano",
        "solana": "solana",
        "sol": "solana",
        "ripple": "ripple",
        "xrp": "ripple",
        "dogecoin": "dogecoin",
        "doge": "dogecoin",
        "polkadot": "polkadot",
        "dot": "polkadot",
        "avalanche": "avalanche",
        "avax": "avalanche",
        "polygon": "matic-network",
        "matic": "matic-network",
        "chainlink": "chainlink",
        "link": "chainlink"
    }

    for key, coin_id in coin_map.items():
        if key in query_lower:
            return coin_id

    # Default to bitcoin
    return "bitcoin"


if __name__ == "__main__":
    print("Starting Coordinator Agent...")
    print(f"Agent Address: {coordinator_agent.address}")
    print(f"DeFi Agent Address: {DEFI_AGENT_ADDRESS}")
    coordinator_agent.run()
