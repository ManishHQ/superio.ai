"""
Onchain Swap Agent - Handles swap intent detection and swap UI generation
"""
import os
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)


class SwapParser:
    """Parse swap intent from user messages"""

    # Supported tokens and their info
    TOKENS = {
        "sol": {"symbol": "SOL", "name": "Solana", "decimals": 9},
        "usdc": {"symbol": "USDC", "name": "USD Coin", "decimals": 6},
        "usdt": {"symbol": "USDT", "name": "Tether", "decimals": 6},
        "eth": {"symbol": "ETH", "name": "Ethereum", "decimals": 18},
        "ethereum": {"symbol": "ETH", "name": "Ethereum", "decimals": 18},
        "btc": {"symbol": "BTC", "name": "Bitcoin", "decimals": 8},
        "bitcoin": {"symbol": "BTC", "name": "Bitcoin", "decimals": 8},
        "bonk": {"symbol": "BONK", "name": "Bonk", "decimals": 5},
        "wif": {"symbol": "WIF", "name": "dogwifhat", "decimals": 6},
        "jup": {"symbol": "JUP", "name": "Jupiter", "decimals": 6},
        "base": {"symbol": "BASE", "name": "Base", "decimals": 18},
        "dai": {"symbol": "DAI", "name": "Dai Stablecoin", "decimals": 18},
        "matic": {"symbol": "MATIC", "name": "Polygon", "decimals": 18},
        "avax": {"symbol": "AVAX", "name": "Avalanche", "decimals": 18},
        "link": {"symbol": "LINK", "name": "Chainlink", "decimals": 18},
    }

    # Mock exchange rates (in production, fetch from real API)
    EXCHANGE_RATES = {
        "sol_usdc": 140.50,
        "usdc_sol": 1/140.50,
        "sol_eth": 0.045,
        "eth_sol": 1/0.045,
        "usdc_usdt": 1.0,
        "usdt_usdc": 1.0,
        "eth_usdc": 3000.0,
        "usdc_eth": 1/3000.0,
        "base_usdc": 1.0,  # BASE is ETH on Base network
        "usdc_base": 1.0,
        "eth_base": 1.0,
        "base_eth": 1.0,
        "btc_usdc": 45000.0,
        "usdc_btc": 1/45000.0,
    }

    @staticmethod
    def detect_swap_intent(message: str) -> bool:
        """Detect if message is a swap request"""
        message_lower = message.lower()
        swap_keywords = ["swap", "exchange", "trade", "convert"]
        return any(keyword in message_lower for keyword in swap_keywords)

    @staticmethod
    def parse_swap_request(message: str) -> Optional[Dict[str, Any]]:
        """
        Parse swap request from message
        Example: "swap 5 sol for usdc" -> {from_token: "SOL", from_amount: 5, to_token: "USDC"}
        """
        message_lower = message.lower()

        # Pattern: "swap X TOKEN for TOKEN"
        # Pattern: "swap X TOKEN to TOKEN"
        # Pattern: "exchange X TOKEN for TOKEN"
        patterns = [
            r'(?:swap|exchange|trade|convert)\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to|into)\s+(\w+)',
            r'(?:swap|exchange|trade|convert)\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to|into)',
            r'(?:buy|sell)\s+(\d+\.?\d*)\s+(\w+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                groups = match.groups()

                if len(groups) == 3:
                    amount_str, from_token, to_token = groups
                elif len(groups) == 2:
                    amount_str, from_token = groups
                    # Guess the to_token (default to USDC)
                    to_token = "usdc" if from_token != "usdc" else "sol"
                else:
                    continue

                # Validate tokens
                from_token = from_token.lower()
                to_token = to_token.lower()

                if from_token not in SwapParser.TOKENS or to_token not in SwapParser.TOKENS:
                    continue

                try:
                    from_amount = float(amount_str)
                except ValueError:
                    continue

                # Calculate to_amount using exchange rate
                rate_key = f"{from_token}_{to_token}"
                rate = SwapParser.EXCHANGE_RATES.get(rate_key)

                if not rate:
                    # Try reverse rate
                    reverse_key = f"{to_token}_{from_token}"
                    reverse_rate = SwapParser.EXCHANGE_RATES.get(reverse_key)
                    if reverse_rate:
                        rate = 1 / reverse_rate
                    else:
                        # Default rough estimate
                        rate = 1.0

                to_amount = from_amount * rate

                return {
                    "from_token": SwapParser.TOKENS[from_token]["symbol"],
                    "from_token_name": SwapParser.TOKENS[from_token]["name"],
                    "from_amount": from_amount,
                    "to_token": SwapParser.TOKENS[to_token]["symbol"],
                    "to_token_name": SwapParser.TOKENS[to_token]["name"],
                    "to_amount": round(to_amount, 6),
                    "exchange_rate": rate,
                    "type": "swap"
                }

        return None

    @staticmethod
    def generate_swap_response(swap_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate swap UI response"""
        return {
            "response": f"I'll help you swap {swap_data['from_amount']} {swap_data['from_token']} for {swap_data['to_token']}.",
            "swap_ui": {
                "from_token": swap_data["from_token"],
                "from_token_name": swap_data["from_token_name"],
                "from_amount": swap_data["from_amount"],
                "to_token": swap_data["to_token"],
                "to_token_name": swap_data["to_token_name"],
                "to_amount": swap_data["to_amount"],
                "exchange_rate": swap_data["exchange_rate"],
                "slippage": 0.5,  # 0.5% slippage tolerance
                "estimated_gas": 0.00005,  # SOL
            }
        }


if __name__ == "__main__":
    # Test the parser
    test_messages = [
        "swap 5 sol for usdc",
        "exchange 100 usdc to sol",
        "trade 1.5 eth for usdc",
        "swap 10 sol for eth",
    ]

    for msg in test_messages:
        print(f"\nMessage: {msg}")
        if SwapParser.detect_swap_intent(msg):
            result = SwapParser.parse_swap_request(msg)
            if result:
                print(f"Parsed: {result}")
                response = SwapParser.generate_swap_response(result)
                print(f"Response: {response}")
            else:
                print("Failed to parse swap request")
        else:
            print("Not a swap intent")
