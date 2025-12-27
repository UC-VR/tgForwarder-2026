from telethon import TelegramClient
import os
import asyncio
from backend.config import settings

class TelegramService:
    def __init__(self):
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.client = None
        
        # Ensure session directory exists
        os.makedirs("sessions", exist_ok=True)

    async def start(self):
        if not self.api_id or not self.api_hash:
            print("Telegram API credentials not found. Skipping Telegram client start.")
            return

        self.client = TelegramClient('sessions/bot_session', self.api_id, self.api_hash)
        await self.client.start()
        print("Telegram client started!")

    async def stop(self):
        if self.client:
            await self.client.disconnect()
            print("Telegram client stopped.")

    async def send_message(self, chat_id: str, message: str):
        if not self.client:
             print("Telegram client not initialized.")
             return
        
        try:
            # chat_id can be int or string (username)
            if chat_id.lstrip('-').isdigit():
                 entity = int(chat_id)
            else:
                 entity = chat_id
                 
            await self.client.send_message(entity, message)
        except Exception as e:
            print(f"Error sending message to {chat_id}: {e}")

telegram_service = TelegramService()
