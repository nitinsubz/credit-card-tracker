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
                    cardId: card.id,
                    benefitId: benefit.id,
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
        return `• **${c.benefitName}**${amountStr} — ${c.cardName} (${c.bank}) — ${c.frequency}, period: ${c.period} [cardId: ${c.cardId}, benefitId: ${c.benefitId}]`;
    });
    return `**Credits to use:**\n\n${lines.join('\n')}\n\nUse mark_credit_used with cardId and benefitId to mark one as used.`;
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
async function markCreditUsed(db, cardId, benefitId, period, used, notes) {
    const cardDoc = await db.collection(CARDS_COLLECTION).doc(cardId).get();
    if (!cardDoc.exists)
        throw new Error('Card not found');
    const cardData = cardDoc.data();
    const benefits = (cardData?.benefits ?? []);
    const benefit = benefits.find((b) => b.id === benefitId);
    if (!benefit)
        throw new Error('Benefit not found');
    const usageHistory = benefit.usageHistory ?? [];
    const existingIndex = usageHistory.findIndex((u) => u.period === period);
    const updatedHistory = [...usageHistory];
    const entry = { period, used, ...(used && { usedDate: new Date().toISOString() }), ...(notes && { notes }) };
    if (existingIndex >= 0) {
        updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...entry };
    }
    else {
        updatedHistory.push(entry);
    }
    const updatedBenefits = benefits.map((b) => (b.id === benefitId ? { ...b, usageHistory: updatedHistory } : b));
    await db.collection(CARDS_COLLECTION).doc(cardId).update({
        benefits: updatedBenefits,
        updatedAt: new Date().toISOString(),
    });
}
mcpServer.registerTool('mark_credit_used', {
    description: 'Mark a credit card benefit as used (or unused) for a specific period. Use cardId and benefitId from get_credits_to_use output. Period format: monthly=yyyy-MM, quarterly=yyyy-Qn, semi-annually=yyyy-Hn, yearly=yyyy.',
    inputSchema: {
        cardId: z.string().describe('Credit card ID'),
        benefitId: z.string().describe('Benefit ID'),
        period: z.string().describe('Period to update (e.g. 2025-02, 2025-Q1, 2025-H1, 2025)'),
        used: z.boolean().default(true).describe('true = mark as used, false = mark as unused'),
        notes: z.string().optional().describe('Optional notes'),
    },
}, async ({ cardId, benefitId, period, used, notes }) => {
    const db = getDb();
    if (!db) {
        return {
            content: [{ type: 'text', text: 'Error: Firebase not initialized.' }],
            isError: true,
        };
    }
    try {
        await markCreditUsed(db, cardId, benefitId, period, used, notes);
        return {
            content: [{ type: 'text', text: `Successfully marked as ${used ? 'used' : 'unused'} for period ${period}.` }],
        };
    }
    catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
}
main().catch(console.error);
