'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChatMessage, Message } from './message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { Button } from '@/components/ui/button';

export function ChatInterface() {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Superio, your advanced onchain intelligence AI assistant. I can help you with cryptocurrency analysis, DeFi insights, market data, and general conversation. Feel free to ask me anything!',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load chat history when wallet address is available
  useEffect(() => {
    if (!address) return;

    const loadChatHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/chat/history?wallet_address=${address}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            // Convert DB messages to frontend format
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
              id: `hist-${msg.timestamp || Date.now()}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              ...(msg.metadata?.swap_ui && { swap_ui: msg.metadata.swap_ui }),
              ...(msg.metadata?.send_ui && { send_ui: msg.metadata.send_ui }),
              ...(msg.metadata?.tools_used && { tools_used: msg.metadata.tools_used }),
              ...(msg.metadata?.yield_pools && { yield_pools: msg.metadata.yield_pools }),
              ...(msg.metadata?.metta_knowledge && { metta_knowledge: msg.metadata.metta_knowledge }),
            }));

            // Add welcome message at the start
            const welcomeMessage: Message = {
              id: '1',
              role: 'assistant',
              content: `Welcome back! Continuing from: "${data.summary || 'previous conversation'}"`,
              timestamp: new Date(),
            };

            setMessages([welcomeMessage, ...loadedMessages]);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [address]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: files?.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call the DeFi chat API (backend will save messages to database)
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          user_id: address || 'web_user',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Create AI response message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        ...(data.swap_ui && { swap_ui: data.swap_ui }),
        ...(data.send_ui && { send_ui: data.send_ui }),
        ...(data.tools_used && { tools_used: data.tools_used }),
        ...(data.yield_pools && { yield_pools: data.yield_pools }),
        ...(data.metta_knowledge && { metta_knowledge: data.metta_knowledge }),
      };

      setMessages((prev) => [...prev, aiMessage]);
      // Note: Backend automatically saves messages to database
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again or check if the server is running.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    // Clear chat history from database
    if (address) {
      try {
        // Note: We'd need a DELETE endpoint for this
        // For now, just clear the UI
        console.log('Clearing chat for wallet:', address);
      } catch (e) {
        console.error('Failed to clear chat history:', e);
      }
    }

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
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
          <div>
            <h1 className="text-xl font-bold text-foreground">DeFi AI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {isTyping ? 'Analyzing...' : 'Multi-Agent + ASI:One Powered'}
            </p>
            {address && (
              <p className="text-xs text-primary font-mono mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleClearChat}>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </Button>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-background"
      >
        <div className="py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="px-4 py-2">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
}
