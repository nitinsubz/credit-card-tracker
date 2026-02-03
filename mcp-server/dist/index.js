#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { initializeFirebase, getDb, isInitialized } from './firebase.js';
import { getCurrentPeriod, isPeriodUsed, formatCurrency } from './utils.js';
const CARDS_COLLECTION = 'creditCards';
const PeriodSchema = z.enum(['week', 'month', 'quarter', 'year']);
const FREQUENCY_BY_PERIOD = {
    week: ['monthly'],
    month: ['monthly'],
    quarter: ['monthly', 'quarterly'],
    year: ['monthly', 'quarterly', 'semi-annually', 'yearly'],
};
async function getCreditsToUse(period) {
    const db = getDb();
    if (!db) {
        throw new Error('Firebase not initialized. Ensure firebaseKey.json exists in the project root.');
    }
    const snapshot = await db.collection(CARDS_COLLECTION).get();
    const creditsToUse = [];
    const allowedFrequencies = FREQUENCY_BY_PERIOD[period];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const card = {
            id: doc.id,
            ...data,
            openedDate: data?.openedDate ?? '',
            benefits: (data?.benefits ?? []).map((b) => ({
                ...b,
                usageHistory: b.usageHistory ?? [],
            })),
        };
        for (const benefit of card.benefits) {
            if (!allowedFrequencies.includes(benefit.frequency))
                continue;
            const openedDate = new Date(card.openedDate);
            const currentPeriod = getCurrentPeriod(benefit.frequency, openedDate);
            const used = isPeriodUsed(benefit.usageHistory, currentPeriod);
            if (!used) {
                creditsToUse.push({
                    cardName: card.name,
                    bank: card.bank,
                    benefitName: benefit.name,
                    amount: benefit.amount,
                    currency: benefit.currency,
                    frequency: benefit.frequency,
                    period: currentPeriod,
                    description: benefit.description,
                });
            }
        }
    }
    return creditsToUse;
}
function formatCreditsOutput(credits) {
    if (credits.length === 0) {
        return "No credits need to be used for this period. You're all caught up!";
    }
    const lines = credits.map((c) => {
        const amountStr = c.amount != null ? ` (${formatCurrency(c.amount, c.currency ?? 'USD')})` : '';
        return `• **${c.benefitName}**${amountStr} — ${c.cardName} (${c.bank}) — ${c.frequency}, period: ${c.period}`;
    });
    return `**Credits to use:**\n\n${lines.join('\n')}`;
}
const mcpServer = new McpServer({
    name: 'credit-card-tracker',
    version: '1.0.0',
});
mcpServer.registerTool('get_credits_to_use', {
    description: 'Get credit card benefits/credits that need to be used for a given time period. Returns unused benefits that expire or reset in the specified period.',
    inputSchema: {
        period: z
            .enum(['week', 'month', 'quarter', 'year'])
            .describe('Time period: "week" = monthly benefits (use before end of month), "month" = monthly, "quarter" = monthly + quarterly, "year" = all benefit types'),
    },
}, async ({ period }) => {
    const initialized = isInitialized() || initializeFirebase();
    if (!initialized) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: Could not connect to Firebase. Ensure firebaseKey.json exists in the credit-card-tracker project root.',
                },
            ],
            isError: true,
        };
    }
    try {
        const credits = await getCreditsToUse(period);
        const output = formatCreditsOutput(credits);
        return {
            content: [
                {
                    type: 'text',
                    text: output,
                },
            ],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error fetching credits: ${message}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
}
main().catch(console.error);
