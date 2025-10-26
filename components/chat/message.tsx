'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SendTransaction } from './send-transaction';
import { API_ENDPOINTS } from '@/lib/config';

export interface SwapUI {
  from_token: string;
  from_token_name: string;
  from_amount: number;
  to_token: string;
  to_token_name: string;
  to_amount: number;
  exchange_rate: number;
  slippage: number;
  estimated_gas: number;
}

export interface SendUI {
  token: string;
  token_name: string;
  amount: number;
  to_address: string;
  network: string;
  estimated_gas: number;
  gas_symbol: string;
  total_cost?: number;
}

export interface ToolUsed {
  name: string;
  source: string;
  filters?: any;
  results_count?: number;
  chart_url?: string;
  recommendation?: string;
}

export interface YieldPool {
  pool_id: string;
  project: string;
  chain: string;
  symbol: string;
  apy_total: number;
  apy_base: number;
  apy_reward: number;
  tvl: number;
  url: string;
}

export interface MeTTaKnowledge {
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: { name: string; url: string; type: string }[];
  swap_ui?: SwapUI;
  send_ui?: SendUI;
  tools_used?: ToolUsed[];
  yield_pools?: YieldPool[];
}

interface MessageProps {
  message: Message;
}

export function ChatMessage({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 border-2 border-primary rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%] sm:max-w-[70%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-3 rounded border-2 bg-card',
            isUser
              ? 'border-primary bg-secondary'
              : 'border-border'
          )}
        >
          <div className="text-sm text-foreground prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                code: ({ children }) => <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-secondary p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3 italic mb-2">{children}</blockquote>,
                a: ({ href, children }) => <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Chart Images - Display prominently if present */}
          {message.tools_used && message.tools_used.some(tool => tool.chart_url) && (
            <div className="mt-4 space-y-3">
              {message.tools_used
                .filter(tool => tool.chart_url)
                .map((tool, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border-2 border-primary bg-background">
                    <div className="relative w-full">
                      <img
                        src={tool.chart_url}
                        alt="Chart Analysis"
                        className="w-full h-auto block"
                        onError={(e) => {
                          console.error('❌ Failed to load chart image from:', tool.chart_url);
                          console.error('Error details:', e);
                          // Don't hide, show error message
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          
                          // Create error message
                          let errorDiv = img.nextElementSibling as HTMLElement;
                          if (!errorDiv || !errorDiv.classList.contains('chart-error')) {
                            errorDiv = document.createElement('div');
                            errorDiv.className = 'chart-error p-6 text-center bg-destructive/10 border border-destructive rounded';
                            img.parentElement?.appendChild(errorDiv);
                          }
                          errorDiv.innerHTML = `
                            <div class="text-destructive font-semibold mb-2">Failed to load chart</div>
                            <div class="text-xs text-muted-foreground">URL: ${tool.chart_url}</div>
                            <div class="text-xs text-muted-foreground mt-1">Check browser console for details</div>
                          `;
                        }}
                        onLoad={(e) => {
                          console.log('✅ Chart image loaded successfully:', tool.chart_url);
                        }}
                      />
                    </div>
                    {tool.recommendation && (
                      <div className="px-4 py-2 bg-primary/10 border-t-2 border-primary flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Recommendation:</span>
                        <span className={cn(
                          "text-sm font-bold",
                          tool.recommendation === "BUY" && "text-green-500",
                          tool.recommendation === "SELL" && "text-red-500",
                          tool.recommendation === "HOLD" && "text-yellow-500"
                        )}>
                          {tool.recommendation}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded"
                >
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span className="text-xs text-foreground truncate">
                    {attachment.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tools Used Display - Only show for non-general conversations */}
          {message.tools_used && message.tools_used.length > 0 && 
           !message.tools_used.some(tool => tool.name === 'General Conversation') && (
            <div className="mt-3 p-3 bg-background border border-border rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="text-xs font-semibold text-muted-foreground">Data Sources Used</span>
              </div>
              {message.tools_used
                .filter(tool => tool.name !== 'General Conversation')
                .map((tool, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{tool.name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary">{tool.source}</span>
                        {tool.results_count !== undefined && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{tool.results_count} results</span>
                          </>
                        )}
                      </div>
                      {tool.filters && Object.keys(tool.filters).length > 0 && (
                        <div className="mt-1 text-muted-foreground">
                          Filters: {Object.entries(tool.filters)
                            .filter(([_, value]) => value && value !== 'all')
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </div>
                      )}
                      {/* Chart images are now displayed prominently above, so hide here */}
                      {tool.chart_url && (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          📊 Chart image displayed above
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Swap UI Component */}
          {message.swap_ui && (
            <div className="mt-4 p-4 bg-background border-2 border-primary rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-sm font-bold text-primary">Swap Preview</span>
              </div>

              {/* From Token */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{message.swap_ui.from_token}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{message.swap_ui.from_token_name}</div>
                      <div className="text-xs text-muted-foreground">{message.swap_ui.from_token}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{message.swap_ui.from_amount}</div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* To Token */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To (Estimated)</label>
                <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{message.swap_ui.to_token}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{message.swap_ui.to_token_name}</div>
                      <div className="text-xs text-muted-foreground">{message.swap_ui.to_token}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{message.swap_ui.to_amount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="pt-2 space-y-1 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium">1 {message.swap_ui.from_token} = {message.swap_ui.exchange_rate.toFixed(2)} {message.swap_ui.to_token}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Slippage Tolerance</span>
                  <span className="font-medium">{message.swap_ui.slippage}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Gas</span>
                  <span className="font-medium">{message.swap_ui.estimated_gas} SOL</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => alert('Swap functionality coming soon! This will integrate with your wallet.')}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors"
                >
                  Swap
                </button>
                <button
                  onClick={() => {/* Do nothing - just dismiss */}}
                  className="px-4 py-2 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Send UI Component */}
          {message.send_ui && <SendTransaction sendData={message.send_ui} />}

          {/* Yield Pools UI Component */}
          {message.yield_pools && message.yield_pools.length > 0 && (
            <div className="mt-4 p-4 bg-background border-2 border-primary rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-primary">Yield Pools</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {message.yield_pools.map((pool, idx) => (
                  <div key={idx} className="p-3 bg-card border border-border rounded-lg hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-primary">{pool.project}</span>
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">{pool.chain}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{pool.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{pool.apy_total.toFixed(2)}%</div>
                        <div className="text-xs text-muted-foreground">APY</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">Base:</span>
                        <span className="ml-1 font-medium">{pool.apy_base.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rewards:</span>
                        <span className="ml-1 font-medium">{pool.apy_reward.toFixed(2)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">TVL:</span>
                      <span className="font-medium">${pool.tvl.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => window.open(pool.url || '#', '_blank')}
                      className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 border-2 border-primary rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
