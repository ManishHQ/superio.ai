'use client';

import { useState } from 'react';

interface Activity {
  id: string;
  type: 'chat' | 'file_upload' | 'setting_change';
  title: string;
  description: string;
  timestamp: Date;
}

export default function ActivitiesPage() {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'chat',
      title: 'Started new chat',
      description: 'Getting started with AI',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      type: 'file_upload',
      title: 'Uploaded file',
      description: 'document.pdf (2.4 MB)',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      type: 'chat',
      title: 'Continued conversation',
      description: 'Help with code review',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '4',
      type: 'setting_change',
      title: 'Updated profile',
      description: 'Changed display preferences',
      timestamp: new Date(Date.now() - 172800000),
    },
  ]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'chat':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'file_upload':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'setting_change':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Activity Log</h1>
        <p className="text-muted-foreground">Track your recent interactions and changes</p>
      </div>

      <div className="bg-card border-2 border-border rounded-lg shadow-xl overflow-hidden">
        <div className="divide-y-2 divide-border">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-secondary transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-foreground mb-2">No activities yet</h3>
            <p className="text-muted-foreground">Your activity history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
