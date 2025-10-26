"""
Blockscout MCP Agent - Python client for Blockscout Model Context Protocol server
Provides blockchain data access for AI agents
"""

import os
import json
import httpx
from typing import Dict, Any, Optional, List
from urllib.parse import urljoin


class BlockscoutAgent:
    """Agent for interacting with Blockscout MCP server"""
    
    MCP_URL = os.getenv("BLOCKSCOUT_MCP_URL", "https://mcp.blockscout.com/mcp")
    
    def __init__(self):
        """Initialize the Blockscout MCP agent"""
        self.base_url = self.MCP_URL
        self.client = httpx.Client(timeout=60.0)
    
    def _call_mcp(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a JSON-RPC call to the MCP server (handles SSE streaming)
        
        Args:
            method: MCP tool name
            params: Parameters for the tool
        
        Returns:
            Response from the MCP server
        """
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": method,
                    "arguments": params
                },
                "id": 1
            }
            
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            response = self.client.post(
                self.base_url, 
                json=payload,
                headers=headers,
                follow_redirects=True,
                timeout=60.0
            )
            
            if response.status_code != 200:
                print(f"❌ HTTP Error: {response.status_code}")
                return {}
            
            # Parse SSE stream
            content_type = response.headers.get("content-type", "")
            
            if "text/event-stream" in content_type:
                # Parse SSE response
                return self._parse_sse_response(response.text)
            else:
                # Regular JSON response
                result = response.json()
                
                if "error" in result:
                    print(f"❌ MCP Error: {result['error']}")
                    return {}
                
                return result.get("result", {})
            
        except Exception as e:
            print(f"❌ Error calling MCP: {e}")
            return {}
    
    def _parse_sse_response(self, text: str) -> Dict[str, Any]:
        """
        Parse Server-Sent Events (SSE) response
        
        Args:
            text: SSE response text
        
        Returns:
            Parsed JSON-RPC result
        """
        lines = text.split('\n')
        result_data = None
        
        for line in lines:
            if line.startswith('data: '):
                data_str = line[6:]  # Remove 'data: ' prefix
                try:
                    data = json.loads(data_str)
                    
                    # Look for result with content
                    if "result" in data and "content" in data["result"]:
                        result_data = data
                    
                    # Look for error
                    if "error" in data:
                        print(f"❌ MCP Error: {data['error']}")
                        return {}
                        
                except json.JSONDecodeError:
                    pass
        
        if result_data and "result" in result_data:
            return result_data["result"]
        
        return {}
    
    def get_chains_list(self) -> List[Dict[str, Any]]:
        """Get list of all available chains"""
        result = self._call_mcp("get_chains_list", {})
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content
        
        return []
    
    def get_address_info(self, chain_id: str, address: str) -> Dict[str, Any]:
        """
        Get comprehensive information about an address
        
        Args:
            chain_id: Chain ID (e.g., "1" for Ethereum mainnet)
            address: Ethereum address
        
        Returns:
            Address information including balance, transaction count, etc.
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        result = self._call_mcp("get_address_info", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content
        
        return {}
    
    def get_tokens_by_address(self, chain_id: str, address: str) -> List[Dict[str, Any]]:
        """
        Get ERC20 token holdings for an address
        
        Args:
            chain_id: Chain ID
            address: Ethereum address
        
        Returns:
            List of token holdings
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        result = self._call_mcp("get_tokens_by_address", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content if isinstance(content, list) else []
        
        return []
    
    def get_transactions_by_address(
        self, 
        chain_id: str, 
        address: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transactions for an address
        
        Args:
            chain_id: Chain ID
            address: Ethereum address
            limit: Maximum number of transactions to return
        
        Returns:
            List of transactions
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        if limit:
            params["limit"] = limit
        
        result = self._call_mcp("get_transactions_by_address", params)
        
        if "content" in result and result["content"]:
            try:
                content_text = result["content"][0]["text"]
                content_data = json.loads(content_text)
                
                # Handle both direct array and nested data structure
                if isinstance(content_data, list):
                    return content_data
                elif isinstance(content_data, dict) and "data" in content_data:
                    # MCP returns data nested in a "data" field
                    data = content_data["data"]
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and "items" in data:
                        return data["items"]
                
                return []
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                print(f"❌ Error parsing transactions: {e}")
                return []
        
        return []
    
    def get_token_transfers_by_address(
        self,
        chain_id: str,
        address: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get ERC-20 token transfers for an address
        
        Args:
            chain_id: Chain ID
            address: Ethereum address
            limit: Maximum number of transfers to return
        
        Returns:
            List of token transfers
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        if limit:
            params["limit"] = limit
        
        result = self._call_mcp("get_token_transfers_by_address", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content if isinstance(content, list) else []
        
        return []
    
    def get_transaction_info(
        self,
        chain_id: str,
        transaction_hash: str,
        include_raw_input: bool = False
    ) -> Dict[str, Any]:
        """
        Get comprehensive transaction information
        
        Args:
            chain_id: Chain ID
            transaction_hash: Transaction hash
            include_raw_input: Whether to include raw input data
        
        Returns:
            Transaction information
        """
        params = {
            "chain_id": chain_id,
            "transaction_hash": transaction_hash,
            "includeRawInput": include_raw_input
        }
        
        result = self._call_mcp("get_transaction_info", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content
        
        return {}
    
    def transaction_summary(self, chain_id: str, transaction_hash: str) -> str:
        """
        Get a human-readable transaction summary
        
        Args:
            chain_id: Chain ID
            transaction_hash: Transaction hash
        
        Returns:
            Human-readable transaction summary
        """
        params = {
            "chain_id": chain_id,
            "transaction_hash": transaction_hash
        }
        
        result = self._call_mcp("transaction_summary", params)
        
        if "content" in result and result["content"]:
            text = result["content"][0].get("text", "")
            return text
        
        return "Could not generate transaction summary"
    
    def get_contract_abi(self, chain_id: str, address: str) -> Dict[str, Any]:
        """
        Get the ABI for a smart contract
        
        Args:
            chain_id: Chain ID
            address: Contract address
        
        Returns:
            Contract ABI
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        result = self._call_mcp("get_contract_abi", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content
        
        return {}
    
    def inspect_contract_code(self, chain_id: str, address: str) -> str:
        """
        Inspect a verified contract's source code
        
        Args:
            chain_id: Chain ID
            address: Contract address
        
        Returns:
            Contract source code
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        result = self._call_mcp("inspect_contract_code", params)
        
        if "content" in result and result["content"]:
            text = result["content"][0].get("text", "")
            return text
        
        return "No source code available"
    
    def get_nft_tokens_by_address(self, chain_id: str, address: str) -> List[Dict[str, Any]]:
        """
        Get NFT tokens owned by an address
        
        Args:
            chain_id: Chain ID
            address: Ethereum address
        
        Returns:
            List of NFT tokens
        """
        params = {
            "chain_id": chain_id,
            "address": address
        }
        
        result = self._call_mcp("nft_tokens_by_address", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content if isinstance(content, list) else []
        
        return []
    
    def lookup_token_by_symbol(
        self,
        chain_id: str,
        symbol: str,
        limit: Optional[int] = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for tokens by symbol
        
        Args:
            chain_id: Chain ID
            symbol: Token symbol (e.g., "ETH", "USDC")
            limit: Maximum number of results
        
        Returns:
            List of matching tokens
        """
        params = {
            "chain_id": chain_id,
            "symbol": symbol,
            "limit": limit or 10
        }
        
        result = self._call_mcp("lookup_token_by_symbol", params)
        
        if "content" in result and result["content"]:
            content = json.loads(result["content"][0]["text"])
            return content if isinstance(content, list) else []
        
        return []
    
    def get_address_by_ens_name(self, ens_name: str) -> Optional[str]:
        """
        Convert an ENS name to its Ethereum address
        
        Args:
            ens_name: ENS name (e.g., "vitalik.eth")
        
        Returns:
            Ethereum address or None
        """
        params = {
            "ens_name": ens_name
        }
        
        result = self._call_mcp("get_address_by_ens_name", params)
        
        if "content" in result and result["content"]:
            text = result["content"][0].get("text", "")
            # Parse the address from the response
            return text.strip() if text else None
        
        return None
    
    def _call_rest_api(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback: Call REST API endpoint
        
        Args:
            method: MCP tool name
            params: Parameters for the tool
        
        Returns:
            Response from the REST API
        """
        try:
            # Try REST API endpoint
            rest_url = f"{self.base_url.replace('/mcp', '/v1')}/{method}"
            
            response = self.client.post(
                rest_url,
                json=params,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 REST API Response status: {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            
            return {}
            
        except Exception as e:
            print(f"❌ Error calling REST API: {e}")
            return {}
    
    def __del__(self):
        """Cleanup on deletion"""
        if hasattr(self, 'client'):
            self.client.close()


# Test the agent
if __name__ == "__main__":
    print("🧪 Testing Blockscout MCP Agent on Ethereum Sepolia...")
    
    agent = BlockscoutAgent()
    
    # Ethereum Sepolia chain ID
    CHAIN_ID = "11155111"
    
    # Test: Get address info for a known Sepolia address
    print("\n1️⃣ Testing get_address_info...")
    address_info = agent.get_address_info(
        chain_id=CHAIN_ID,
        address="0x1234567890123456789012345678901234567890"  # Replace with actual Sepolia address
    )
    if address_info:
        print(f"✅ Got address info with {len(str(address_info))} characters")
    else:
        print("❌ Failed to get address info")
    
    # Test: Get transactions by address
    print("\n2️⃣ Testing get_transactions_by_address...")
    transactions = agent.get_transactions_by_address(
        chain_id=CHAIN_ID,
        address="0x1234567890123456789012345678901234567890",
        limit=5
    )
    print(f"Found {len(transactions) if isinstance(transactions, list) else 0} transactions")
    
    print("\n✅ Tests complete!")
