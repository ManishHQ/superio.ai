"""
Coin Info Agent - Fetches cryptocurrency data from CoinGecko
"""
import os
from uagents import Agent, Context, Model
from models.messages import CoinRequest, CoinResponse, ErrorMessage, create_timestamp
from tools.defi_tools import CoinGeckoAPI


# Create agent
coin_agent = Agent(
    name="coin_info_agent",
    port=int(os.getenv("COIN_AGENT_PORT", 8004)),
    seed="coin_agent_seed_phrase_12345",
    endpoint=["http://127.0.0.1:8004/submit"],
)


@coin_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Coin Info Agent started")
    ctx.logger.info(f"Agent address: {coin_agent.address}")
    ctx.storage.set("requests_processed", 0)
    ctx.storage.set("startup_time", create_timestamp())


@coin_agent.on_message(model=CoinRequest)
async def handle_coin_request(ctx: Context, sender: str, msg: CoinRequest):
    """Handle coin data requests"""
    ctx.logger.info(f"Received coin request for: {msg.coin_id} from {sender}")

    try:
        # Fetch coin data
        coin_data = CoinGeckoAPI.get_coin_data(msg.coin_id)

        if coin_data:
            response = CoinResponse(**coin_data)
            await ctx.send(sender, response)

            # Update stats
            count = ctx.storage.get("requests_processed") or 0
            ctx.storage.set("requests_processed", count + 1)
            ctx.storage.set("last_request_time", create_timestamp())

            ctx.logger.info(f"Sent coin data for {msg.coin_id} to {sender}")
        else:
            error = ErrorMessage(
                error=f"Failed to fetch data for {msg.coin_id}",
                error_type="DATA_FETCH_ERROR",
                details="CoinGecko API returned no data",
                timestamp=create_timestamp()
            )
            await ctx.send(sender, error)
            ctx.logger.error(f"Failed to fetch data for {msg.coin_id}")

    except Exception as e:
        ctx.logger.error(f"Error processing coin request: {e}")
        error = ErrorMessage(
            error=str(e),
            error_type="PROCESSING_ERROR",
            timestamp=create_timestamp()
        )
        await ctx.send(sender, error)


if __name__ == "__main__":
    print("Starting Coin Info Agent...")
    print(f"Agent Address: {coin_agent.address}")
    coin_agent.run()
