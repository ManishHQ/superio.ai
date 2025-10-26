'use client';

import { useState, useEffect } from 'react';
import { MeTTaKnowledgeGraph } from '@/components/metta-knowledge-graph';
import { Button } from '@/components/ui/button';

interface MeTTaKnowledge {
  graph_data: {
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      properties: Record<string, any>;
    }>;
    edges: Array<{
      from: string;
      to: string;
      relation: string;
    }>;
  };
  safe_pools?: string[];
  facts_count?: number;
  rules_count?: number;
}

export default function YieldGraphPage() {
  const [knowledgeGraph, setKnowledgeGraph] = useState<MeTTaKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Fetch yield pools and generate knowledge graph
    fetchYieldGraph();
  }, []);

  const fetchYieldGraph = async () => {
    try {
      setLoading(true);
      
      // Trigger the AI to fetch yield pools (which will generate MeTTa knowledge)
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'show me all safe yield pools with good TVL',
          user_id: 'web_user',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch yield data');
      }

      const data = await response.json();
      
      console.log('API Response:', data);
      
      // Check for metta_knowledge in response
      if (!data.metta_knowledge) {
        console.error('No metta_knowledge in response:', data);
        throw new Error('AI did not generate MeTTa knowledge graph. Try asking: "show me yield pools"');
      }
      
      if (!data.metta_knowledge.graph_data) {
        console.error('No graph_data in metta_knowledge:', data.metta_knowledge);
        throw new Error('MeTTa knowledge graph data is incomplete');
      }
      
      if (!data.metta_knowledge.graph_data.nodes || data.metta_knowledge.graph_data.nodes.length === 0) {
        console.error('No nodes in graph_data:', data.metta_knowledge.graph_data);
        throw new Error('Knowledge graph has no nodes');
      }
      
      setKnowledgeGraph(data.metta_knowledge);
      console.log('✅ Set knowledge graph with', data.metta_knowledge.graph_data.nodes.length, 'nodes');
    } catch (err) {
      console.error('Error fetching yield graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Yield Graph</h1>
            <p className="text-sm text-muted-foreground">
              Interactive MeTTa knowledge graph of DeFi pools, tokens, and chains
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => {
              setRefreshKey(prev => prev + 1);
              fetchYieldGraph();
            }}
            variant="outline"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </Button>
        </div>

        {/* Stats */}
        {knowledgeGraph && (
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-card border border-border rounded">
              <div className="text-xs text-muted-foreground">Total Nodes</div>
              <div className="text-lg font-bold text-primary">
                {knowledgeGraph.graph_data.nodes.length}
              </div>
            </div>
            <div className="px-4 py-2 bg-card border border-border rounded">
              <div className="text-xs text-muted-foreground">Relationships</div>
              <div className="text-lg font-bold text-primary">
                {knowledgeGraph.graph_data.edges.length}
              </div>
            </div>
            <div className="px-4 py-2 bg-card border border-border rounded">
              <div className="text-xs text-muted-foreground">Safe Pools</div>
              <div className="text-lg font-bold text-green-500">
                {knowledgeGraph.safe_pools?.length || 0}
              </div>
            </div>
            <div className="px-4 py-2 bg-card border border-border rounded">
              <div className="text-xs text-muted-foreground">MeTTa Facts</div>
              <div className="text-lg font-bold text-primary">
                {knowledgeGraph.facts_count || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-primary text-lg font-semibold mb-2">⚠️</p>
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground mb-4">
              The AI needs to use the yield tool to generate the graph. Make sure you're asking about yield pools.
            </p>
            <Button
              onClick={fetchYieldGraph}
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </Button>
          </div>
        </div>
      )}

      {knowledgeGraph && !loading && (
        <MeTTaKnowledgeGraph 
          graphData={knowledgeGraph.graph_data}
          safePools={knowledgeGraph.safe_pools || []}
        />
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-card border border-border rounded">
        <h3 className="font-bold mb-2 text-sm">How to use the Knowledge Graph:</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Click on nodes</strong> to see details and connections</li>
          <li><strong>Yellow circles</strong> = Yield pools</li>
          <li><strong>Blue circles</strong> = Tokens</li>
          <li><strong>Pink circles</strong> = Blockchains</li>
          <li><strong>Green outline</strong> = Safe pools (APY 7-15%, TVL &gt; $1M)</li>
          <li><strong>Lines</strong> show relationships (tokens in pools, pools on chains)</li>
        </ul>
      </div>
    </div>
  );
}
