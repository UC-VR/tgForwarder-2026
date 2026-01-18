import { FilterRule, LogEntry, LogicNode } from "./types";

export const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    source: 'Telegram: CryptoAlerts',
    messagePreview: 'Bitcoin just broke 90k support! PANIC SELL or BUY THE DIP?',
    matchedRuleId: 'r1',
    matchedRuleName: 'High Priority Crypto',
    action: 'forwarded',
    aiAnalysisResult: 'Positive sentiment detected.'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'Discord: General',
    messagePreview: 'Join my pump and dump scheme now! click here.',
    action: 'dropped',
    matchedRuleId: undefined,
    matchedRuleName: 'Spam Filter (Implicit)'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'Email: Newsletter',
    messagePreview: 'Weekly digest: Tech stocks are rallying due to AI advancements.',
    matchedRuleId: 'r2',
    matchedRuleName: 'Tech News',
    action: 'analyzed',
    aiAnalysisResult: 'Relevant to portfolio interests.'
  }
];

export const INITIAL_RULE_LOGIC: LogicNode = {
  id: 'root',
  type: 'group',
  operator: 'AND',
  children: [
    {
      id: 'c1',
      type: 'condition',
      field: 'message_text',
      condition: 'contains',
      value: 'Urgent'
    },
    {
      id: 'g2',
      type: 'group',
      operator: 'OR',
      children: [
        { id: 'c2', type: 'condition', field: 'message_text', condition: 'contains', value: 'Server' },
        { id: 'c3', type: 'condition', field: 'message_text', condition: 'contains', value: 'Database' }
      ]
    }
  ]
};

export const MOCK_RULES: FilterRule[] = [
  {
    id: 'r1',
    name: 'DevOps Alerts',
    isActive: true,
    createdAt: new Date().toISOString(),
    logicRoot: INITIAL_RULE_LOGIC,
    aiConfig: {
      enabled: false,
      systemInstruction: "Check if this is a false alarm.",
      model: "gemini-3-flash-preview"
    },
    source: '@devops_src',
    destination: '@devops_alerts',
    deliveryMethod: 'forward'
  }
];