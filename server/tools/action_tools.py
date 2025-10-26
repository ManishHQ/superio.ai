"""
Action Tools - AI function definitions for transaction and chart operations
"""

# Import existing tools
import json

# Swap and Send tools (existing)
ACTION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "send_token",
            "description": "Prepare a token send/transfer transaction for wallet signing on Ethereum Sepolia testnet (default network). Use this when user wants to send tokens to someone.",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "Token symbol (default: 'ETH' for Ethereum on Sepolia testnet). Can also be 'USDC', 'USDT', etc.",
                        "default": "ETH"
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send"
                    },
                    "to_address": {
                        "type": "string",
                        "description": "Recipient Ethereum wallet address (0x... format for Sepolia testnet)"
                    }
                },
                "required": ["amount", "to_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "swap_token",
            "description": "Prepare a token swap/exchange transaction for wallet signing. Use this when user wants to swap/exchange one token for another.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_token": {
                        "type": "string",
                        "description": "Token to sell (e.g., 'ETH', 'USDC')"
                    },
                    "to_token": {
                        "type": "string",
                        "description": "Token to buy (e.g., 'USDT', 'WBTC')"
                    },
                    "from_amount": {
                        "type": "number",
                        "description": "Amount of from_token to sell"
                    }
                },
                "required": ["from_token", "to_token", "from_amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_chart",
            "description": "Analyze a cryptocurrency or stock chart using technical analysis. Use this when user asks about chart analysis, price predictions, trading signals, or wants to see a chart. DEFAULT: BINANCE exchange, 1D timeframe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Trading symbol (e.g., 'ETH', 'BTC', 'AAPL')"
                    },
                    "exchange": {
                        "type": "string",
                        "description": "Exchange name: 'BINANCE' for crypto (default), 'NASDAQ' or 'NYSE' for stocks",
                        "enum": ["BINANCE", "NASDAQ", "NYSE", "COINBASE"],
                        "default": "BINANCE"
                    },
                    "interval": {
                        "type": "string",
                        "description": "Chart timeframe (default: 1D)",
                        "enum": ["1m", "5m", "15m", "1h", "4h", "1D", "1W"],
                        "default": "1D"
                    }
                },
                "required": ["symbol"]
            }
        }
    }
]
