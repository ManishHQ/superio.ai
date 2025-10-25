"""
DeFi Yield Tools - Fetch live yield pool data from DeFiLlama
"""
import requests
from typing import Dict, Any, Optional, List


class DeFiLlamaYields:
    """DeFiLlama Yields API client"""

    # Public endpoints (no API key required)
    PUBLIC_BASE_URL = "https://yields.llama.fi"

    # Pro endpoints (API key required - from .env)
    PRO_BASE_URL = "https://pro-api.llama.fi"

    @staticmethod
    def get_all_pools(api_key: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        """
        Get all yield pools with APY, TVL, and token data
        Returns: List of pools with chain, project, APY, TVL, tokens
        """
        try:
            if api_key and api_key != "your_defillama_api_key_here":
                url = f"{DeFiLlamaYields.PRO_BASE_URL}/{api_key}/yields/pools"
            else:
                # Use public endpoint
                url = f"{DeFiLlamaYields.PUBLIC_BASE_URL}/pools"

            print(f"📊 Fetching all yield pools from DeFiLlama...")
            response = requests.get(url, timeout=15)
            response.raise_for_status()

            data = response.json()
            pools = data.get('data', [])

            print(f"✅ Retrieved {len(pools)} yield pools")
            return pools

        except requests.RequestException as e:
            print(f"❌ Error fetching pools: {e}")
            return None

    @staticmethod
    def filter_pools_by_chain(pools: List[Dict[str, Any]], chain: str) -> List[Dict[str, Any]]:
        """Filter pools by blockchain"""
        return [p for p in pools if p.get('chain', '').lower() == chain.lower()]

    @staticmethod
    def filter_pools_by_project(pools: List[Dict[str, Any]], project: str) -> List[Dict[str, Any]]:
        """Filter pools by protocol/project"""
        return [p for p in pools if project.lower() in p.get('project', '').lower()]

    @staticmethod
    def filter_pools_by_token(pools: List[Dict[str, Any]], token_symbol: str) -> List[Dict[str, Any]]:
        """Filter pools by token symbol"""
        filtered = []
        for pool in pools:
            symbol = pool.get('symbol', '').upper()
            if token_symbol.upper() in symbol:
                filtered.append(pool)
        return filtered

    @staticmethod
    def get_top_pools_by_apy(pools: List[Dict[str, Any]], limit: int = 10, min_tvl: float = 100000) -> List[Dict[str, Any]]:
        """
        Get top pools by APY with minimum TVL filter
        Args:
            pools: List of pools
            limit: Number of pools to return
            min_tvl: Minimum TVL in USD (default 100k to filter out risky pools)
        """
        # Filter by minimum TVL
        filtered = [p for p in pools if p.get('tvlUsd', 0) >= min_tvl]

        # Sort by APY (base + reward)
        sorted_pools = sorted(
            filtered,
            key=lambda x: (x.get('apy', 0) or 0) + (x.get('apyReward', 0) or 0),
            reverse=True
        )

        return sorted_pools[:limit]

    @staticmethod
    def get_stable_pools(pools: List[Dict[str, Any]], min_tvl: float = 500000) -> List[Dict[str, Any]]:
        """Get stablecoin pools (usually safer, lower APY)"""
        stable_keywords = ['usdc', 'usdt', 'dai', 'busd', 'frax', 'lusd', 'susd']

        stable_pools = []
        for pool in pools:
            symbol = pool.get('symbol', '').lower()
            if any(stable in symbol for stable in stable_keywords):
                if pool.get('tvlUsd', 0) >= min_tvl:
                    stable_pools.append(pool)

        # Sort by APY
        return sorted(stable_pools, key=lambda x: x.get('apy', 0) or 0, reverse=True)

    @staticmethod
    def format_pool_info(pool: Dict[str, Any]) -> str:
        """Format pool information for display"""
        chain = pool.get('chain', 'Unknown')
        project = pool.get('project', 'Unknown')
        symbol = pool.get('symbol', 'Unknown')

        apy_base = pool.get('apy', 0) or 0
        apy_reward = pool.get('apyReward', 0) or 0
        apy_total = apy_base + apy_reward

        tvl = pool.get('tvlUsd', 0) or 0

        # Format output
        output = f"**{project}** - {symbol} ({chain})\n"
        output += f"💰 APY: {apy_total:.2f}% (Base: {apy_base:.2f}% + Rewards: {apy_reward:.2f}%)\n"
        output += f"📊 TVL: ${tvl:,.0f}\n"

        # Add pool URL if available
        pool_id = pool.get('pool')
        if pool_id:
            output += f"🔗 Pool ID: `{pool_id}`\n"

        return output

    @staticmethod
    def get_pools_summary(pools: List[Dict[str, Any]]) -> str:
        """Create a summary of pools"""
        if not pools:
            return "No pools found matching your criteria."

        output = f"📊 **Found {len(pools)} Yield Pools**\n\n"

        # Show top 5 pools
        for i, pool in enumerate(pools[:5], 1):
            output += f"**{i}. " + DeFiLlamaYields.format_pool_info(pool) + "\n"

        if len(pools) > 5:
            output += f"\n_... and {len(pools) - 5} more pools_"

        return output


class YieldAnalyzer:
    """Analyze yield opportunities using AI"""

    @staticmethod
    def analyze_pools_with_ai(
        api_key: str,
        pools: List[Dict[str, Any]],
        user_query: str
    ) -> Optional[str]:
        """Use ASI1 Mini to analyze yield pools based on user query"""
        try:
            from openai import OpenAI

            client = OpenAI(
                api_key=api_key,
                base_url="https://api.asi1.ai/v1"
            )

            # Prepare pool data summary
            pool_summaries = []
            for pool in pools[:10]:  # Limit to top 10 for context size
                pool_summaries.append({
                    'project': pool.get('project'),
                    'chain': pool.get('chain'),
                    'symbol': pool.get('symbol'),
                    'apy': round((pool.get('apy', 0) or 0) + (pool.get('apyReward', 0) or 0), 2),
                    'tvl': round(pool.get('tvlUsd', 0) or 0, 0)
                })

            prompt = f"""Analyze these DeFi yield pools and provide recommendations.

User Query: {user_query}

Available Pools:
{pool_summaries}

Provide a concise analysis (2-3 sentences) highlighting:
1. Best opportunities based on the user's query
2. Risk considerations (APY vs TVL balance)
3. Specific recommendations

Be helpful and data-driven."""

            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are Superio, a DeFi yield analysis expert. Provide clear, actionable insights about yield farming opportunities."},
                    {"role": "user", "content": prompt}
                ],
                model="asi1-mini",
                max_tokens=400,
                temperature=0.7
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"❌ Error in AI analysis: {e}")
            return None


# Tool calling interface for AI
YIELD_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_yield_pools",
            "description": "Get DeFi yield pools where users can invest to earn APY. Returns pools with APY rates, TVL, chains, and protocols.",
            "parameters": {
                "type": "object",
                "properties": {
                    "chain": {
                        "type": "string",
                        "description": "Filter by blockchain: ethereum, polygon, arbitrum, optimism, bsc, avalanche, solana, etc.",
                        "enum": ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "solana", "all"]
                    },
                    "token": {
                        "type": "string",
                        "description": "Filter by token symbol: ETH, USDC, USDT, DAI, etc."
                    },
                    "min_tvl": {
                        "type": "number",
                        "description": "Minimum TVL in USD to filter safe pools (default: 100000)"
                    },
                    "pool_type": {
                        "type": "string",
                        "description": "Type of pools: stablecoin (safer), high-apy (riskier), or all",
                        "enum": ["stablecoin", "high-apy", "all"]
                    }
                },
                "required": []
            }
        }
    }
]
