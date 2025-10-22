'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-card border-2 border-border rounded w-fit">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        ></div>
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        ></div>
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        ></div>
      </div>
      <span className="text-xs text-muted-foreground">AI is thinking...</span>
    </div>
  );
}
