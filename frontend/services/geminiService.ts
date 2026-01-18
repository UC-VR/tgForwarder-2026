import { GoogleGenAI, Type } from "@google/genai";
import { LogicNode } from "../types";

const parseLogicPrompt = `
You are a Logic Converter. Your goal is to translate natural language filtering requirements into a recursive JSON logic tree.

The JSON structure represents a boolean logic tree.
There are two types of nodes: 'group' and 'condition'.

1. 'group' nodes:
   - type: "group"
   - operator: "AND" or "OR"
   - children: Array of nodes (can be groups or conditions)

2. 'condition' nodes:
   - type: "condition"
   - field: "message_text" (default) or "sender"
   - condition: "contains", "equals", "not_contains", "regex", "starts_with", "ends_with"
   - value: string (the keyword or pattern)

Output strict JSON only. Do not wrap in markdown code blocks.

Example Input: "Messages about Apple or Tesla, but not if they mention 'rumor'"
Example Output:
{
  "id": "root",
  "type": "group",
  "operator": "AND",
  "children": [
    {
      "id": "g1",
      "type": "group",
      "operator": "OR",
      "children": [
        { "id": "c1", "type": "condition", "field": "message_text", "condition": "contains", "value": "Apple" },
        { "id": "c2", "type": "condition", "field": "message_text", "condition": "contains", "value": "Tesla" }
      ]
    },
    {
      "id": "c3",
      "type": "condition",
      "field": "message_text",
      "condition": "not_contains",
      "value": "rumor"
    }
  ]
}
`;

export const generateLogicFromNaturalLanguage = async (prompt: string): Promise<LogicNode | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock data or null.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // We use gemini-3-flash-preview for speed and efficiency in logic parsing
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: parseLogicPrompt }] },
        { role: 'user', parts: [{ text: `User Request: "${prompt}"` }] }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for deterministic logic generation
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      // Basic validation ensuring IDs exist
      const addIds = (node: any): LogicNode => {
        if (!node.id) node.id = crypto.randomUUID();
        if (node.children) {
          node.children = node.children.map(addIds);
        }
        return node as LogicNode;
      };
      return addIds(parsed);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini", e);
      return null;
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const analyzeMessageWithAI = async (message: string, instruction: string): Promise<{decision: boolean, reason: string}> => {
    if (!process.env.API_KEY) return { decision: false, reason: "No API Key" };

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            System Instruction: ${instruction}

            Task: Analyze the following message and decide if it meets the criteria.
            Respond in JSON format: { "decision": boolean, "reason": "short explanation" }

            Message: "${message}"
            `,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.2
            }
        });

        const text = response.text;
        if(!text) return { decision: false, reason: "Empty response" };
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return { decision: false, reason: "AI Error" };
    }
}
