"""
MongoDB database service for chat history
"""
import os
from pymongo import MongoClient
from typing import List, Optional, Dict, Any
from datetime import datetime
from models.chat_history import ChatHistory, ChatMessage


class ChatHistoryDB:
    """Database service for managing chat history"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        mongodb_uri = os.getenv('MONGODBURI')
        
        if not mongodb_uri:
            print("⚠️ Warning: MONGODBURI not set. Chat history will not be saved.")
            self.client = None
            self.db = None
            return
        
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client.get_database()
            self.collection = self.db.chat_history
            print("✅ Connected to MongoDB")
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {e}")
            self.client = None
            self.db = None
    
    def create_chat(self, wallet_address: str, summary: str = "New conversation", initial_message: Optional[Dict] = None) -> Optional[str]:
        """Create a new chat for a wallet address"""
        if not self.collection:
            print("⚠️ MongoDB not available")
            return None
        
        try:
            # Check if chat already exists
            existing = self.collection.find_one({"wallet_address": wallet_address})
            if existing:
                return str(existing["_id"])
            
            # Create new chat
            chat = {
                "wallet_address": wallet_address,
                "summary": summary,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "metadata": {}
            }
            
            # Add initial message if provided
            if initial_message:
                chat["messages"].append({
                    "role": initial_message.get("role", "user"),
                    "content": initial_message.get("content", ""),
                    "timestamp": datetime.utcnow(),
                    "metadata": initial_message.get("metadata")
                })
            
            result = self.collection.insert_one(chat)
            return str(result.inserted_id)
        except Exception as e:
            print(f"❌ Error creating chat: {e}")
            return None
    
    def add_message(self, wallet_address: str, role: str, content: str, metadata: Optional[Dict] = None) -> bool:
        """Add a message to the chat"""
        if not self.collection:
            print("⚠️ MongoDB not available")
            return False
        
        try:
            message = {
                "role": role,
                "content": content,
                "timestamp": datetime.utcnow(),
                "metadata": metadata or {}
            }
            
            # Create chat if it doesn't exist
            if not self.collection.find_one({"wallet_address": wallet_address}):
                self.create_chat(wallet_address)
            
            result = self.collection.update_one(
                {"wallet_address": wallet_address},
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error adding message: {e}")
            return False
    
    def get_chat_history(self, wallet_address: str) -> Optional[Dict]:
        """Get full chat history for a wallet"""
        if not self.collection:
            return None
        
        try:
            chat = self.collection.find_one({"wallet_address": wallet_address})
            if not chat:
                return None
            
            # Convert ObjectId to string
            chat["_id"] = str(chat["_id"])
            return chat
        except Exception as e:
            print(f"❌ Error getting chat history: {e}")
            return None
    
    def get_all_chats(self, wallet_address: str) -> List[Dict]:
        """Get all chats for a wallet (for future multi-chat support)"""
        if not self.collection:
            return []
        
        try:
            chats = list(self.collection.find({"wallet_address": wallet_address}))
            for chat in chats:
                chat["_id"] = str(chat["_id"])
            return chats
        except Exception as e:
            print(f"❌ Error getting all chats: {e}")
            return []
    
    def update_summary(self, wallet_address: str, summary: str) -> bool:
        """Update the chat summary"""
        if not self.collection:
            return False
        
        try:
            result = self.collection.update_one(
                {"wallet_address": wallet_address},
                {
                    "$set": {
                        "summary": summary,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Error updating summary: {e}")
            return False
    
    def delete_chat(self, wallet_address: str) -> bool:
        """Delete a chat"""
        if not self.collection:
            return False
        
        try:
            result = self.collection.delete_one({"wallet_address": wallet_address})
            return result.deleted_count > 0
        except Exception as e:
            print(f"❌ Error deleting chat: {e}")
            return False
    
    def get_recent_messages(self, wallet_address: str, limit: int = 10) -> List[Dict]:
        """Get recent messages for context"""
        if not self.collection:
            return []
        
        try:
            chat = self.collection.find_one({"wallet_address": wallet_address})
            if not chat or not chat.get("messages"):
                return []
            
            # Get last N messages
            messages = chat.get("messages", [])
            return messages[-limit:] if len(messages) > limit else messages
        except Exception as e:
            print(f"❌ Error getting recent messages: {e}")
            return []


# Global instance
db = ChatHistoryDB()
