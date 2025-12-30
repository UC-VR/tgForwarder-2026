from telethon import TelegramClient, events
from telethon.sessions import StringSession
import os
import asyncio
import logging
from backend.config import settings
from backend.telegram.handler import handle_new_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.session_string = settings.TELEGRAM_SESSION_STRING
        self.client = None
        
        # Ensure session directory exists if we fallback to file
        os.makedirs("sessions", exist_ok=True)

    async def start(self):
        if not self.api_id or not self.api_hash:
            logger.warning("Telegram API credentials not found. Skipping Telegram client start.")
            return

        if self.session_string:
            logger.info("Initializing Telegram client with StringSession.")
            session = StringSession(self.session_string)
        else:
            logger.info("Initializing Telegram client with FileSession.")
            session = 'sessions/bot_session'

        self.client = TelegramClient(session, self.api_id, self.api_hash)

        # Register the event handler
        self.client.add_event_handler(handle_new_message, events.NewMessage(incoming=True))

        # Start the client
        try:
            await self.client.start()
            logger.info("Telegram client started and listening for messages!")
        except Exception as e:
            logger.error(f"Failed to start Telegram client: {e}")

    async def stop(self):
        if self.client:
            await self.client.disconnect()
            logger.info("Telegram client stopped.")

    async def send_message(self, chat_id: str, message: str):
        if not self.client:
             logger.error("Telegram client not initialized.")
             return
        
        try:
            # chat_id can be int or string (username)
            if chat_id.lstrip('-').isdigit():
                 entity = int(chat_id)
            else:
                 entity = chat_id
                 
            await self.client.send_message(entity, message)
        except Exception as e:
            logger.error(f"Error sending message to {chat_id}: {e}")

telegram_service = TelegramService()
