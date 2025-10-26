"""
Chat Summarizer Service - Creates and updates conversation summaries
"""
from typing import List, Dict
from openai import OpenAI
import os


class ChatSummarizer:
    """Service for summarizing chat conversations"""
    
    @staticmethod
    def generate_summary(messages: List[Dict], asi_client: OpenAI) -> str:
        """
        Generate a concise summary of the conversation
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            asi_client: OpenAI client configured for ASI
        
        Returns:
            A brief summary of the conversation
        """
        if not messages or len(messages) == 0:
            return "New conversation"
        
        # Take first and last few messages for context
        context_messages = []
        if len(messages) <= 4:
            context_messages = messages
        else:
            context_messages = messages[:2] + messages[-2:]
        
        # Create context string
        context = "\n".join([
            f"{msg['role']}: {msg['content'][:100]}..." if len(msg['content']) > 100 else f"{msg['role']}: {msg['content']}"
            for msg in context_messages
        ])
        
        # Create summary prompt
        summary_prompt = f"""Summarize this conversation in 3-6 words. Focus on the main topic or intent.

Conversation context:
{context}

Summary (be concise, avoid "conversation about"):"""

        try:
            response = asi_client.chat.completions.create(
                model="asi1-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates very brief, concise summaries of conversations. Return only the summary, no explanations."},
                    {"role": "user", "content": summary_prompt}
                ],
                temperature=0.3,
                max_tokens=20
            )
            
            summary = response.choices[0].message.content.strip()
            # Clean up summary
            summary = summary.replace('"', '').strip()
            if summary.lower().startswith('conversation'):
                summary = summary.replace('conversation about', '').replace('conversation', '').strip()
            return summary if summary else "New conversation"
            
        except Exception as e:
            print(f"❌ Error generating summary: {e}")
            return "New conversation"
    
    @staticmethod
    def update_summary_if_needed(
        wallet_address: str,
        message_count: int,
        db,
        asi_client: OpenAI
    ) -> str:
        """
        Update chat summary if message count reached a threshold
        
        Args:
            wallet_address: Wallet address
            message_count: Current number of messages
            db: Database instance
            asi_client: OpenAI client
        
        Returns:
            Updated summary
        """
        # Only summarize every 10 messages to avoid excessive API calls
        if message_count % 10 != 0 and message_count < 5:
            return None
        
        try:
            chat = db.get_chat_history(wallet_address)
            if not chat or not chat.get("messages"):
                return None
            
            messages = chat["messages"]
            summary = ChatSummarizer.generate_summary(messages, asi_client)
            
            # Update summary in database
            db.update_summary(wallet_address, summary)
            print(f"✅ Updated summary: {summary}")
            return summary
            
        except Exception as e:
            print(f"❌ Error updating summary: {e}")
            return None
    
    @staticmethod
    def create_context_string(recent_messages: List[Dict], max_chars: int = 500) -> str:
        """
        Create a context string from recent messages for AI prompting
        
        Args:
            recent_messages: List of recent message dicts
            max_chars: Maximum characters to include
        
        Returns:
            Context string for AI prompt
        """
        if not recent_messages:
            return ""
        
        context_parts = []
        char_count = 0
        
        # Build context, prioritizing recent messages
        for msg in reversed(recent_messages[-5:]):  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if char_count + len(content) > max_chars:
                break
            
            context_parts.insert(0, f"{role}: {content}")
            char_count += len(content)
        
        return "\n".join(context_parts)
