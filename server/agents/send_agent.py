"""
Onchain Send Agent - Handles send intent detection and send UI generation
"""
import os
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)


class SendParser:
    """Parse send intent from user messages"""

    # Supported tokens and their info
    TOKENS = {
        "sol": {"symbol": "SOL", "name": "Solana", "decimals": 9, "network": "Solana"},
        "solana": {"symbol": "SOL", "name": "Solana", "decimals": 9, "network": "Solana"},
        "usdc": {"symbol": "USDC", "name": "USD Coin", "decimals": 6, "network": "Solana"},
        "usdt": {"symbol": "USDT", "name": "Tether", "decimals": 6, "network": "Solana"},
        "eth": {"symbol": "ETH", "name": "Ethereum", "decimals": 18, "network": "Ethereum"},
        "ethereum": {"symbol": "ETH", "name": "Ethereum", "decimals": 18, "network": "Ethereum"},
        "btc": {"symbol": "BTC", "name": "Bitcoin", "decimals": 8, "network": "Bitcoin"},
        "bitcoin": {"symbol": "BTC", "name": "Bitcoin", "decimals": 8, "network": "Bitcoin"},
        "bonk": {"symbol": "BONK", "name": "Bonk", "decimals": 5, "network": "Solana"},
        "wif": {"symbol": "WIF", "name": "dogwifhat", "decimals": 6, "network": "Solana"},
        "jup": {"symbol": "JUP", "name": "Jupiter", "decimals": 6, "network": "Solana"},
        "base": {"symbol": "BASE", "name": "Base", "decimals": 18, "network": "Base"},
        "dai": {"symbol": "DAI", "name": "Dai Stablecoin", "decimals": 18, "network": "Ethereum"},
        "matic": {"symbol": "MATIC", "name": "Polygon", "decimals": 18, "network": "Polygon"},
        "avax": {"symbol": "AVAX", "name": "Avalanche", "decimals": 18, "network": "Avalanche"},
        "link": {"symbol": "LINK", "name": "Chainlink", "decimals": 18, "network": "Ethereum"},
    }

    @staticmethod
    def detect_send_intent(message: str) -> bool:
        """Detect if message is a send request"""
        message_lower = message.lower()
        send_keywords = ["send", "transfer", "pay", "payment"]
        return any(keyword in message_lower for keyword in send_keywords)

    @staticmethod
    def validate_address(address: str, network: str = "Ethereum") -> bool:
        """
        Validate cryptocurrency address format
        Basic validation - in production, use proper validation libraries
        """
        if not address:
            return False

        # Ethereum/Base/ERC20 addresses (0x + 40 hex chars)
        if network in ["Ethereum", "Base", "Polygon", "Avalanche"]:
            return bool(re.match(r'^0x[a-fA-F0-9]{40}$', address))

        # Solana addresses (base58, 32-44 chars)
        elif network == "Solana":
            return bool(re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', address))

        # Bitcoin addresses (various formats)
        elif network == "Bitcoin":
            return bool(re.match(r'^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$', address) or
                       re.match(r'^bc1[a-z0-9]{39,59}$', address))

        return False

    @staticmethod
    def parse_send_request(message: str) -> Optional[Dict[str, Any]]:
        """
        Parse send request from message
        Examples:
        - "send 0.01 eth to 0x1122..."
        - "transfer 5 sol to ABC123..."
        - "pay 100 usdc to 0xabc..."
        """
        message_lower = message.lower()

        # Patterns to match send requests
        # Pattern: "send/transfer/pay AMOUNT TOKEN to ADDRESS"
        patterns = [
            r'(?:send|transfer|pay)\s+(\d+\.?\d*)\s+(\w+)\s+to\s+([0x0-9a-zA-Z]+)',
            r'(?:send|transfer|pay)\s+(\w+)\s+(\d+\.?\d*)\s+to\s+([0x0-9a-zA-Z]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                groups = match.groups()

                # Extract amount, token, address based on pattern
                if pattern.startswith(r'(?:send|transfer|pay)\s+(\d+'):
                    amount_str, token, address = groups
                else:
                    token, amount_str, address = groups

                # Validate token
                token = token.lower()
                if token not in SendParser.TOKENS:
                    continue

                # Parse amount
                try:
                    amount = float(amount_str)
                    if amount <= 0:
                        continue
                except ValueError:
                    continue

                # Get token info
                token_info = SendParser.TOKENS[token]
                network = token_info["network"]

                # Validate address for the network
                if not SendParser.validate_address(address, network):
                    continue

                # Estimate gas fees (simplified)
                gas_estimates = {
                    "Ethereum": {"amount": 0.002, "symbol": "ETH"},
                    "Solana": {"amount": 0.00001, "symbol": "SOL"},
                    "Base": {"amount": 0.0001, "symbol": "ETH"},
                    "Polygon": {"amount": 0.01, "symbol": "MATIC"},
                    "Avalanche": {"amount": 0.01, "symbol": "AVAX"},
                    "Bitcoin": {"amount": 0.0001, "symbol": "BTC"},
                }

                gas_fee = gas_estimates.get(network, {"amount": 0.001, "symbol": "ETH"})

                return {
                    "token": token_info["symbol"],
                    "token_name": token_info["name"],
                    "amount": amount,
                    "to_address": address,
                    "network": network,
                    "decimals": token_info["decimals"],
                    "estimated_gas": gas_fee["amount"],
                    "gas_symbol": gas_fee["symbol"],
                    "type": "send"
                }

        return None

    @staticmethod
    def generate_send_response(send_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate send UI response"""
        # Truncate address for display
        address = send_data["to_address"]
        display_address = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address

        return {
            "response": f"I'll help you send {send_data['amount']} {send_data['token']} to {display_address}. Please review the transaction details below.",
            "send_ui": {
                "token": send_data["token"],
                "token_name": send_data["token_name"],
                "amount": send_data["amount"],
                "to_address": send_data["to_address"],
                "network": send_data["network"],
                "estimated_gas": send_data["estimated_gas"],
                "gas_symbol": send_data["gas_symbol"],
                "total_cost": send_data["amount"] if send_data["token"] == send_data["gas_symbol"] else None,
            }
        }


if __name__ == "__main__":
    # Test the parser
    test_messages = [
        "send 0.01 eth to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "transfer 5 sol to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        "pay 100 usdc to 0x1234567890123456789012345678901234567890",
        "send 1.5 btc to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ]

    for msg in test_messages:
        print(f"\nMessage: {msg}")
        if SendParser.detect_send_intent(msg):
            result = SendParser.parse_send_request(msg)
            if result:
                print(f"Parsed: {result}")
                response = SendParser.generate_send_response(result)
                print(f"Response: {response}")
            else:
                print("Failed to parse send request")
        else:
            print("Not a send intent")
