"""
New Chat Handler - AI-driven tool selection with always-on tools_used tracking
Replace the /api/chat endpoint in server.py with this logic
"""

def handle_chat_request(message, user_id, client, asi_key, context=""):
    """
    Handle chat request using AI function calling for tool selection
    Always returns tools_used in the response
    
    Args:
        message: User message
        user_id: User ID
        client: OpenAI client
        asi_key: ASI API key
        context: Previous conversation context
    """
    from tools.defi_tools import CoinGeckoAPI, FearGreedIndexAPI, ASI1API
    from tools.yield_tools import DeFiLlamaYields, YieldAnalyzer, YIELD_TOOLS
    from tools.action_tools import ACTION_TOOLS
    from agents.swap_agent import SwapParser
    from agents.send_agent import SendParser
    from agents.trading_agent import TradingAgent
    import os
    import json

    print(f"\n🤖 AI-driven request handling for: {message[:50]}...")

    # System prompt - tell AI what it can do
    system_prompt = """You are Superio, an advanced onchain intelligence AI assistant that helps users prepare blockchain transactions.

CRITICAL: When users ask to send, transfer, or pay tokens, you MUST call the send_token function to generate a signable transaction UI. Do NOT refuse or say you can't send - ALWAYS call the function to show them the transaction they can sign with their wallet.

Similarly, for swaps/exchanges, ALWAYS call swap_token to show the swap UI.

For chart analysis, ALWAYS call analyze_chart when user asks about charts, technical analysis, or trading signals. Use defaults: BINANCE exchange and 1D timeframe unless user specifies otherwise. DO NOT ask for more details - just analyze the chart immediately.

Your capabilities:
- **send_token**: Prepare send/transfer transactions for wallet signing (ALWAYS use this for send requests)
- **swap_token**: Prepare token swap transactions for wallet signing (ALWAYS use this for swap requests)
- **analyze_chart**: Analyze cryptocurrency or stock charts (DEFAULT: BINANCE, 1D timeframe - use these if not specified)
- **get_crypto_info**: Get market data, prices, and analysis
- **get_yield_pools**: Find and analyze DeFi yield farming opportunities
- **explain_transaction**: Explain how blockchain transactions work
- **General conversation**: Answer questions naturally

IMPORTANT: For transaction requests (send/swap), you prepare the transaction - users sign it with their wallet. Always call the function!"""

    # Combine all available tools
    all_tools = ACTION_TOOLS + YIELD_TOOLS

    try:
        # Build user message with context
        user_message = message
        if context:
            user_message = f"Previous conversation:\n{context}\n\nCurrent message: {message}"
        
        # Let AI decide what to do
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="asi1-mini",
            tools=all_tools,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=600
        )

        response_message = response.choices[0].message
        tools_used = []

        # Check if AI decided to use a tool
        if response_message.tool_calls:
            tool_call = response_message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            print(f"🔧 AI selected tool: {function_name}")
            print(f"📋 Arguments: {function_args}")

            # Track tool usage
            tools_used.append({
                "name": function_name,
                "source": "AI Function Call",
                "arguments": function_args
            })

            # Route to appropriate handler
            if function_name == "send_token":
                # Default to ETH on Sepolia if token not specified
                token = function_args.get("token", "ETH") or "ETH"

                # Build send UI from AI-extracted params
                send_data = {
                    "token": token.upper(),
                    "token_name": SendParser.TOKENS.get(token.lower(), {}).get("name", "Ethereum"),
                    "amount": function_args["amount"],
                    "to_address": function_args["to_address"],
                    "network": "Ethereum Sepolia",  # Default to Sepolia testnet
                    "decimals": SendParser.TOKENS.get(token.lower(), {}).get("decimals", 18),
                    "estimated_gas": 0.001,
                    "gas_symbol": "ETH"
                }

                send_response = SendParser.generate_send_response(send_data)
                return {
                    "response": send_response["response"],
                    "send_ui": send_response["send_ui"],
                    "tools_used": tools_used
                }

            elif function_name == "swap_token":
                # Build swap data from AI params
                rate = SwapParser.get_exchange_rate(
                    function_args["from_token"],
                    function_args["to_token"],
                    function_args["from_amount"]
                )

                swap_data = {
                    "from_token": function_args["from_token"].upper(),
                    "from_token_name": SwapParser.TOKENS.get(function_args["from_token"].lower(), {}).get("name", function_args["from_token"]),
                    "from_amount": function_args["from_amount"],
                    "to_token": function_args["to_token"].upper(),
                    "to_token_name": SwapParser.TOKENS.get(function_args["to_token"].lower(), {}).get("name", function_args["to_token"]),
                    "to_amount": function_args["from_amount"] * rate,
                    "exchange_rate": rate
                }

                swap_response = SwapParser.generate_swap_response(swap_data)
                return {
                    "response": swap_response["response"],
                    "swap_ui": swap_response["swap_ui"],
                    "tools_used": tools_used
                }

            elif function_name == "get_crypto_info":
                # Get crypto data
                coin = function_args["coin"].lower()
                coin_map = {
                    "bitcoin": "bitcoin", "btc": "bitcoin",
                    "ethereum": "ethereum", "eth": "ethereum",
                    "solana": "solana", "sol": "solana",
                    "cardano": "cardano", "ada": "cardano",
                }

                coin_id = coin_map.get(coin, coin)
                coin_data = CoinGeckoAPI.get_coin_data(coin_id)
                fgi_data = FearGreedIndexAPI.get_fgi_data() if function_args.get("include_sentiment", True) else None

                # Update tools_used with data source
                tools_used[0]["source"] = "CoinGecko API"
                if fgi_data:
                    tools_used.append({
                        "name": "Fear & Greed Index",
                        "source": "Alternative.me API",
                        "data": {"sentiment": fgi_data["value_classification"], "value": fgi_data["value"]}
                    })

                # Generate AI response with data
                data_context = f"""Current market data for {coin_data['name']}:
- Price: ${coin_data['current_price']:,.2f}
- 24h Change: {coin_data.get('price_change_percentage_24h', 0):.2f}%
- Market Cap: ${coin_data.get('market_cap', 0):,.0f}
"""
                if fgi_data:
                    data_context += f"- Market Sentiment: {fgi_data['value_classification']} ({fgi_data['value']}/100)\n"

                ai_response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": f"You are Superio. Use this data to answer: {data_context}"},
                        {"role": "user", "content": message}
                    ],
                    model="asi1-mini",
                    max_tokens=400,
                    temperature=0.7
                )

                return {
                    "response": ai_response.choices[0].message.content,
                    "tools_used": tools_used
                }

            elif function_name == "analyze_chart":
                # Handle chart analysis using trading agent
                symbol = function_args.get("symbol", "").upper()
                # Default to BINANCE if not specified
                exchange = function_args.get("exchange", "BINANCE") or "BINANCE"
                # Default to 1D (daily) chart if not specified
                interval = function_args.get("interval", "1D") or "1D"
                
                # Get Chart-IMG API key
                chart_api_key = os.getenv("CHART_IMG_API_KEY")
                
                print(f"🔍 Chart analysis request:")
                print(f"   Symbol: {symbol}")
                print(f"   Exchange: {exchange}")
                print(f"   Interval: {interval}")
                print(f"   API Key present: {bool(chart_api_key and chart_api_key != 'your_chart_img_api_key_here')}")
                
                # Create trading agent
                trading_agent = TradingAgent(asi_client=client, chart_api_key=chart_api_key)
                
                # Analyze chart
                chart_result = trading_agent.analyze_symbol(
                    symbol=symbol,
                    interval=interval,
                    exchange=exchange
                )

                print(f"🔍 Chart result keys: {chart_result.keys() if chart_result else 'None'}")
                print(f"🔍 Chart result error: {chart_result.get('error') if chart_result else 'No result'}")

                # Convert local file path to URL
                chart_url = None
                if chart_result.get("chart_url") and not chart_result.get("error"):
                    import os
                    filename = os.path.basename(chart_result["chart_url"])
                    chart_url = f"http://localhost:5001/api/chart/{filename}"
                    print(f"📸 Converted chart path to URL: {chart_url}")

                # Update tools_used
                tools_used[0]["source"] = "Chart-IMG API & AI Vision Analysis"
                tools_used[0]["chart_url"] = chart_url
                tools_used[0]["recommendation"] = chart_result.get("recommendation")
                
                # Build response with chart
                response = f"📊 **Chart Analysis: {symbol}**\n\n"

                if chart_result.get("error"):
                    response += f"❌ Error: {chart_result.get('error')}"
                else:
                    response += chart_result.get("analysis", "Analysis generated.")

                    if chart_url:
                        response += f"\n\n📈 [View Chart Image]({chart_url})"

                    recommendation = chart_result.get("recommendation", "HOLD")
                    if recommendation == "BUY":
                        response += f"\n\n🟢 **Recommendation: {recommendation}**"
                    elif recommendation == "SELL":
                        response += f"\n\n🔴 **Recommendation: {recommendation}**"
                    else:
                        response += f"\n\n🟡 **Recommendation: {recommendation}**"
                
                return {
                    "response": response,
                    "tools_used": tools_used,
                    "chart_url": chart_result.get("chart_url"),
                    "chart_analysis": chart_result.get("analysis")
                }
            
            elif function_name == "get_yield_pools":
                # Handle yield pools (existing logic)
                all_pools = DeFiLlamaYields.get_all_pools()
                if not all_pools:
                    return {"response": "Sorry, couldn't fetch yield data.", "tools_used": tools_used}

                # Apply filters from AI with smart defaults
                filtered_pools = all_pools

                # Default to Ethereum unless specified
                chain = function_args.get('chain', 'ethereum') or 'ethereum'
                if chain and chain != 'all':
                    filtered_pools = DeFiLlamaYields.filter_pools_by_chain(filtered_pools, chain)

                token = function_args.get('token')
                if token:
                    filtered_pools = DeFiLlamaYields.filter_pools_by_token(filtered_pools, token)

                # Default to safe pools (APY 7-15%, TVL 20M+)
                pool_type = function_args.get('pool_type', 'safe') or 'safe'
                min_tvl = function_args.get('min_tvl', 20000000) or 20000000

                if pool_type == 'safe':
                    # Safe pools: APY 7-15%, high TVL (20M+)
                    filtered_pools = DeFiLlamaYields.get_safe_pools(filtered_pools, min_tvl=min_tvl)
                elif pool_type == 'stablecoin':
                    filtered_pools = DeFiLlamaYields.get_stable_pools(filtered_pools, min_tvl=min_tvl)
                elif pool_type == 'high-apy':
                    filtered_pools = DeFiLlamaYields.get_top_pools_by_apy(filtered_pools, limit=10, min_tvl=min_tvl)
                else:
                    # Fallback to safe pools
                    filtered_pools = DeFiLlamaYields.get_safe_pools(filtered_pools, min_tvl=min_tvl)

                # Generate summary
                pool_summary = DeFiLlamaYields.get_pools_summary(filtered_pools)
                ai_analysis = YieldAnalyzer.analyze_pools_with_ai(asi_key, filtered_pools, message)

                final_response = pool_summary
                if ai_analysis:
                    final_response += f"\n\n**Analysis:**\n{ai_analysis}"
                final_response += f"\n\n---\n📡 **Data Sources:** DeFiLlama API (live) • ASI:One Mini (analysis)"

                # Create MeTTa knowledge graph
                metta_kb = YieldAnalyzer.create_metta_knowledge_base(filtered_pools)
                
                # Prepare pools data for UI
                pools_ui = []
                for pool in filtered_pools[:10]:
                    apy_base = pool.get('apy', 0) or 0
                    apy_reward = pool.get('apyReward', 0) or 0
                    apy_total = apy_base + apy_reward
                    
                    pools_ui.append({
                        "pool_id": pool.get('pool', ''),
                        "project": pool.get('project', 'Unknown'),
                        "chain": pool.get('chain', 'Unknown'),
                        "symbol": pool.get('symbol', 'Unknown'),
                        "apy_total": round(apy_total, 2),
                        "apy_base": round(apy_base, 2),
                        "apy_reward": round(apy_reward, 2),
                        "tvl": round(pool.get('tvlUsd', 0) or 0, 0),
                        "url": pool.get('url', ''),
                    })

                tools_used[0]["source"] = "DeFiLlama API"
                tools_used[0]["filters"] = function_args
                tools_used[0]["results_count"] = len(filtered_pools)

                response_data = {
                    "response": final_response,
                    "tools_used": tools_used,
                    "yield_pools": pools_ui
                }
                
                # Add MeTTa knowledge graph (always add, even if empty)
                if metta_kb and metta_kb.get('graph_data'):
                    response_data["metta_knowledge"] = {
                        "graph_data": metta_kb.get('graph_data'),
                        "safe_pools": metta_kb.get('safe_pools', []),
                        "facts_count": len(metta_kb.get('metta_facts', [])),
                        "rules_count": len(metta_kb.get('metta_rules', []))
                    }
                else:
                    # Create empty graph structure as fallback
                    print("⚠️ Warning: Could not create MeTTa knowledge base, using empty structure")
                    response_data["metta_knowledge"] = {
                        "graph_data": {"nodes": [], "edges": []},
                        "safe_pools": [],
                        "facts_count": 0,
                        "rules_count": 0
                    }
                
                return response_data

            elif function_name == "explain_transaction":
                # Let AI explain with context
                topic = function_args["topic"]

                ai_response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": f"You are Superio. Explain blockchain transactions clearly and concisely. Focus on: {topic}"},
                        {"role": "user", "content": message}
                    ],
                    model="asi1-mini",
                    max_tokens=500,
                    temperature=0.7
                )

                return {
                    "response": ai_response.choices[0].message.content,
                    "tools_used": tools_used
                }

        # No tool called - general conversation
        else:
            print(f"💬 AI responding without tools (general conversation)")

            # Track that we used the AI for general response
            tools_used.append({
                "name": "General Conversation",
                "source": "ASI:One Mini",
                "type": "direct_response"
            })

            return {
                "response": response_message.content,
                "tools_used": tools_used
            }

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

        return {
            "response": "Sorry, I encountered an error processing your request. Please try again.",
            "tools_used": [{"name": "Error Handler", "source": "System", "error": str(e)}]
        }
