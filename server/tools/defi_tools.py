"""
DeFi tools for cryptocurrency and market analysis
"""
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime


class CoinGeckoAPI:
    """CoinGecko API client for cryptocurrency data"""

    BASE_URL = "https://api.coingecko.com/api/v3"

    @staticmethod
    def get_coin_data(coin_id: str) -> Optional[Dict[str, Any]]:
        """Get coin data from CoinGecko"""
        try:
            url = f"{CoinGeckoAPI.BASE_URL}/coins/{coin_id}"
            params = {
                "localization": "false",
                "tickers": "false",
                "community_data": "false",
                "developer_data": "false"
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            return {
                "coin_id": coin_id,
                "name": data.get("name", ""),
                "symbol": data.get("symbol", "").upper(),
                "current_price": data.get("market_data", {}).get("current_price", {}).get("usd", 0),
                "market_cap": data.get("market_data", {}).get("market_cap", {}).get("usd", 0),
                "total_volume": data.get("market_data", {}).get("total_volume", {}).get("usd", 0),
                "price_change_24h": data.get("market_data", {}).get("price_change_24h", 0),
                "price_change_percentage_24h": data.get("market_data", {}).get("price_change_percentage_24h", 0),
                "market_cap_rank": data.get("market_cap_rank"),
                "last_updated": data.get("last_updated", "")
            }

        except requests.RequestException as e:
            print(f"Error fetching coin data: {e}")
            return None

    @staticmethod
    def get_trending_coins() -> List[Dict[str, Any]]:
        """Get trending coins"""
        try:
            url = f"{CoinGeckoAPI.BASE_URL}/search/trending"
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()
            return data.get("coins", [])

        except requests.RequestException as e:
            print(f"Error fetching trending coins: {e}")
            return []

    @staticmethod
    def get_market_chart(coin_id: str, days: int = 7) -> Optional[Dict[str, Any]]:
        """Get market chart data"""
        try:
            url = f"{CoinGeckoAPI.BASE_URL}/coins/{coin_id}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": days
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            return response.json()

        except requests.RequestException as e:
            print(f"Error fetching market chart: {e}")
            return None


class FearGreedIndexAPI:
    """Fear and Greed Index API client"""

    BASE_URL = "https://api.alternative.me/fng/"

    @staticmethod
    def get_fgi_data(limit: int = 1) -> Optional[Dict[str, Any]]:
        """Get Fear and Greed Index data"""
        try:
            params = {"limit": limit}
            response = requests.get(FearGreedIndexAPI.BASE_URL, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("data") and len(data["data"]) > 0:
                latest = data["data"][0]
                return {
                    "value": latest.get("value", ""),
                    "value_classification": latest.get("value_classification", ""),
                    "timestamp": latest.get("timestamp", ""),
                    "time_until_update": latest.get("time_until_update")
                }

            return None

        except requests.RequestException as e:
            print(f"Error fetching FGI data: {e}")
            return None


class DeFiLlamaAPI:
    """DeFiLlama API client for DeFi protocol data"""

    BASE_URL = "https://api.llama.fi"

    @staticmethod
    def get_protocol_tvl(protocol: str) -> Optional[Dict[str, Any]]:
        """Get TVL for a specific protocol"""
        try:
            url = f"{DeFiLlamaAPI.BASE_URL}/protocol/{protocol}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            return response.json()

        except requests.RequestException as e:
            print(f"Error fetching protocol TVL: {e}")
            return None

    @staticmethod
    def get_all_protocols() -> List[Dict[str, Any]]:
        """Get all DeFi protocols"""
        try:
            url = f"{DeFiLlamaAPI.BASE_URL}/protocols"
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            return response.json()

        except requests.RequestException as e:
            print(f"Error fetching protocols: {e}")
            return []

    @staticmethod
    def get_chain_tvl(chain: str) -> Optional[Dict[str, Any]]:
        """Get TVL for a specific chain"""
        try:
            url = f"{DeFiLlamaAPI.BASE_URL}/chains"
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()

            for chain_data in data:
                if chain_data.get("name", "").lower() == chain.lower():
                    return chain_data

            return None

        except requests.RequestException as e:
            print(f"Error fetching chain TVL: {e}")
            return None


class ASI1API:
    """LLM API client using OpenAI library pointing to ASI1"""

    @staticmethod
    def analyze_defi_data(
        api_key: str,
        coin_data: Dict[str, Any],
        fgi_data: Optional[Dict[str, Any]] = None,
        query: str = ""
    ) -> Optional[str]:
        """Analyze DeFi data using ASI1 Mini via OpenAI library"""
        try:
            from openai import OpenAI

            # Create OpenAI client pointing to ASI1 endpoint
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.asi1.ai/v1"
            )

            # Construct prompt
            prompt_parts = [f"Analyze this cryptocurrency data and provide insights:\n\nCoin: {coin_data.get('name')} ({coin_data.get('symbol')})"]
            prompt_parts.append(f"Current Price: ${coin_data.get('current_price', 0):,.2f}")
            prompt_parts.append(f"24h Change: {coin_data.get('price_change_percentage_24h', 0):.2f}%")
            prompt_parts.append(f"Market Cap: ${coin_data.get('market_cap', 0):,.0f}")
            prompt_parts.append(f"Volume: ${coin_data.get('total_volume', 0):,.0f}")

            if fgi_data:
                prompt_parts.append(f"\nMarket Sentiment (Fear & Greed Index): {fgi_data.get('value')} - {fgi_data.get('value_classification')}")

            if query:
                prompt_parts.append(f"\nUser Query: {query}")

            prompt_parts.append("\nProvide a concise analysis (2-3 sentences) and clear recommendation (SELL, HOLD, or BUY).")

            prompt = "\n".join(prompt_parts)

            print("Calling ASI1 Mini API...")

            # Call ASI1 Mini using OpenAI client
            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are Superio, an advanced onchain intelligence AI assistant. You specialize in DeFi analysis, cryptocurrency markets, and blockchain data. Provide clear, data-driven insights and recommendations in 2-3 sentences. Never introduce yourself as ASI:One or any other identity - you are Superio."},
                    {"role": "user", "content": prompt}
                ],
                model="asi1-mini",
                max_tokens=300,
                temperature=0.7
            )

            content = completion.choices[0].message.content
            print(f"✓ LLM Response received: {len(content)} characters")
            return content

        except Exception as e:
            print(f"✗ Error analyzing with ASI1 Mini: {e}")
            return None


def extract_recommendation(analysis: str) -> Optional[str]:
    """Extract SELL/HOLD/BUY recommendation from analysis text"""
    analysis_upper = analysis.upper()

    if "SELL" in analysis_upper:
        return "SELL"
    elif "BUY" in analysis_upper:
        return "BUY"
    elif "HOLD" in analysis_upper:
        return "HOLD"

    return None
