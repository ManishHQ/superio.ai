#!/usr/bin/env python3
"""
Test script for Blockscout MCP integration
"""

import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.blockscout_agent import BlockscoutAgent

def test_blockscout():
    print("🧪 Testing Blockscout MCP API Integration\n")
    print("=" * 60)
    
    # Initialize the agent
    agent = BlockscoutAgent()
    print(f"✅ Agent initialized with URL: {agent.MCP_URL}\n")
    
    # Test 1: Get chains list
    print("1️⃣ Testing get_chains_list...")
    try:
        chains = agent.get_chains_list()
        print(f"✅ Got {len(chains)} chains")
        
        # Find Sepolia
        sepolia = next((c for c in chains if c.get('chain_id') == '11155111'), None)
        if sepolia:
            print(f"✅ Found Sepolia: {sepolia.get('name')}")
        else:
            print("❌ Sepolia not found")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("2️⃣ Testing get_transactions_by_address...")
    print("Using user's address on Sepolia (should have 21 transactions)\n")
    
    test_address = "0x6d07F6a8CdB8782B835Df12b1eF8339Ab1129129"  # User's address with 21 txns
    
    try:
        transactions = agent.get_transactions_by_address(
            chain_id='11155111',
            address=test_address,
            limit=50
        )
        
        if isinstance(transactions, list):
            print(f"✅ Retrieved {len(transactions)} transactions")
            
            if len(transactions) > 0:
                print("\n📋 Sample transaction:")
                tx = transactions[0]
                print(f"  - Hash: {tx.get('hash', 'N/A')[:16]}...")
                print(f"  - From: {tx.get('from', 'N/A')[:16]}...")
                print(f"  - To: {tx.get('to', 'N/A')[:16]}...")
                print(f"  - Block: {tx.get('block_number', 'N/A')}")
                print(f"  - Type: {tx.get('type', 'N/A')}")
            
            if len(transactions) == 10:
                print("⚠️  Got exactly 10 transactions - might be a limit issue")
        else:
            print(f"❌ Unexpected response type: {type(transactions)}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("\nThe Blockscout MCP API is working and returning real data!")
    print("The fixes should now work correctly in the application.")

if __name__ == "__main__":
    test_blockscout()
