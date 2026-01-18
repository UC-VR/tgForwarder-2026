import re
import logging
from typing import List, Optional, Dict, Any
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import Rule

logger = logging.getLogger(__name__)

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

        # 2. Evaluate filters logic tree
        for rule in rules:
            try:
                if RuleEngine.evaluate_logic_node(rule.filters, message_text):
                    matching_rules.append(rule)
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.id}: {e}")
                # Should we fail open or closed? Closed (don't match) seems safer.
        
        return matching_rules

    @staticmethod
    def evaluate_logic_node(node: Optional[Dict[str, Any]], text: str) -> bool:
        """
        Recursively evaluate a LogicNode against the message text.
        """
        # If no filters are defined, the rule applies to all messages.
        if not node:
            return True

        # Check if this is a LogicNode (has 'type') or legacy/simple dict
        if "type" not in node:
            # Fallback for simple dict filters (if any exist) or treat as match if empty
            if not node:
                return True
            # If it has keys like "keywords", treat as legacy
            if "keywords" in node or "blacklist" in node or "regex" in node:
                 return RuleEngine._matches_legacy_filters(node, text)
            return True

        node_type = node.get("type")

        if node_type == "group":
            return RuleEngine._evaluate_group(node, text)
        elif node_type == "condition":
            return RuleEngine._evaluate_condition(node, text)

        return True

    @staticmethod
    def _evaluate_group(node: Dict[str, Any], text: str) -> bool:
        operator = node.get("operator", "AND")
        children = node.get("children", [])

        # If group has no children, we treat it as True (pass-through)
        if not children:
            return True

        results = [RuleEngine.evaluate_logic_node(child, text) for child in children]

        if operator == "AND":
            return all(results)
        elif operator == "OR":
            return any(results)

        return False

    @staticmethod
    def _evaluate_condition(node: Dict[str, Any], text: str) -> bool:
        # Currently we primarily filter on message_text.
        # Future: check node.get("field") (e.g. "sender", "date")

        condition = node.get("condition", "contains")
        target_value = node.get("value", "")

        # Ensure we have strings
        text_str = str(text) if text is not None else ""
        target_str = str(target_value)
        
        # Case-insensitive comparison by default
        text_lower = text_str.lower()
        target_lower = target_str.lower()

        if condition == "contains":
            return target_lower in text_lower
        elif condition == "not_contains":
            return target_lower not in text_lower
        elif condition == "equals":
            return text_lower == target_lower
        elif condition == "starts_with":
            return text_lower.startswith(target_lower)
        elif condition == "ends_with":
            return text_lower.endswith(target_lower)
        elif condition == "regex":
            try:
                # Regex is usually case-sensitive unless specified, but user expectation might vary.
                # We'll use case-insensitive matching to be consistent with others.
                return bool(re.search(target_str, text_str, re.IGNORECASE))
            except re.error:
                logger.error(f"Invalid regex pattern: {target_str}")
                return False

        return False

    @staticmethod
    def _matches_legacy_filters(filters: dict, message_text: str) -> bool:
        """
        Legacy support for simple keyword/blacklist/regex dicts.
        """
        message_lower = message_text.lower() if message_text else ""

        keywords = filters.get("keywords", [])
        if keywords:
            if isinstance(keywords, list):
                if not any(k.lower() in message_lower for k in keywords):
                    return False
            elif isinstance(keywords, str):
                if keywords.lower() not in message_lower:
                    return False
        
        blacklist = filters.get("blacklist", [])
        if blacklist:
            if any(b.lower() in message_lower for b in blacklist):
                return False

        regex_pattern = filters.get("regex")
        if regex_pattern:
            try:
                if not re.search(regex_pattern, message_text or ""):
                    return False
            except re.error:
                return False

        return True

rule_engine = RuleEngine()
