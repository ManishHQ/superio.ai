"use client";

import {useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";

interface Conversation {
    id: string;
    title: string;
    timestamp: Date;
}

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mock conversations data - will be replaced with real data later
    const [conversations] = useState<Conversation[]>([
        {id: "1", title: "Getting started with AI", timestamp: new Date(Date.now() - 3600000)},
        {id: "2", title: "Help with code review", timestamp: new Date(Date.now() - 7200000)},
        {id: "3", title: "Project planning discussion", timestamp: new Date(Date.now() - 86400000)},
        {id: "4", title: "Debug assistance needed", timestamp: new Date(Date.now() - 172800000)},
    ]);

    const menuItems = [
        {
            name: "Chat",
            href: "/chat",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            ),
        },
        {
            name: "Activities",
            href: "/activities",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            name: "Vault",
            href: "/vault",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
            ),
        },
        {
            name: "Swap",
            href: "/nexus",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                </svg>
            ),
        },
        {
            name: "Profile",
            href: "/profile",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            ),
        },
    ];

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-background transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                {!isCollapsed && <h1 className="text-lg font-bold text-foreground">AI Assistant</h1>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex-shrink-0"
                >
                    <svg
                        className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        />
                    </svg>
                </Button>
            </div>

            {/* New Chat Button */}
            <div className="px-3 pt-3 pb-3">
                <Link href="/chat">
                    <Button className="w-full justify-start gap-2 mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {!isCollapsed && <span>New Chat</span>}
                    </Button>
                </Link>
            </div>

            {/* Menu Items */}
            <nav className="px-3 pb-3">
                <div className="flex flex-col gap-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn("w-full justify-start gap-3", isActive && "text-primary")}
                                >
                                    {item.icon}
                                    {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Past Conversations */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-3 py-3">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
                        Past Conversations
                    </h2>
                    <div className="flex flex-col gap-2">
                        {conversations.map((conversation) => (
                            <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                                <Button variant="ghost" className="w-full justify-start h-auto py-2.5 px-3">
                                    <div className="flex items-start gap-2 w-full">
                                        <svg
                                            className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm text-foreground truncate">{conversation.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTimestamp(conversation.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* User Section */}
            <div className="px-3 py-3">
                <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                        <div className="w-8 h-8 border-2 border-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-foreground truncate">User Profile</p>
                                <p className="text-xs text-muted-foreground">View settings</p>
                            </div>
                        )}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
