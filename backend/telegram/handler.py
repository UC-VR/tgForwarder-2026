from telethon import events
from backend.services.rule_engine import rule_engine
from backend.database import get_session
from backend.models import Log
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_new_message(event):
    """
    Event handler for new messages.
    """
    # We can inspect event to see if it's incoming, outgoing, etc.
    # By default NewMessage handles incoming.
    
    sender_id = str(event.chat_id)
    # text might be None for media messages without caption
    message_text = event.text or "" 
    message_id = event.id
    
    # Simple debug log
    # logger.debug(f"Processing message {message_id} from {sender_id}")

    # Access DB session
    async for session in get_session():
        try:
            # 1. Evaluate rules
            matching_rules = await rule_engine.get_matching_rules(
                session, sender_id, message_text
            )
            
            if not matching_rules:
                # No rules matched
                return

            # 2. Process actions
            for rule in matching_rules:
                destination = rule.destination
                logger.info(f"Rule '{rule.name}' matched. Forwarding to {destination}")
                
                try:
                    # Prepare destination entity (int if numeric string)
                    dest_entity = destination
                    if destination.lstrip('-').isdigit():
                        dest_entity = int(destination)
                    
                    # Use forward_messages to preserve media/metadata
                    await event.client.forward_messages(dest_entity, event.message)
                    
                    # Log success
                    log_entry = Log(
                        rule_id=rule.id,
                        source_message_id=message_id,
                        status="forwarded",
                        details=f"Forwarded to {destination}"
                    )
                    session.add(log_entry)
                    
                except Exception as e:
                    logger.error(f"Failed to forward to {destination}: {e}")
                    log_entry = Log(
                        rule_id=rule.id,
                        source_message_id=message_id,
                        status="failed",
                        details=str(e)
                    )
                    session.add(log_entry)
            
            await session.commit()
            
        except Exception as e:
            logger.error(f"Error inside message handler: {e}")
        
        # We only need one session pass
        break
