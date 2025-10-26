'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

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

// Node color mapping
const NODE_COLORS: Record<string, string> = {
  token: '#3b82f6',    // Blue
  pool: '#eab308',     // Yellow
  chain: '#ec4899',    // Pink
  safe: '#22c55e',     // Green
};

export function MeTTaKnowledgeGraph({ graphData, safePools = [] }: MeTTaKnowledgeProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const graphRef = useRef<any>(null);

  // Convert to react-force-graph format
  const graphForceData = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    // Convert nodes
    const nodes = graphData.nodes.map((node) => {
      const isSafe = safePools.includes(node.id);
      let nodeType = node.type;

      // Override type for safe pools
      if (node.type === 'pool' && isSafe) {
        nodeType = 'safe';
      }

      return {
        id: node.id,
        name: node.label || node.id,
        type: nodeType,
        color: NODE_COLORS[nodeType] || '#6b7280',
        properties: node.properties,
      };
    });

    // Convert edges to links
    const links = graphData.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      relation: edge.relation,
    }));

    return { nodes, links };
  }, [graphData, safePools]);

  // Node click handler
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    console.log('Selected node:', node);
  }, []);

  // Node hover handler
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
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

      <div className="relative bg-black border-2 border-primary rounded overflow-hidden" style={{ height: '600px', width: '100%' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphForceData}
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          nodeRelSize={8}
          linkColor={() => 'rgba(117, 186, 117, 0.4)'}
          linkWidth={2}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          backgroundColor="#000000"
          nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px "Geist Mono", monospace`;

            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Add glow effect for selected/hovered nodes
            if (node === selectedNode || node === hoveredNode) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = node.color;
              ctx.strokeStyle = node.color;
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            // Draw label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#75ba75';
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'rgba(117, 186, 117, 0.5)';
            ctx.fillText(label, node.x, node.y + 15);
            ctx.shadowBlur = 0;
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="mt-4 p-3 bg-card border-2 border-primary rounded">
          <h4 className="font-bold text-sm mb-2 text-primary">Selected: {selectedNode.name}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Type:</span>
              <span className="capitalize">{selectedNode.type}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }}></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">ID:</span>
              <span className="font-mono text-xs">{selectedNode.id}</span>
            </div>
            {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="font-semibold mb-1">Properties:</div>
                <div className="pl-2 space-y-1">
                  {Object.entries(selectedNode.properties).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-card border border-border rounded text-xs text-muted-foreground">
        <strong className="text-foreground">How to use:</strong> Click and drag nodes to reposition • Scroll to zoom • Click nodes to see details • Pan by dragging the background
      </div>
    </div>
  );
}
