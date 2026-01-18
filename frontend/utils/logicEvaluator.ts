import { LogicNode, MessageData } from '../types';

/**
 * Recursively evaluates a message against a logic tree.
 * @param node The current logic node (root or child)
 * @param data The message data to evaluate
 * @returns boolean - true if the message matches the logic, false otherwise
 */
export const evaluateLogic = (node: LogicNode, data: MessageData): boolean => {
  // If it's a group, evaluate children based on operator
  if (node.type === 'group') {
    // Empty group defaults to true (pass-through) or false depending on business logic.
    // Usually an empty filter implies "no restrictions", so true.
    if (!node.children || node.children.length === 0) return true;

    if (node.operator === 'AND') {
      // All children must be true
      return node.children.every(child => evaluateLogic(child, data));
    } else { // OR
      // At least one child must be true
      return node.children.some(child => evaluateLogic(child, data));
    }
  }

  // If it's a condition, evaluate specific field
  const field = (node.field as keyof MessageData) || 'message_text';
  // safely get the value string for comparison
  const dataValue = String(data[field] || '').toLowerCase();
  const ruleValue = (node.value || '').toLowerCase();

  switch (node.condition) {
    case 'contains':
      return dataValue.includes(ruleValue);
    case 'not_contains':
      return !dataValue.includes(ruleValue);
    case 'equals':
      return dataValue === ruleValue;
    case 'starts_with':
      return dataValue.startsWith(ruleValue);
    case 'ends_with':
      return dataValue.endsWith(ruleValue);
    case 'regex':
      try {
        // Create regex from ruleValue.
        // Note: ruleValue was lowercased above, but for regex we might want original case if flags allowed.
        // For this simple implementation, we'll construct a case-insensitive regex from the raw node value.
        const rawValue = node.value || '';
        const regex = new RegExp(rawValue, 'i');
        return regex.test(String(data[field] || ''));
      } catch (e) {
        console.warn('Invalid regex pattern:', node.value);
        return false;
      }
    default:
      return false;
  }
};