import re
import logging
from typing import List, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import Rule

class RuleEngine:
    @staticmethod
    async def get_matching_rules(
        session: AsyncSession,
        source_chat_id: str,
        message_text: str
    ) -> List[Rule]:
        """
        Fetch active rules for the given source and evaluate filters against the message text.
        """
        # 1. Fetch active rules for the source
        statement = select(Rule).where(
            Rule.source == source_chat_id,
            Rule.is_active == True
        )
        result = await session.exec(statement)
        rules = result.all()

        matching_rules = []

        # 2. Evaluate filters in memory (for now, simpler than complex SQL JSON queries)
        for rule in rules:
            if RuleEngine.matches_filters(rule.filters, message_text):
                matching_rules.append(rule)
        
        return matching_rules

    @staticmethod
    def matches_filters(filters: Optional[dict], message_text: str) -> bool:
        """
        Check if message text matches the rule's filters.
        If no filters, it matches.
        """
        if not filters:
            return True
        
        # Pre-calculate lower case message once if needed for keyword/blacklist checks
        # We do this lazily or just check if keywords/blacklist exist.
        message_lower = None

        # Example filter: {"keywords": ["urgent", "alert"]}
        # Match if ANY keyword is present
        keywords = filters.get("keywords", [])
        if keywords:
            if message_lower is None:
                message_lower = message_text.lower()

            # If keywords is a list, check if any is in text
            if isinstance(keywords, list):
                if not any(k.lower() in message_lower for k in keywords):
                    return False
            # If keywords is a string (legacy/simple), check it
            elif isinstance(keywords, str):
                if keywords.lower() not in message_lower:
                    return False
        
        # Blacklist logic
        blacklist = filters.get("blacklist", [])
        if blacklist:
            if message_lower is None:
                message_lower = message_text.lower()

            # Check if any blacklisted word is in the message
            if any(b.lower() in message_lower for b in blacklist):
                return False

        # Regex logic
        regex_pattern = filters.get("regex")
        if regex_pattern:
            try:
                if not re.search(regex_pattern, message_text):
                    return False
            except re.error:
                # Log error or treat as non-match?
                # For safety, if regex is invalid, we return False (no match)
                logging.error(f"Invalid regex pattern: {regex_pattern}")
                return False

        return True

rule_engine = RuleEngine()
