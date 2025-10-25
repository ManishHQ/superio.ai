"""
DeFi Agent - Coordinates DeFi analysis with Coin and FGI agents
Uses ASI1 Mini for intelligent analysis
"""
import os
from typing import Optional
from uagents import Agent, Context, Model
from models.messages import (
    DeFiAnalysisRequest,
    DeFiAnalysisResponse,
    CoinRequest,
    CoinResponse,
    FGIRequest,
    FGIResponse,
    ErrorMessage,
    create_timestamp,
)
from tools.defi_tools import ASI1API, extract_recommendation


# Create agent
defi_agent = Agent(
    name="defi_agent",
    port=int(os.getenv("DEFI_AGENT_PORT", 8001)),
    seed="defi_agent_seed_phrase_12345",
    endpoint=["http://127.0.0.1:8001/submit"],
)

# Agent addresses (will be set from environment or discovery)
COIN_AGENT_ADDRESS = os.getenv("COIN_AGENT_ADDRESS", "")
FGI_AGENT_ADDRESS = os.getenv("FGI_AGENT_ADDRESS", "")
ASI_API_KEY = os.getenv("ASI_API_KEY", "")


@defi_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"DeFi Agent started")
    ctx.logger.info(f"Agent address: {defi_agent.address}")
    ctx.storage.set("requests_processed", 0)
    ctx.storage.set("startup_time", create_timestamp())
    ctx.storage.set("pending_requests", {})


@defi_agent.on_message(model=DeFiAnalysisRequest)
async def handle_defi_analysis_request(ctx: Context, sender: str, msg: DeFiAnalysisRequest):
    """Handle DeFi analysis requests - coordinates with Coin and FGI agents"""
    ctx.logger.info(f"Received DeFi analysis request for {msg.coin_id} from {sender}")

    try:
        # Store request context
        request_id = f"{sender}_{create_timestamp()}"
        pending = ctx.storage.get("pending_requests") or {}
        pending[request_id] = {
            "sender": sender,
            "msg": msg.dict(),
            "coin_data": None,
            "fgi_data": None,
            "waiting_for": []
        }

        # Request coin data from Coin Agent
        if COIN_AGENT_ADDRESS:
            coin_request = CoinRequest(coin_id=msg.coin_id)
            await ctx.send(COIN_AGENT_ADDRESS, coin_request)
            pending[request_id]["waiting_for"].append("coin")
            ctx.logger.info(f"Requested coin data from Coin Agent")

        # Request FGI data if requested
        if msg.include_fgi and FGI_AGENT_ADDRESS:
            fgi_request = FGIRequest(limit=1)
            await ctx.send(FGI_AGENT_ADDRESS, fgi_request)
            pending[request_id]["waiting_for"].append("fgi")
            ctx.logger.info(f"Requested FGI data from FGI Agent")

        ctx.storage.set("pending_requests", pending)
        ctx.storage.set("current_request_id", request_id)

    except Exception as e:
        ctx.logger.error(f"Error handling DeFi analysis request: {e}")
        error = ErrorMessage(
            error=str(e),
            error_type="REQUEST_PROCESSING_ERROR",
            timestamp=create_timestamp()
        )
        await ctx.send(sender, error)


@defi_agent.on_message(model=CoinResponse)
async def handle_coin_response(ctx: Context, sender: str, msg: CoinResponse):
    """Handle coin data response from Coin Agent"""
    ctx.logger.info(f"Received coin data for {msg.coin_id}")

    try:
        # Find the pending request
        pending = ctx.storage.get("pending_requests") or {}
        request_id = ctx.storage.get("current_request_id")

        if request_id and request_id in pending:
            pending[request_id]["coin_data"] = msg.dict()

            if "coin" in pending[request_id]["waiting_for"]:
                pending[request_id]["waiting_for"].remove("coin")

            ctx.storage.set("pending_requests", pending)

            # Check if we have all data
            await check_and_process_analysis(ctx, request_id)

    except Exception as e:
        ctx.logger.error(f"Error handling coin response: {e}")


