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
    from agents.blockscout_agent import BlockscoutAgent
    import os
    import json

    print(f"\n🤖 AI-driven request handling for: {message[:50]}...")

    # System prompt - tell AI what it can do
    system_prompt = """You are Superio, an advanced onchain intelligence AI assistant that helps users prepare blockchain transactions.

CRITICAL: When users ask to send, transfer, or pay tokens, you MUST call the send_token function to generate a signable transaction UI. Do NOT refuse or say you can't send - ALWAYS call the function to show them the transaction they can sign with their wallet.

Similarly, for swaps/exchanges, ALWAYS call swap_token to show the swap UI.

For chart analysis, ALWAYS call analyze_chart when user asks about charts, technical analysis, or trading signals. Use defaults: BINANCE exchange and 1D timeframe unless user specifies otherwise. DO NOT ask for more details - just analyze the chart immediately.

For swaps, when user says "swap X amount of TOKEN_A to TOKEN_B", ALWAYS call swap_token with from_token=TOKEN_A, to_token=TOKEN_B, from_amount=X. Extract the amount and tokens from the message. DO NOT ask for confirmation or additional details - just execute the swap!

Your capabilities:
- **send_token**: Prepare send/transfer transactions for wallet signing (ALWAYS use this for send requests)
- **swap_token**: Prepare token swap transactions for wallet signing (ALWAYS use this for swap requests)
- **analyze_chart**: Analyze cryptocurrency or stock charts (DEFAULT: BINANCE, 1D timeframe - use these if not specified)
- **lookup_transaction**: Look up and explain blockchain transactions on Ethereum Sepolia when user provides a transaction hash (ALWAYS use this for transaction hash lookups). After showing the detailed data, provide helpful context about what the transaction does, gas efficiency, token transfers, and any other notable details
- **analyze_address**: Get comprehensive on-chain analytics for an address (balance, transaction count, activity metrics)
- **get_address_tokens**: Get ERC-20 token holdings for an address
- **get_address_transactions**: Get transaction history for an address
- **get_crypto_info**: Get market data, prices, and analysis
- **get_yield_pools**: Find and analyze DeFi yield farming opportunities
- **explain_transaction**: Explain how blockchain transactions work in general
- **General conversation**: Answer questions naturally

IMPORTANT: For transaction requests (send/swap), you prepare the transaction - users sign it with their wallet. Always call the function! When users provide a transaction hash (0x...), ALWAYS use lookup_transaction to look it up! When users ask about an address or want on-chain analytics, use analyze_address!"""

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
                trading_agent = TradingAgent(chart_api_key=chart_api_key)
                
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
                    # Use environment variable for API URL, fallback to localhost
                    api_url = os.getenv("API_URL", "http://localhost:5001")
                    chart_url = f"{api_url}/api/chart/{filename}"
                    print(f"📸 Converted chart path to URL: {chart_url}")

                # Update tools_used
                tools_used[0]["source"] = "Chart-IMG API & AI Vision Analysis"
                tools_used[0]["chart_url"] = chart_url
                tools_used[0]["recommendation"] = chart_result.get("recommendation")
                
                # Build response with chart (remove link, chart will be embedded via chart_url field)
                response = f"📊 **Chart Analysis: {symbol}**\n\n"

                if chart_result.get("error"):
                    response += f"❌ Error: {chart_result.get('error')}"
                else:
                    response += chart_result.get("analysis", "Analysis generated.")

                    # Don't add link here - chart will be displayed via chart_url in the UI
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
            
            elif function_name == "lookup_transaction":
                # Handle transaction lookup using Blockscout agent
                transaction_hash = function_args.get("transaction_hash", "").strip()
                
                if not transaction_hash or not transaction_hash.startswith("0x"):
                    return {
                        "response": "Invalid transaction hash. Please provide a valid Ethereum transaction hash (starting with 0x).",
                        "tools_used": tools_used
                    }
                
                # Use Ethereum Sepolia testnet
                chain_id = "11155111"  # Ethereum Sepolia
                
                print(f"🔍 Looking up transaction {transaction_hash} on Sepolia...")
                
                # Initialize Blockscout agent
                blockscout_agent = BlockscoutAgent()
                
                try:
                    # Get detailed transaction info first
                    tx_info = blockscout_agent.get_transaction_info(
                        chain_id=chain_id,
                        transaction_hash=transaction_hash,
                        include_raw_input=False
                    )
                    
                    # Get human-readable summary
                    try:
                        summary = blockscout_agent.transaction_summary(chain_id, transaction_hash)
                        # Parse the summary JSON
                        if isinstance(summary, str):
                            summary_data = json.loads(summary)
                        else:
                            summary_data = summary
                        
                        # Extract readable summary text
                        readable_summary = ""
                        if summary_data and "data" in summary_data and "summary" in summary_data["data"]:
                            summary_list = summary_data["data"]["summary"]
                            if summary_list and len(summary_list) > 0:
                                template = summary_list[0].get("summary_template", "")
                                vars_dict = summary_list[0].get("summary_template_variables", {})
                                
                                # Replace variables in template
                                readable_summary = template
                                for key, value_info in vars_dict.items():
                                    if isinstance(value_info, dict) and "value" in value_info:
                                        value = value_info["value"]
                                        if isinstance(value, dict):
                                            if "hash" in value:
                                                value = value["hash"]  # Use address hash
                                            elif "ens_domain_name" in value and value.get("ens_domain_name"):
                                                value = value["ens_domain_name"]  # Use ENS name
                                        readable_summary = readable_summary.replace(f"{{{key}}}", str(value))
                                
                                # Replace any remaining unmatched variables
                                readable_summary = readable_summary.replace("{native}", "ETH").replace("{to_address}", "(address)")
                    except Exception as e:
                        print(f"⚠️ Could not parse summary: {e}")
                        readable_summary = "Transaction summary unavailable"
                    
                    # Build comprehensive response
                    response_text = f"📋 **Transaction Analysis**\n\n"

                    if readable_summary:
                        response_text += f"**Summary:** {readable_summary}\n\n"

                    if tx_info:
                        response_text += f"**Transaction Hash:** `{transaction_hash}`\n\n"

                        # Status and confirmations
                        if "status" in tx_info:
                            status = tx_info["status"]
                            status_emoji = "✅" if status == "ok" else "❌"
                            response_text += f"**Status:** {status_emoji} {status.upper()}\n"

                        if "confirmations" in tx_info:
                            confirmations = tx_info["confirmations"]
                            response_text += f"**Confirmations:** {confirmations:,}\n"

                        if "block_number" in tx_info:
                            response_text += f"**Block:** #{tx_info['block_number']:,}\n"

                        response_text += "\n"

                        # Transaction details
                        if "from" in tx_info:
                            from_addr = tx_info['from']
                            from_hash = from_addr.get('hash', from_addr) if isinstance(from_addr, dict) else from_addr
                            response_text += f"**From:** `{from_hash}`\n"

                        if "to" in tx_info:
                            to_addr = tx_info['to']
                            to_hash = to_addr.get('hash', to_addr) if isinstance(to_addr, dict) else to_addr
                            is_contract = to_addr.get('is_contract', False) if isinstance(to_addr, dict) else False
                            contract_indicator = " 📝 (Contract)" if is_contract else ""
                            response_text += f"**To:** `{to_hash}`{contract_indicator}\n"

                        if "value" in tx_info:
                            # Convert wei to ETH
                            value_wei = int(tx_info['value']) if tx_info['value'] else 0
                            value_eth = value_wei / 1e18
                            response_text += f"**Value:** {value_eth:.6f} ETH\n"

                        response_text += "\n"

                        # Gas and fees
                        if "gas_limit" in tx_info:
                            response_text += f"**Gas Limit:** {int(tx_info['gas_limit']):,}\n"

                        if "gas_used" in tx_info:
                            gas_used = int(tx_info.get('gas_used', 0))
                            gas_limit = int(tx_info.get('gas_limit', gas_used))
                            gas_percent = (gas_used / gas_limit * 100) if gas_limit > 0 else 0
                            response_text += f"**Gas Used:** {gas_used:,} ({gas_percent:.1f}% of limit)\n"

                        if "gas_price" in tx_info:
                            gas_price = int(tx_info.get('gas_price', 0))
                            gas_price_gwei = gas_price / 1e9
                            response_text += f"**Gas Price:** {gas_price_gwei:.2f} Gwei\n"

                        if "gas_used" in tx_info and "gas_price" in tx_info:
                            gas_used = int(tx_info.get('gas_used', 0))
                            gas_price = int(tx_info.get('gas_price', 0))
                            gas_cost_eth = (gas_used * gas_price) / 1e18
                            response_text += f"**Total Gas Cost:** {gas_cost_eth:.6f} ETH\n"

                        # Priority fee (if available)
                        if "max_priority_fee_per_gas" in tx_info or "priority_fee" in tx_info:
                            priority_fee = tx_info.get('max_priority_fee_per_gas') or tx_info.get('priority_fee', 0)
                            if priority_fee:
                                priority_fee_gwei = int(priority_fee) / 1e9
                                response_text += f"**Priority Fee:** {priority_fee_gwei:.2f} Gwei\n"

                        response_text += "\n"

                        # Transaction type and method
                        if "type" in tx_info:
                            tx_type = tx_info["type"]
                            response_text += f"**Type:** {tx_type}\n"

                        if "method" in tx_info and tx_info["method"]:
                            method = tx_info["method"]
                            response_text += f"**Method:** `{method}`\n"

                        # Nonce
                        if "nonce" in tx_info:
                            response_text += f"**Nonce:** {tx_info['nonce']}\n"

                        # Position in block
                        if "position" in tx_info:
                            response_text += f"**Position in Block:** {tx_info['position']}\n"

                        # Timestamp
                        if "timestamp" in tx_info:
                            timestamp = tx_info["timestamp"]
                            response_text += f"**Timestamp:** {timestamp}\n"

                        # Token transfers (if available)
                        if "token_transfers" in tx_info and tx_info["token_transfers"]:
                            response_text += f"\n**Token Transfers:** {len(tx_info['token_transfers'])} transfer(s)\n"
                            for i, transfer in enumerate(tx_info["token_transfers"][:3], 1):  # Show first 3
                                token_name = transfer.get('token', {}).get('name', 'Unknown')
                                token_symbol = transfer.get('token', {}).get('symbol', '???')
                                amount = transfer.get('total', {}).get('value', '0')
                                response_text += f"  {i}. {amount} {token_symbol} ({token_name})\n"
                            if len(tx_info["token_transfers"]) > 3:
                                response_text += f"  ... and {len(tx_info['token_transfers']) - 3} more\n"

                        # Revert reason (if failed)
                        if tx_info.get("status") != "ok" and "revert_reason" in tx_info:
                            response_text += f"\n⚠️ **Revert Reason:** {tx_info['revert_reason']}\n"

                    # Add contextual analysis
                    response_text += "\n---\n\n**💡 Analysis:**\n"

                    # Gas efficiency analysis
                    if "gas_used" in tx_info and "gas_limit" in tx_info:
                        gas_used = int(tx_info.get('gas_used', 0))
                        gas_limit = int(tx_info.get('gas_limit', 0))
                        gas_percent = (gas_used / gas_limit * 100) if gas_limit > 0 else 0

                        if gas_percent < 50:
                            response_text += "- **Gas Efficiency:** Excellent - transaction used less than 50% of the gas limit, indicating efficient execution.\n"
                        elif gas_percent < 80:
                            response_text += "- **Gas Efficiency:** Good - transaction used a reasonable amount of gas.\n"
                        elif gas_percent < 95:
                            response_text += "- **Gas Efficiency:** Moderate - transaction used most of the allocated gas.\n"
                        else:
                            response_text += "- **Gas Efficiency:** Low - transaction nearly exhausted the gas limit, which could indicate complex operations.\n"

                    # Transaction type insights
                    if tx_info.get("to", {}).get("is_contract") if isinstance(tx_info.get("to"), dict) else False:
                        response_text += "- **Type:** Smart contract interaction - this transaction executed code on a deployed contract.\n"
                        if tx_info.get("method"):
                            response_text += f"  - Called method: `{tx_info['method']}`\n"
                    else:
                        value_wei = int(tx_info.get('value', 0))
                        if value_wei > 0:
                            response_text += "- **Type:** Direct ETH transfer - simple value transfer between addresses.\n"
                        else:
                            response_text += "- **Type:** Zero-value transaction - possibly a contract call or data storage operation.\n"

                    # Token transfer insights
                    if "token_transfers" in tx_info and tx_info["token_transfers"]:
                        num_transfers = len(tx_info["token_transfers"])
                        if num_transfers == 1:
                            response_text += "- **Token Activity:** Single token transfer detected.\n"
                        else:
                            response_text += f"- **Token Activity:** Multiple token transfers ({num_transfers}) - possibly a swap or complex DeFi interaction.\n"

                    # Status insights
                    if tx_info.get("status") == "ok":
                        confirmations = tx_info.get("confirmations", 0)
                        if confirmations > 12:
                            response_text += "- **Security:** Transaction is well-confirmed and considered final.\n"
                        elif confirmations > 0:
                            response_text += f"- **Security:** Transaction has {confirmations} confirmations - generally safe but awaiting more confirmations for finality.\n"
                    else:
                        response_text += "- **Status:** ⚠️ Transaction failed - the operation was reverted. Check the revert reason above.\n"

                    tools_used[0]["source"] = "Blockscout MCP API"
                    tools_used[0]["chain_id"] = chain_id

                    return {
                        "response": response_text,
                        "tools_used": tools_used,
                        "transaction_info": tx_info
                    }
                    
                except Exception as e:
                    print(f"❌ Error looking up transaction: {e}")
                    import traceback
                    traceback.print_exc()
                    
                    return {
                        "response": f"⚠️ Failed to look up transaction. Error: {str(e)}\n\nThis could be because:\n1. The transaction hash is not on Ethereum Sepolia testnet\n2. The transaction doesn't exist\n3. There was a network error",
                        "tools_used": tools_used
                    }
                finally:
                    # Cleanup agent
                    del blockscout_agent
            
            elif function_name == "analyze_address":
                # Handle comprehensive address analysis
                address = function_args.get("address", "").strip()
                
                if not address or not address.startswith("0x"):
                    return {
                        "response": "Invalid address. Please provide a valid Ethereum address (starting with 0x).",
                        "tools_used": tools_used
                    }
                
                # Try multiple networks - check Sepolia first, then mainnet
                chains_to_try = [
                    {"id": "11155111", "name": "Ethereum Sepolia"},
                    {"id": "1", "name": "Ethereum Mainnet"}
                ]
                
                chain_id = None
                chain_name = None
                address_info = None
                
                for chain in chains_to_try:
                    blockscout_agent = BlockscoutAgent()
                    test_info = blockscout_agent.get_address_info(chain["id"], address)
                    
                    # Check if we got valid data
                    if test_info and 'data' in test_info and 'basic_info' in test_info['data']:
                        basic_info = test_info['data']['basic_info']
                        balance = basic_info.get('coin_balance', 0)
                        
                        # If there's balance or activity, use this chain
                        if balance and int(balance) > 0:
                            chain_id = chain["id"]
                            chain_name = chain["name"]
                            address_info = test_info
                            del blockscout_agent
                            break
                    
                    del blockscout_agent
                
                # Fallback to Sepolia if no data found
                if chain_id is None:
                    chain_id = "11155111"
                    chain_name = "Ethereum Sepolia"
                
                print(f"🔍 Analyzing address {address} on {chain_name}...")
                
                blockscout_agent = BlockscoutAgent()
                
                # Get address info if we didn't already fetch it
                if address_info is None:
                    address_info = blockscout_agent.get_address_info(chain_id, address)
                
                try:
                    # Get comprehensive address info
                    address_info = blockscout_agent.get_address_info(chain_id, address)
                    tokens = blockscout_agent.get_tokens_by_address(chain_id, address)
                    transactions = blockscout_agent.get_transactions_by_address(chain_id, address, limit=20)  # Get more for metrics
                    token_transfers = blockscout_agent.get_token_transfers_by_address(chain_id, address, limit=20)
                    
                    # Build comprehensive response
                    response_text = f"## 📊 **Address Analytics**\n\n"
                    response_text += f"**Address:** `{address}`\n"
                    response_text += f"**Network:** {chain_name}\n\n"
                    
                    # Basic info - extract from nested structure
                    if address_info and 'data' in address_info and 'basic_info' in address_info['data']:
                        basic_info = address_info['data']['basic_info']
                        balance_wei = basic_info.get('coin_balance', 0)
                        balance_eth = int(balance_wei) / 1e18 if balance_wei else 0
                        has_tokens = basic_info.get('has_tokens', False)
                        is_contract = basic_info.get('is_contract', False)
                        has_token_transfers = basic_info.get('has_token_transfers', False)
                        has_logs = basic_info.get('has_logs', False)
                        
                        # Calculate transaction counts
                        tx_count = len(transactions) if transactions else 0
                        token_tx_count = len(token_transfers) if token_transfers else 0
                        total_interactions = tx_count + token_tx_count
                        
                        response_text += "### 💰 **Balance**\n"
                        response_text += f"- Native Balance: **{balance_eth:.6f} ETH**\n"
                        response_text += f"- Address Type: {is_contract and '🤖 Smart Contract' or '👤 Wallet'}\n\n"
                        
                        # On-chain metrics and reputation score
                        response_text += "### 📊 **On-Chain Metrics**\n"
                        response_text += f"- Total Transactions: **{tx_count}**\n"
                        if token_tx_count > 0:
                            response_text += f"- Token Transfers: **{token_tx_count}**\n"
                        response_text += f"- Total Interactions: **{total_interactions}**\n"
                        response_text += f"- Unique Tokens Held: **{len(tokens) if tokens else 0}**\n\n"
                        
                        # Calculate reputation score
                        reputation_score = 0
                        reputation_factors = []
                        
                        if balance_eth > 0:
                            reputation_score += 10
                            reputation_factors.append("💰 Has ETH balance")
                        if tx_count > 10:
                            reputation_score += 20
                            reputation_factors.append("🔹 Active trader (10+ txs)")
                        elif tx_count > 0:
                            reputation_score += 10
                            reputation_factors.append("🔸 Some transaction history")
                        if token_tx_count > 20:
                            reputation_score += 20
                            reputation_factors.append("🪙 Token power user")
                        elif token_tx_count > 0:
                            reputation_score += 10
                            reputation_factors.append("🔸 Token activity")
                        if len(tokens) > 10:
                            reputation_score += 15
                            reputation_factors.append("💎 Diverse token portfolio")
                        elif len(tokens) > 0:
                            reputation_score += 10
                            reputation_factors.append("🪙 Token holder")
                        if has_logs:
                            reputation_score += 10
                            reputation_factors.append("📡 DeFi user")
                        
                        # Cap score at 100
                        reputation_score = min(reputation_score, 100)
                        
                        # Determine reputation tier
                        if reputation_score >= 80:
                            tier = "🏆 Elite"
                            tier_desc = "Highly active and established on-chain"
                        elif reputation_score >= 60:
                            tier = "🌟 Veteran"
                            tier_desc = "Experienced on-chain participant"
                        elif reputation_score >= 40:
                            tier = "⭐ Active"
                            tier_desc = "Regular on-chain activity"
                        elif reputation_score >= 20:
                            tier = "📈 Emerging"
                            tier_desc = "Building on-chain presence"
                        else:
                            tier = "🆕 New"
                            tier_desc = "New or inactive address"
                        
                        response_text += "### 🏅 **On-Chain Reputation**\n"
                        response_text += f"- **Tier:** {tier} ({tier_desc})\n"
                        response_text += f"- **Score:** {reputation_score}/100\n"
                        
                        if reputation_factors:
                            response_text += f"- **Contributing Factors:**\n"
                            for factor in reputation_factors[:5]:  # Show top 5
                                response_text += f"  • {factor}\n"
                        
                        response_text += "\n"
                        
                        # Activity indicators
                        response_text += "### 🎯 **Activity Indicators**\n"
                        activity_items = []
                        if has_tokens:
                            activity_items.append("✅ Holds ERC-20 Tokens")
                        if has_token_transfers:
                            activity_items.append("✅ Token Transfer Activity")
                        if has_logs:
                            activity_items.append("✅ Smart Contract Interactions")
                        if not activity_items:
                            activity_items.append("ℹ️ No recent activity detected")
                        
                        for item in activity_items:
                            response_text += f"- {item}\n"
                        response_text += "\n"
                    
                    # Token holdings with proper formatting
                    if tokens and len(tokens) > 0:
                        response_text += f"### 🪙 **Token Holdings** ({len(tokens)} tokens)\n\n"
                        for i, token in enumerate(tokens[:10], 1):  # Show top 10
                            symbol = token.get('symbol', 'N/A')
                            name = token.get('name', 'Unknown Token')
                            balance = token.get('balance', 0)
                            decimals = token.get('decimals', 18)
                            value = int(balance) / (10 ** decimals) if balance else 0
                            
                            # Format large numbers
                            if value >= 1000000:
                                value_str = f"{value:,.2f}"
                            elif value >= 1:
                                value_str = f"{value:,.4f}"
                            else:
                                value_str = f"{value:.6f}"
                            
                            response_text += f"{i}. **{symbol}** ({name})\n"
                            response_text += f"   Balance: `{value_str}`\n\n"
                    else:
                        response_text += "### 🪙 **Token Holdings**\n"
                        response_text += "- No ERC-20 tokens detected\n\n"
                    
                    # Recent transaction activity
                    if transactions and len(transactions) > 0:
                        response_text += f"### 📜 **Recent Transaction History** ({len(transactions)} shown)\n\n"
                        for i, tx in enumerate(transactions[:5], 1):
                            tx_hash = tx.get('hash', '')
                            block_number = tx.get('block_number', 'N/A')
                            timestamp = tx.get('timestamp', '')
                            
                            # Try to get value
                            value_wei = tx.get('value', 0)
                            value_eth = int(value_wei) / 1e18 if value_wei else 0
                            
                            response_text += f"{i}. **Transaction** `{tx_hash[:16]}...`\n"
                            if block_number != 'N/A':
                                response_text += f"   Block: {block_number}\n"
                            if value_eth > 0:
                                response_text += f"   Value: {value_eth:.6f} ETH\n"
                            response_text += "\n"
                    else:
                        response_text += "### 📜 **Transaction History**\n"
                        response_text += "- No recent transactions found\n\n"
                    
                    tools_used[0]["source"] = "Blockscout MCP API"
                    tools_used[0]["chain_id"] = chain_id
                    
                    return {
                        "response": response_text,
                        "tools_used": tools_used,
                        "address_info": address_info,
                        "token_count": len(tokens) if tokens else 0
                    }
                    
                except Exception as e:
                    print(f"❌ Error analyzing address: {e}")
                    import traceback
                    traceback.print_exc()
                    
                    return {
                        "response": f"⚠️ Failed to analyze address. Error: {str(e)}",
                        "tools_used": tools_used
                    }
                finally:
                    del blockscout_agent
            
            elif function_name == "get_address_tokens":
                # Handle token holdings query
                address = function_args.get("address", "").strip()
                
                if not address or not address.startswith("0x"):
                    return {
                        "response": "Invalid address. Please provide a valid Ethereum address (starting with 0x).",
                        "tools_used": tools_used
                    }
                
                chain_id = "11155111"
                blockscout_agent = BlockscoutAgent()
                
                try:
                    tokens = blockscout_agent.get_tokens_by_address(chain_id, address)
                    
                    if not tokens or len(tokens) == 0:
                        return {
                            "response": f"No ERC-20 tokens found for address {address} on Sepolia.",
                            "tools_used": tools_used
                        }
                    
                    response_text = f"💰 **Token Holdings for {address}:**\n\n"
                    for token in tokens:
                        symbol = token.get('symbol', 'N/A')
                        name = token.get('name', 'Unknown')
                        balance = token.get('balance', 0)
                        decimals = token.get('decimals', 18)
                        value = int(balance) / (10 ** decimals) if balance else 0
                        response_text += f"**{symbol}** ({name})\n"
                        response_text += f"  Balance: {value:,.6f}\n\n"
                    
                    tools_used[0]["source"] = "Blockscout MCP API"
                    
                    return {
                        "response": response_text,
                        "tools_used": tools_used,
                        "token_count": len(tokens)
                    }
                    
                except Exception as e:
                    print(f"❌ Error getting tokens: {e}")
                    return {
                        "response": f"⚠️ Failed to get token holdings. Error: {str(e)}",
                        "tools_used": tools_used
                    }
                finally:
                    del blockscout_agent
            
            elif function_name == "get_address_transactions":
                # Handle transaction history query
                address = function_args.get("address", "").strip()
                limit = function_args.get("limit", 10)
                
                if not address or not address.startswith("0x"):
                    return {
                        "response": "Invalid address. Please provide a valid Ethereum address (starting with 0x).",
                        "tools_used": tools_used
                    }
                
                chain_id = "11155111"
                blockscout_agent = BlockscoutAgent()
                
                try:
                    transactions = blockscout_agent.get_transactions_by_address(chain_id, address, limit=limit)
                    
                    if not transactions or len(transactions) == 0:
                        return {
                            "response": f"No transactions found for address {address} on Sepolia.",
                            "tools_used": tools_used
                        }
                    
                    response_text = f"📜 **Transaction History for {address}:**\n\n"
                    for i, tx in enumerate(transactions[:limit], 1):
                        tx_hash = tx.get('hash', '')[:16] + "..."
                        from_addr = tx.get('from', '')[:10] + "..."
                        to_addr = tx.get('to', '')[:10] + "..." if tx.get('to') else "Contract"
                        response_text += f"{i}. `{tx_hash}`\n"
                        response_text += f"   From: {from_addr} → To: {to_addr}\n\n"
                    
                    tools_used[0]["source"] = "Blockscout MCP API"
                    
                    return {
                        "response": response_text,
                        "tools_used": tools_used,
                        "transaction_count": len(transactions)
                    }
                    
                except Exception as e:
                    print(f"❌ Error getting transactions: {e}")
                    return {
                        "response": f"⚠️ Failed to get transaction history. Error: {str(e)}",
                        "tools_used": tools_used
                    }
                finally:
                    del blockscout_agent
            
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
