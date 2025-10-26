'use client';

import { useMemo, useState, useCallback } from 'react';
import { GraphView } from 'react-digraph';

interface KnowledgeNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

interface KnowledgeEdge {
  from: string;
  to: string;
  relation: string;
}

interface MeTTaKnowledgeProps {
  graphData: {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
  };
  safePools?: string[];
}

// Define node types for react-digraph
const nodeTypes = [
  { type: 'token', shape: 'circle', background: '#0080ff', textFill: '#ffffff' },
  { type: 'pool', shape: 'circle', background: '#ffff00', textFill: '#000000' },
  { type: 'chain', shape: 'circle', background: '#ff0080', textFill: '#ffffff' },
  { type: 'safe', shape: 'circle', background: '#00ff41', textFill: '#000000' },
];

// Define edge types
const edgeTypes = [
  { type: 'isInPool', shapeType: 'bezier', edgeArrowType: 'arrowclosed', label: 'isInPool' },
  { type: 'onChain', shapeType: 'bezier', edgeArrowType: 'arrowclosed', label: 'onChain' },
];

export function MeTTaKnowledgeGraph({ graphData, safePools = [] }: MeTTaKnowledgeProps) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  // Convert our nodes to react-digraph format
  const nodes = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return [];
    }
    
    return graphData.nodes.map((node) => {
      const isSafe = safePools.includes(node.id);
      let nodeType = node.type;
      
      // Override type for safe pools
      if (node.type === 'pool' && isSafe) {
        nodeType = 'safe';
      }
      
      return {
        id: node.id,
        title: node.label || node.id,
        x: Math.random() * 800,
        y: Math.random() * 600,
        type: nodeType,
      };
    });
  }, [graphData?.nodes, safePools]);

  // Convert our edges to react-digraph format
  const edges = useMemo(() => {
    if (!graphData?.edges || graphData.edges.length === 0) {
      return [];
    }
    
    return graphData.edges.map((edge, index) => ({
      source: edge.from,
      target: edge.to,
      type: edge.relation || 'bezier',
      id: `edge-${index}`,
      handleText: edge.relation,
    }));
  }, [graphData?.edges]);

  // Handler for node selection
  const onSelectNode = useCallback((selectedNode: any) => {
    console.log('Selected node:', selectedNode);
    setSelectedNode(selectedNode);
  }, []);

  // Handler for edge selection
  const onSelectEdge = useCallback((selectedEdge: any) => {
    console.log('Selected edge:', selectedEdge);
  }, []);

  if (!graphData?.nodes || graphData.nodes.length === 0) {
    return (
      <div className="mt-4 p-4 bg-background border-2 border-primary rounded-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">📊</div>
            <p className="text-muted-foreground">No graph data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-background border-2 border-primary rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-sm font-bold text-primary">MeTTa Knowledge Graph</span>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Pool</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Token</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span>Chain</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Safe</span>
          </div>
        </div>
      </div>

      <div className="relative bg-card border border-border rounded overflow-hidden" style={{ height: '600px' }}>
        <GraphView
          nodeKey="id"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          selected={selectedNode}
          onSelectNode={onSelectNode}
          onSelectEdge={onSelectEdge}
          showGraphControls={true}
          minZoom={0.1}
          maxZoom={2}
          nodeSize={100}
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-card border border-border rounded text-xs text-muted-foreground">
        <strong className="text-foreground">How to use:</strong> Drag nodes • Scroll to zoom • Pan by dragging background • Click nodes for details
      </div>
    </div>
  );
}
