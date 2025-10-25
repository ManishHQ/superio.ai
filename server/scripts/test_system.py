"""
Test script for Superio AI Backend
Tests all components and agent communication
"""
import requests
import json
import time
from typing import Dict, Any


API_URL = "http://localhost:5001"


def print_header(text: str):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(text: str):
    """Print success message"""
    print(f"✅ {text}")


def print_error(text: str):
    """Print error message"""
    print(f"❌ {text}")


def print_info(text: str):
    """Print info message"""
    print(f"ℹ️  {text}")


def test_health() -> bool:
    """Test API health endpoint"""
    print_header("Testing API Health")

    try:
        response = requests.get(f"{API_URL}/api/health", timeout=5)
        response.raise_for_status()

        data = response.json()
        print_success(f"API is {data.get('status')}")
        print_info(f"Service: {data.get('service')}")
        print_info(f"Version: {data.get('version')}")

        return True
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False


def test_agents_list() -> bool:
    """Test agents list endpoint"""
    print_header("Testing Agents List")

    try:
        response = requests.get(f"{API_URL}/api/agents", timeout=5)
        response.raise_for_status()

        data = response.json()
        agents = data.get('agents', [])

        print_success(f"Found {len(agents)} agents:")
        for agent in agents:
            print(f"  • {agent['name']:20} (Port {agent['port']}) - {agent['description']}")

        return True
    except Exception as e:
        print_error(f"Agents list failed: {e}")
        return False


def test_coin_data(coin_id: str = "bitcoin") -> bool:
    """Test coin data endpoint"""
    print_header(f"Testing Coin Data: {coin_id}")

    try:
        response = requests.get(f"{API_URL}/api/coin/{coin_id}", timeout=10)
        response.raise_for_status()

        data = response.json()

        print_success(f"Retrieved data for {data.get('name')} ({data.get('symbol')})")
        print(f"  💰 Price: ${data.get('current_price', 0):,.2f}")
        print(f"  📊 24h Change: {data.get('price_change_percentage_24h', 0):.2f}%")
        print(f"  📈 Market Cap: ${data.get('market_cap', 0):,.0f}")
        print(f"  📉 Volume: ${data.get('total_volume', 0):,.0f}")

        return True
    except Exception as e:
        print_error(f"Coin data test failed: {e}")
        return False


def test_fgi() -> bool:
    """Test Fear & Greed Index endpoint"""
    print_header("Testing Fear & Greed Index")

    try:
        response = requests.get(f"{API_URL}/api/fgi", timeout=10)
        response.raise_for_status()

        data = response.json()

        print_success(f"Market Sentiment: {data.get('value_classification')}")
        print(f"  📊 Value: {data.get('value')}/100")
        print(f"  🕐 Timestamp: {data.get('timestamp')}")

        return True
    except Exception as e:
        print_error(f"FGI test failed: {e}")
        return False


def test_trending() -> bool:
    """Test trending coins endpoint"""
    print_header("Testing Trending Coins")

    try:
        response = requests.get(f"{API_URL}/api/trending", timeout=10)
        response.raise_for_status()

        data = response.json()
        trending = data.get('trending', [])

        print_success(f"Found {len(trending)} trending coins:")
        for i, item in enumerate(trending[:5], 1):
            coin = item.get('item', {})
            print(f"  {i}. {coin.get('name')} ({coin.get('symbol')})")

        return True
    except Exception as e:
        print_error(f"Trending test failed: {e}")
        return False


def test_defi_analysis(coin_id: str = "bitcoin", query: str = "Should I buy this coin?") -> bool:
    """Test DeFi analysis endpoint"""
    print_header(f"Testing DeFi Analysis: {coin_id}")

    try:
        payload = {
            "coin_id": coin_id,
            "query": query,
            "include_fgi": True
        }

        print_info(f"Query: {query}")
        print_info("Requesting analysis...")

        response = requests.post(
            f"{API_URL}/api/defi/analyze",
            json=payload,
            timeout=30
        )
        response.raise_for_status()

        data = response.json()

        print_success("Analysis completed!")
        print(f"\n📊 {data.get('coin_data', {}).get('name')} Analysis:")
        print(f"{'-' * 60}")
        print(f"\n{data.get('analysis', 'No analysis available')}")
        print(f"\n{'-' * 60}")

        if data.get('recommendation'):
            rec = data.get('recommendation')
            emoji = "🔴" if rec == "SELL" else "🟢" if rec == "BUY" else "🟡"
            print(f"\n{emoji} Recommendation: {rec}")

        return True
    except Exception as e:
        print_error(f"DeFi analysis test failed: {e}")
        return False


def test_protocols() -> bool:
    """Test DeFi protocols endpoint"""
    print_header("Testing DeFi Protocols")

    try:
        response = requests.get(f"{API_URL}/api/protocols", timeout=15)
        response.raise_for_status()

        data = response.json()
        protocols = data.get('protocols', [])

        print_success(f"Found {len(protocols)} protocols")
        print("\nTop 10 by TVL:")
        for i, protocol in enumerate(protocols[:10], 1):
            name = protocol.get('name', 'Unknown')
            tvl = protocol.get('tvl', 0)
            print(f"  {i:2}. {name:20} ${tvl:,.0f}")

        return True
    except Exception as e:
        print_error(f"Protocols test failed: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  🧪 SUPERIO AI BACKEND TEST SUITE")
    print("=" * 60)

    tests = [
        ("API Health", test_health),
        ("Agents List", test_agents_list),
        ("Bitcoin Data", lambda: test_coin_data("bitcoin")),
        ("Ethereum Data", lambda: test_coin_data("ethereum")),
        ("Fear & Greed Index", test_fgi),
        ("Trending Coins", test_trending),
        ("Bitcoin Analysis", lambda: test_defi_analysis("bitcoin", "Should I buy Bitcoin?")),
        ("Ethereum Analysis", lambda: test_defi_analysis("ethereum", "Is ETH a good investment?")),
        ("DeFi Protocols", test_protocols),
    ]

    results = []

    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
            time.sleep(1)  # Small delay between tests
        except Exception as e:
            print_error(f"Test '{name}' crashed: {e}")
            results.append((name, False))

    # Summary
    print_header("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {name}")

    print(f"\n{'-' * 60}")
    print(f"  Results: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print(f"{'-' * 60}\n")

    if passed == total:
        print("🎉 All tests passed! System is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

    return passed == total


if __name__ == "__main__":
    import sys

    # Check if API is reachable
    try:
        requests.get(API_URL, timeout=2)
    except:
        print_error(f"Cannot reach API at {API_URL}")
        print_info("Make sure the server is running: ./scripts/start_all.sh")
        sys.exit(1)

    # Run tests
    success = run_all_tests()
    sys.exit(0 if success else 1)
