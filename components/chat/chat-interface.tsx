'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Message } from './message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { Button } from '@/components/ui/button';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
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

    // Simulate AI typing
    setIsTyping(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${content}". This is a placeholder response. Backend integration will be added later.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleClearChat = () => {
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
            <h1 className="text-xl font-bold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
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
