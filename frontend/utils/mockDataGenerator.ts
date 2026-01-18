import { MessageData } from '../types';

const SAMPLE_SENDERS = ['admin_bot', 'crypto_king', 'alice_w', 'bob_builder', 'system_monitor', 'spam_hub', 'telethon_user'];
const SAMPLE_CHATS = ['DevOps Alerts', 'Crypto Moon Shots', 'General Chat', 'Marketing', 'Server Logs', 'Family Group'];

const TEMPLATES = [
    (t: string) => `[URGENT] Server ${t} is not responding. High CPU usage detected.`,
    (t: string) => `🚀 Bitcoin is pumping! Buy ${t} now before it's too late! #crypto`,
    (t: string) => `Hey guys, are we meeting at ${t} today for the standup?`,
    (t: string) => `New deployment started for service: ${t}.`,
    (t: string) => `Click here to claim your free ${t} prize!`,
    (t: string) => `Database connection failed in region ${t}. Check logs immediately.`,
    (t: string) => `Just saw the new movie, it was ${t}.`,
    (t: string) => `Error: Exception in thread "main" java.lang.${t}`,
    (t: string) => `Make $5000/day working from home! Ask me how. #passiveincome ${t}`,
];

const VARIABLES = ['US-EAST-1', 'ETH', '10:00 AM', 'auth-service', 'iPhone 15', 'EU-WEST', 'amazing', 'NullPointerException', 'LEGIT'];

export const generateMockMessage = (): MessageData => {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const variable = VARIABLES[Math.floor(Math.random() * VARIABLES.length)];

    return {
        id: crypto.randomUUID(),
        message_text: template(variable),
        sender: SAMPLE_SENDERS[Math.floor(Math.random() * SAMPLE_SENDERS.length)],
        chat_name: SAMPLE_CHATS[Math.floor(Math.random() * SAMPLE_CHATS.length)],
        timestamp: new Date().toISOString()
    };
};