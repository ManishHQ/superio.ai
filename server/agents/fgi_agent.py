"""
Fear & Greed Index Agent - Fetches market sentiment data
"""
import os
from uagents import Agent, Context, Model
from models.messages import FGIRequest, FGIResponse, ErrorMessage, create_timestamp
from tools.defi_tools import FearGreedIndexAPI


# Create agent
fgi_agent = Agent(
    name="fgi_agent",
    port=int(os.getenv("FGI_AGENT_PORT", 8003)),
    seed="fgi_agent_seed_phrase_12345",
    endpoint=["http://127.0.0.1:8003/submit"],
)


@fgi_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"FGI Agent started")
    ctx.logger.info(f"Agent address: {fgi_agent.address}")
    ctx.storage.set("requests_processed", 0)
    ctx.storage.set("startup_time", create_timestamp())


@fgi_agent.on_message(model=FGIRequest)
async def handle_fgi_request(ctx: Context, sender: str, msg: FGIRequest):
    """Handle Fear & Greed Index requests"""
    ctx.logger.info(f"Received FGI request from {sender}")

    try:
        # Fetch FGI data
        fgi_data = FearGreedIndexAPI.get_fgi_data(limit=msg.limit or 1)

        if fgi_data:
            response = FGIResponse(**fgi_data)
            await ctx.send(sender, response)

            # Update stats
            count = ctx.storage.get("requests_processed") or 0
            ctx.storage.set("requests_processed", count + 1)
            ctx.storage.set("last_request_time", create_timestamp())

            ctx.logger.info(f"Sent FGI data to {sender}: {fgi_data.get('value_classification')}")
        else:
            error = ErrorMessage(
                error="Failed to fetch Fear & Greed Index data",
                error_type="DATA_FETCH_ERROR",
                details="FGI API returned no data",
                timestamp=create_timestamp()
            )
            await ctx.send(sender, error)
            ctx.logger.error("Failed to fetch FGI data")

    except Exception as e:
        ctx.logger.error(f"Error processing FGI request: {e}")
        error = ErrorMessage(
            error=str(e),
            error_type="PROCESSING_ERROR",
            timestamp=create_timestamp()
        )
        await ctx.send(sender, error)


if __name__ == "__main__":
    print("Starting Fear & Greed Index Agent...")
    print(f"Agent Address: {fgi_agent.address}")
    fgi_agent.run()
