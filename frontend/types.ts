export type LogicOperator = 'AND' | 'OR';
export type ConditionOperator = 'contains' | 'equals' | 'regex' | 'not_contains' | 'starts_with' | 'ends_with';

export interface LogicNode {
  id: string;
  type: 'group' | 'condition';
  // Group Specific
  operator?: LogicOperator;
  children?: LogicNode[];
  // Condition Specific
  field?: string;
  condition?: ConditionOperator;
  value?: string;
}

export interface AIRuleConfig {
  enabled: boolean;
  systemInstruction: string;
  model: string;
}

export interface FilterRule {
  id: string;
  name: string;
  isActive: boolean;
  logicRoot: LogicNode;
  aiConfig: AIRuleConfig;
  createdAt: string;
  source: string;
  destination: string;
  deliveryMethod: 'forward' | 'copy';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  messagePreview: string;
  matchedRuleId?: string;
  matchedRuleName?: string;
  action: 'forwarded' | 'dropped' | 'analyzed';
  aiAnalysisResult?: string;
}

export interface MessageData {
  id?: string;
  message_text: string;
  sender: string;
  chat_name?: string;
  timestamp?: string;
}

export type ViewState = 'dashboard' | 'rules' | 'builder' | 'logs';