import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.telegram.handler import handle_new_message
from backend.models import Rule, DeliveryMethod

# Mock event
class MockEvent:
    def __init__(self, chat_id, text, message_id=123):
        self.chat_id = chat_id
        self.text = text
        self.id = message_id
        self.message = MagicMock() # The message object itself
        self.client = AsyncMock()

@pytest.mark.asyncio
async def test_handle_new_message_forward():
    # Setup
    chat_id = "12345"
    text = "Important message"
    event = MockEvent(chat_id, text)

    # Mock Rule Engine to return a rule
    rule = Rule(
        id=1,
        name="Test Rule",
        source=chat_id,
        destination="67890",
        delivery_method=DeliveryMethod.FORWARD.value,
        is_active=True
    )

    # Mock database session
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()

    # We use a generator for get_session mock
    async def mock_get_session():
        yield mock_session

    with patch('backend.telegram.handler.get_session', side_effect=mock_get_session):
        with patch('backend.telegram.handler.rule_engine.get_matching_rules', new_callable=AsyncMock) as mock_get_rules:
            mock_get_rules.return_value = [rule]

            await handle_new_message(event)

            # Verify forward_messages was called
            event.client.forward_messages.assert_called_once()
            args, _ = event.client.forward_messages.call_args
            assert args[0] == 67890 # Destination as int

            # Verify log added
            mock_session.add.assert_called()
            mock_session.commit.assert_called()

@pytest.mark.asyncio
async def test_handle_new_message_copy():
    # Setup
    chat_id = "12345"
    text = "Important message"
    event = MockEvent(chat_id, text)

    # Mock Rule Engine to return a rule
    rule = Rule(
        id=1,
        name="Test Rule",
        source=chat_id,
        destination="67890",
        delivery_method=DeliveryMethod.COPY.value,
        is_active=True
    )

    # Mock database session
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()

    async def mock_get_session():
        yield mock_session

    with patch('backend.telegram.handler.get_session', side_effect=mock_get_session):
        with patch('backend.telegram.handler.rule_engine.get_matching_rules', new_callable=AsyncMock) as mock_get_rules:
            mock_get_rules.return_value = [rule]

            await handle_new_message(event)

            # Verify send_message was called instead of forward_messages
            event.client.send_message.assert_called_once()
            event.client.forward_messages.assert_not_called()
            args, _ = event.client.send_message.call_args
            assert args[0] == 67890

            # Verify log added
            mock_session.add.assert_called()
            mock_session.commit.assert_called()

@pytest.mark.asyncio
async def test_handle_new_message_no_match():
    # Setup
    chat_id = "12345"
    text = "Spam"
    event = MockEvent(chat_id, text)

    mock_session = AsyncMock()

    async def mock_get_session():
        yield mock_session

    with patch('backend.telegram.handler.get_session', side_effect=mock_get_session):
        with patch('backend.telegram.handler.rule_engine.get_matching_rules', new_callable=AsyncMock) as mock_get_rules:
            mock_get_rules.return_value = []

            await handle_new_message(event)

            # Verify nothing happened
            event.client.forward_messages.assert_not_called()
            event.client.send_message.assert_not_called()
