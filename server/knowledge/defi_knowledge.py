"""
MeTTa Knowledge Base for DeFi Pools
Represents pools, tokens, and relationships as a knowledge graph
"""
from typing import List, Dict, Any, Optional
import re


class DeFiKnowledgeBase:
    """MeTTa-style knowledge representation for DeFi pools"""
    
    def __init__(self):
        self.facts = []
        self.rules = []
        self.entities = set()
        
    def add_pool(self, pool_data: Dict[str, Any]) -> List[str]:
        """
        Convert pool data to MeTTa facts
        Returns list of MeTTa statement strings
        """
        # Clean identifiers
        project_clean = re.sub(r'[^a-zA-Z0-9]', '_', pool_data.get('project', 'unknown'))
        symbol_clean = re.sub(r'[^a-zA-Z0-9]', '_', pool_data.get('symbol', 'unknown'))
        chain_clean = pool_data.get('chain', 'unknown').title()
        
        pool_id = f"pool_{project_clean}_{symbol_clean}"
        chain_id = f"chain_{chain_clean}"
        
        facts = []
        
        # Type declarations
        facts.append(f"(: {pool_id} Pool)")
        facts.append(f"(: {chain_id} Chain)")
        
        # Pool properties
        apy_total = pool_data.get('apy_total', 0)
        apy_base = pool_data.get('apy_base', 0)
        apy_reward = pool_data.get('apy_reward', 0)
        tvl = pool_data.get('tvl', 0)
        pool_address = pool_data.get('pool_id', '')
        
        facts.append(f"(hasAPY {pool_id} {apy_total:.2f})")
        facts.append(f"(hasAPYBase {pool_id} {apy_base:.2f})")
        facts.append(f"(hasAPYReward {pool_id} {apy_reward:.2f})")
        facts.append(f"(hasTVL {pool_id} {tvl:.0f})")
        facts.append(f"(onChain {pool_id} {chain_id})")
        facts.append(f"(hasPoolAddress {pool_id} \"{pool_address}\")")
        facts.append(f"(hasProject {pool_id} \"{pool_data.get('project', '')}\")")
        facts.append(f"(hasSymbol {pool_id} \"{pool_data.get('symbol', '')}\")")
        
        # Add token relationships
        tokens = self._extract_tokens(pool_data.get('symbol', ''))
        for token in tokens:
            token_id = f"token_{token.upper()}"
            facts.append(f"(: {token_id} Token)")
            facts.append(f"(isInPool {token_id} {pool_id})")
        
        self.facts.extend(facts)
        return facts
    
    def _extract_tokens(self, symbol: str) -> List[str]:
        """Extract individual tokens from pool symbol (e.g., 'USDC-SOL' -> ['USDC', 'SOL'])"""
        # Common separators
        separators = ['-', '_', '/', ' ']
        tokens = [symbol]
        
        for sep in separators:
            new_tokens = []
            for token in tokens:
                new_tokens.extend(token.split(sep))
            tokens = new_tokens
        
        # Clean and filter
        tokens = [t.strip().upper() for t in tokens if t.strip()]
        return tokens
    
    def add_safety_rules(self):
        """Add reasoning rules for identifying safe pools"""
        rules = [
            """
            (= (isSafePool $p)
               (and
                 (> (hasAPY $p) 7.0)
                 (< (hasAPY $p) 15.0)
                 (> (hasTVL $p) 1000000.0)))
            """,
            """
            (= (isHighRiskPool $p)
               (or
                 (> (hasAPY $p) 50.0)
                 (< (hasTVL $p) 100000.0)))
            """,
            """
            (= (hasStableCoins $p)
               (or
                 (isInPool token_USDC $p)
                 (isInPool token_USDT $p)
                 (isInPool token_DAI $p)))
            """,
        ]
        self.rules.extend(rules)
        return rules
    
    def query_pools_by_token(self, token_symbol: str) -> List[str]:
        """Query pools containing a specific token"""
        token_id = f"token_{token_symbol.upper()}"
        matching_pools = []
        
        for fact in self.facts:
            if f"(isInPool {token_id}" in fact:
                # Extract pool ID
                match = re.search(r'\(isInPool \w+ (pool_\w+)\)', fact)
                if match:
                    matching_pools.append(match.group(1))
        
        return matching_pools
    
    def query_safe_pools(self) -> List[str]:
        """Query pools that match safe criteria"""
        safe_pools = []
        
        for fact in self.facts:
            if fact.startswith("(hasAPY") and "Pool pool_" in fact:
                # Extract pool ID and APY
                match = re.search(r'\(hasAPY (pool_\w+) ([\d.]+)\)', fact)
                if match:
                    pool_id = match.group(1)
                    apy = float(match.group(2))
                    
                    # Get TVL
                    tvl = self._get_property(pool_id, "hasTVL")
                    
                    if 7.0 <= apy <= 15.0 and tvl >= 1000000.0:
                        safe_pools.append(pool_id)
        
        return safe_pools
    
    def _get_property(self, entity_id: str, property_name: str) -> Optional[float]:
        """Get a property value for an entity"""
        for fact in self.facts:
            if f"({property_name} {entity_id}" in fact:
                match = re.search(r'\([\w-]+ \w+ ([\d.]+)\)', fact)
                if match:
                    return float(match.group(1))
        return None
    
    def to_metta_string(self) -> str:
        """Convert knowledge base to MeTTa language string"""
        output = "; DeFi Knowledge Base\n\n"
        
        # Add type declarations
        output += "; Type Declarations\n"
        output += "(: Pool Type)\n"
        output += "(: Token Type)\n"
        output += "(: Chain Type)\n\n"
        
        # Add relationship declarations
        output += "; Relationship Declarations\n"
        output += "(: hasAPY (-> Pool Float))\n"
        output += "(: hasTVL (-> Pool Float))\n"
        output += "(: onChain (-> Pool Chain))\n"
        output += "(: isInPool (-> Token Pool))\n"
        output += "(: hasPoolAddress (-> Pool String))\n\n"
        
        # Add facts
        output += "; Facts\n"
        for fact in self.facts:
            output += f"{fact}\n"
        
        # Add rules
        output += "\n; Rules\n"
        for rule in self.rules:
            output += f"{rule}\n"
        
        return output
    
    def get_graph_data(self) -> Dict[str, Any]:
        """Extract nodes and edges for graph visualization"""
        nodes = []
        edges = []
        
        # Extract all entities
        entities = set()
        for fact in self.facts:
            # Find entities in facts
            matches = re.findall(r'(pool_\w+|token_\w+|chain_\w+)', fact)
            entities.update(matches)
        
        # Create nodes
        for entity in entities:
            node_type = "pool" if entity.startswith("pool_") else \
                       "token" if entity.startswith("token_") else "chain"
            
            # Get properties
            properties = {}
            for fact in self.facts:
                if entity in fact:
                    prop_match = re.search(r'\((\w+) ' + re.escape(entity) + r' (.+)\)', fact)
                    if prop_match:
                        prop_name = prop_match.group(1)
                        prop_value = prop_match.group(2).strip('"')
                        properties[prop_name] = prop_value
            
            nodes.append({
                "id": entity,
                "type": node_type,
                "label": entity.replace("_", " ").title(),
                "properties": properties
            })
        
        # Create edges from relationships
        for fact in self.facts:
            if "(isInPool token_" in fact:
                match = re.search(r'\(isInPool (token_\w+) (pool_\w+)\)', fact)
                if match:
                    edges.append({
                        "from": match.group(1),
                        "to": match.group(2),
                        "relation": "isInPool"
                    })
            
            if "(onChain pool_" in fact:
                match = re.search(r'\(onChain (pool_\w+) (chain_\w+)\)', fact)
                if match:
                    edges.append({
                        "from": match.group(1),
                        "to": match.group(2),
                        "relation": "onChain"
                    })
        
        return {
            "nodes": nodes,
            "edges": edges
        }