@defi_agent.on_message(model=FGIResponse)
async def handle_fgi_response(ctx: Context, sender: str, msg: FGIResponse):
    """Handle FGI data response from FGI Agent"""
    ctx.logger.info(f"Received FGI data: {msg.value_classification}")

    try:
        # Find the pending request
        pending = ctx.storage.get("pending_requests") or {}
        request_id = ctx.storage.get("current_request_id")

        if request_id and request_id in pending:
            pending[request_id]["fgi_data"] = msg.dict()

            if "fgi" in pending[request_id]["waiting_for"]:
                pending[request_id]["waiting_for"].remove("fgi")

            ctx.storage.set("pending_requests", pending)

            # Check if we have all data
            await check_and_process_analysis(ctx, request_id)

    except Exception as e:
        ctx.logger.error(f"Error handling FGI response: {e}")


async def check_and_process_analysis(ctx: Context, request_id: str):
    """Check if all data is collected and process analysis"""
    pending = ctx.storage.get("pending_requests") or {}

    if request_id not in pending:
        return

    request_data = pending[request_id]

    # Check if we're still waiting for data
    if len(request_data["waiting_for"]) > 0:
        ctx.logger.info(f"Still waiting for: {request_data['waiting_for']}")
        return

    ctx.logger.info("All data received, processing analysis...")

    try:
        # Extract data
        original_msg = DeFiAnalysisRequest(**request_data["msg"])
        coin_data = request_data.get("coin_data")
        fgi_data = request_data.get("fgi_data")
        sender = request_data["sender"]

        if not coin_data:
            raise Exception("No coin data available")

        # Analyze with ASI1 Mini
        analysis = None
        recommendation = None

        if ASI_API_KEY:
            analysis = ASI1API.analyze_defi_data(
                api_key=ASI_API_KEY,
                coin_data=coin_data,
                fgi_data=fgi_data,
                query=original_msg.query
            )

            if analysis:
                recommendation = extract_recommendation(analysis)
        else:
            # Fallback analysis without LLM
            price_change = coin_data.get("price_change_percentage_24h", 0)
            analysis = f"Price analysis for {coin_data['name']}: "

            if price_change < -10:
                analysis += f"Significant drop of {price_change:.2f}% in 24h. "
                recommendation = "SELL"
            elif price_change > 10:
                analysis += f"Strong gain of {price_change:.2f}% in 24h. "
                recommendation = "BUY"
            else:
                analysis += f"Moderate change of {price_change:.2f}% in 24h. "
                recommendation = "HOLD"

            if fgi_data:
                analysis += f"Market sentiment: {fgi_data['value_classification']}."

        # Send response
        response = DeFiAnalysisResponse(
            coin_id=original_msg.coin_id,
            analysis=analysis or "Analysis unavailable",
            recommendation=recommendation,
            coin_data=CoinResponse(**coin_data) if coin_data else None,
            fgi_data=FGIResponse(**fgi_data) if fgi_data else None,
            timestamp=create_timestamp()
        )

        await ctx.send(sender, response)

        # Update stats
        count = ctx.storage.get("requests_processed") or 0
        ctx.storage.set("requests_processed", count + 1)
        ctx.storage.set("last_request_time", create_timestamp())

        # Clean up
        del pending[request_id]
        ctx.storage.set("pending_requests", pending)

        ctx.logger.info(f"Sent DeFi analysis to {sender}")

    except Exception as e:
        ctx.logger.error(f"Error processing analysis: {e}")
        error = ErrorMessage(
            error=str(e),
            error_type="ANALYSIS_ERROR",
            timestamp=create_timestamp()
        )
        await ctx.send(request_data["sender"], error)

        # Clean up
        del pending[request_id]
        ctx.storage.set("pending_requests", pending)


if __name__ == "__main__":
    print("Starting DeFi Agent...")
    print(f"Agent Address: {defi_agent.address}")
    print(f"Coin Agent Address: {COIN_AGENT_ADDRESS}")
    print(f"FGI Agent Address: {FGI_AGENT_ADDRESS}")
    defi_agent.run()
