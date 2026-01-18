import { FilterRule, LogicNode, AIRuleConfig } from '../types';

const API_BASE = '/rules';

interface BackendRule {
    id: number;
    name: string;
    source: string;
    destination: string;
    filters: LogicNode;
    ai_config: AIRuleConfig;
    delivery_method: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const api = {
    async fetchRules(): Promise<FilterRule[]> {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch rules');
        const data: BackendRule[] = await res.json();
        return data.map(convertFromBackend);
    },

    async createRule(rule: Omit<FilterRule, 'id' | 'createdAt'>): Promise<FilterRule> {
        const payload = convertToBackend(rule);
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create rule');
        const data: BackendRule = await res.json();
        return convertFromBackend(data);
    },

    async updateRule(rule: FilterRule): Promise<FilterRule> {
        const payload = convertToBackend(rule);
        const res = await fetch(`${API_BASE}/${rule.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update rule');
        const data: BackendRule = await res.json();
        return convertFromBackend(data);
    },

    async deleteRule(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete rule');
    }
};

function convertFromBackend(r: BackendRule): FilterRule {
    return {
        id: r.id.toString(),
        name: r.name || 'Untitled',
        source: r.source,
        destination: r.destination,
        deliveryMethod: (r.delivery_method as 'forward' | 'copy') || 'forward',
        isActive: r.is_active,
        logicRoot: r.filters || { id: 'root', type: 'group', operator: 'AND', children: [] },
        aiConfig: r.ai_config || { enabled: false, systemInstruction: '', model: 'gemini-3-flash-preview' },
        createdAt: r.created_at
    };
}

function convertToBackend(r: Partial<FilterRule>): any {
    const out: any = {};
    if (r.name !== undefined) out.name = r.name;
    if (r.source !== undefined) out.source = r.source;
    if (r.destination !== undefined) out.destination = r.destination;
    if (r.deliveryMethod !== undefined) out.delivery_method = r.deliveryMethod;
    if (r.isActive !== undefined) out.is_active = r.isActive;
    if (r.logicRoot !== undefined) out.filters = r.logicRoot;
    if (r.aiConfig !== undefined) out.ai_config = r.aiConfig;
    return out;
}
