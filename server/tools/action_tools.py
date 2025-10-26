"""
Action Tools - Definitions for AI function calling
These tools are presented to the AI so it can decide which actions to take
"""

# Define available tools/actions for the AI to choose from
ACTION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "send_token",
            "description": "Send cryptocurrency tokens to a wallet address. Use this when user wants to transfer/send/pay tokens to someone.",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {"type": "number", "description": "Amount of tokens to send"},
                    "token": {"type": "string", "description": "Token symbol (ETH, SOL, USDC, BTC, etc.)"},
                    "to_address": {"type": "string", "description": "Recipient wallet address (0x... for Ethereum, base58 for Solana, etc.)"}
                },
                "required": ["amount", "token", "to_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "swap_token",
            "description": "Swap/exchange one cryptocurrency for another. Use this when user wants to swap/trade/convert/exchange tokens.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_amount": {"type": "number", "description": "Amount of tokens to swap from"},
                    "from_token": {"type": "string", "description": "Token symbol to swap from (SOL, ETH, USDC, etc.)"},
                    "to_token": {"type": "string", "description": "Token symbol to receive (USDC, ETH, SOL, etc.)"}
                },
                "required": ["from_amount", "from_token", "to_token"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_crypto_info",
            "description": "Get cryptocurrency market data, prices, analysis, and trading information. Use for questions about crypto prices, market cap, trading advice, or coin information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin": {"type": "string", "description": "Cryptocurrency name or symbol (bitcoin, eth, solana, etc.)"},
                    "include_sentiment": {"type": "boolean", "description": "Whether to include Fear & Greed Index sentiment data", "default": True}
                },
                "required": ["coin"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "explain_transaction",
            "description": "Explain how blockchain transactions work, including gas fees, confirmations, transaction lifecycle, etc. Use when user asks about how transactions work.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Transaction topic to explain (gas fees, confirmations, transaction speed, etc.)"}
                },
                "required": ["topic"]
            }
        }
    }
]
