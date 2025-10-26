# MeTTa Knowledge Graph for DeFi

## Overview

The MeTTa Knowledge Graph represents DeFi pools, tokens, and chains as a structured knowledge base using MeTTa-style facts and relationships.

## Architecture

### 1. **Knowledge Representation** (`server/knowledge/defi_knowledge.py`)

The `DeFiKnowledgeBase` class converts yield pool data into MeTTa facts:

**Types:**
- `Pool` - DeFi yield farming pools
- `Token` - Cryptocurrency tokens
- `Chain` - Blockchain networks

**Relationships:**
- `hasAPY` - Pool → APY value
- `hasTVL` - Pool → TVL value
- `onChain` - Pool → Chain
- `isInPool` - Token → Pool

**Example Facts:**
```metta
(: pool_aerodrome_usdc_sol Pool)
(hasAPY pool_aerodrome_usdc_sol 12.5)
(hasTVL pool_aerodrome_usdc_sol 5000000.0)
(onChain pool_aerodrome_usdc_sol chain_Base)
(isInPool token_USDC pool_aerodrome_usdc_sol)
(isInPool token_SOL pool_aerodrome_usdc_sol)
```

### 2. **Reasoning Rules**

The system includes safety rules:
```metta
(= (isSafePool $p)
   (and
     (> (hasAPY $p) 7.0)
     (< (hasAPY $p) 15.0)
     (> (hasTVL $p) 1000000.0)))
```

### 3. **Data Flow**

```
User queries yield pools
  ↓
DeFiLlama API fetches pool data
  ↓
DeFiKnowledgeBase converts to MeTTa facts
  ↓
Graph structure generated (nodes + edges)
  ↓
Returned to frontend as metta_knowledge
  ↓
Yield Graph page visualizes
```

## Usage

### Accessing the Yield Graph

1. Navigate to `/yield-graph` page
2. Or click "Yield Graph" in the sidebar
3. The page automatically fetches and displays the knowledge graph

### Using the Graph

- **Click nodes** to see details and connections
- **Yellow circles** = Yield pools
- **Blue circles** = Tokens
- **Pink circles** = Blockchains
- **Green outline** = Safe pools (APY 7-15%, TVL > $1M)
- **Lines** show relationships

### Querying MeTTa Knowledge

You can query the knowledge base:

```python
# Find all safe pools
safe_pools = kb.query_safe_pools()

# Find pools with a specific token
usdc_pools = kb.query_pools_by_token("USDC")

# Get graph data for visualization
graph_data = kb.get_graph_data()
```

## Investment Flow

### Current Implementation

1. User sees pools with "Invest" button
2. Clicks button → Opens external URL
3. User connects wallet on protocol site
4. User approves and deposits tokens

### Future Enhancement

Direct integration using wagmi:
```typescript
// Approve tokens
await approveToken(tokenAddress, amount);

// Deposit to pool
await depositToPool(poolAddress, amount);

// Track position
const position = await getPosition(poolAddress);
```

## Components

- **`DeFiKnowledgeBase`** - Python class for MeTTa facts
- **`MeTTaKnowledgeGraph`** - React component for visualization
- **`YieldGraphPage`** - Dedicated page at `/yield-graph`
- **Sidebar link** - Navigation to graph page

## Benefits

✅ **Structured Knowledge** - Pools, tokens, chains as entities  
✅ **Relationship Mapping** - See how tokens connect to pools  
✅ **Reasoning** - Rules identify safe pools  
✅ **Visualization** - Interactive graph exploration  
✅ **Scalable** - Easy to add new facts and rules  

