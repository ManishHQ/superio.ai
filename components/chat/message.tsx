'use client';

import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: { name: string; url: string; type: string }[];
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
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {message.content}
          </p>

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
        </div>

        <span className="text-xs text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
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
