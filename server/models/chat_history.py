"""
Chat History Models for storing user conversations
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class ChatHistory(BaseModel):
    """Chat history for a user"""
    wallet_address: str
    summary: str  # Brief summary of the conversation
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None


class ChatHistoryResponse(BaseModel):
    """Response with chat history"""
    wallet_address: str
    summary: str
    message_count: int
    created_at: datetime
    updated_at: datetime


class CreateChatRequest(BaseModel):
    """Request to create new chat"""
    wallet_address: str
    summary: str = "New conversation"
    initial_message: Optional[Dict[str, Any]] = None


class AddMessageRequest(BaseModel):
    """Request to add message to chat"""
    wallet_address: str
    role: str  # 'user' or 'assistant'
    content: str
    metadata: Optional[Dict[str, Any]] = None


class UpdateSummaryRequest(BaseModel):
    """Request to update chat summary"""
    wallet_address: str
    summary: str


def create_timestamp() -> datetime:
    """Create current timestamp"""
    return datetime.utcnow()
