import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { getCurrentPeriod, isPeriodUsed, formatCurrency } from '@/lib/utils';
import type { CreditCard, Benefit, BenefitFrequency, BenefitUsage } from '@/lib/types';

const CARDS_COLLECTION = 'creditCards';

type Period = 'week' | 'month' | 'quarter' | 'year';

const FREQUENCY_BY_PERIOD: Record<Period, BenefitFrequency[]> = {
  week: ['monthly'],
  month: ['monthly'],
  quarter: ['monthly', 'quarterly'],
  year: ['monthly', 'quarterly', 'semi-annually', 'yearly'],
};

async function getCreditsToUse(period: Period) {
  if (!adminDb) throw new Error('Firebase not initialized');
  const snapshot = await adminDb.collection(CARDS_COLLECTION).get();
  const creditsToUse: Array<{
    cardId: string;
    benefitId: string;
    cardName: string;
    bank: string;
    benefitName: string;
    amount?: number;
    currency?: string;
    frequency: string;
    period: string;
    description?: string;
  }> = [];
  const allowedFrequencies = FREQUENCY_BY_PERIOD[period];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const card = { id: doc.id, ...data, openedDate: data?.openedDate ?? '', benefits: data?.benefits ?? [] } as CreditCard;
    for (const benefit of card.benefits) {
      if (!allowedFrequencies.includes(benefit.frequency)) continue;
      const openedDate = new Date(card.openedDate);
      const currentPeriod = getCurrentPeriod(benefit.frequency, openedDate);
      const used = isPeriodUsed(benefit.usageHistory ?? [], currentPeriod);
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

function formatCreditsOutput(credits: Awaited<ReturnType<typeof getCreditsToUse>>): string {
  if (credits.length === 0) return "No credits need to be used for this period. You're all caught up!";
  const lines = credits.map(
    (c) =>
      `• **${c.benefitName}**${c.amount != null ? ` (${formatCurrency(c.amount, c.currency ?? 'USD')})` : ''} — ${c.cardName} (${c.bank}) — ${c.frequency}, period: ${c.period} [cardId: ${c.cardId}, benefitId: ${c.benefitId}]`
  );
  return `**Credits to use:**\n\n${lines.join('\n')}\n\nUse mark_credit_used with cardId and benefitId to mark one as used.`;
}

async function markCreditUsed(cardId: string, benefitId: string, period: string, used: boolean, notes?: string) {
  if (!adminDb) throw new Error('Firebase not initialized');
  const cardDoc = await adminDb.collection(CARDS_COLLECTION).doc(cardId).get();
  if (!cardDoc.exists) throw new Error('Card not found');
  const cardData = cardDoc.data();
  const benefits = (cardData?.benefits ?? []) as Benefit[];
  const benefit = benefits.find((b) => b.id === benefitId);
  if (!benefit) throw new Error('Benefit not found');
  const usageHistory = benefit.usageHistory ?? [];
  const existingIndex = usageHistory.findIndex((u: BenefitUsage) => u.period === period);
  const updatedHistory = [...usageHistory];
  const entry = { period, used, ...(used && { usedDate: new Date().toISOString() }), ...(notes && { notes }) };
  if (existingIndex >= 0) {
    updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...entry };
  } else {
    updatedHistory.push(entry);
  }
  const updatedBenefits = benefits.map((b) => (b.id === benefitId ? { ...b, usageHistory: updatedHistory } : b));
  await adminDb.collection(CARDS_COLLECTION).doc(cardId).update({
    benefits: updatedBenefits,
    updatedAt: new Date().toISOString(),
  });
}

// Stateless transport - create per request for serverless
function createMcpHandler() {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const mcpServer = new McpServer({ name: 'credit-card-tracker', version: '1.0.0' });

  mcpServer.registerTool(
    'get_credits_to_use',
    {
      description:
        'Get credit card benefits/credits that need to be used for a given time period. Returns unused benefits that expire or reset in the specified period. Includes cardId and benefitId for use with mark_credit_used.',
      inputSchema: {
        period: z
          .enum(['week', 'month', 'quarter', 'year'])
          .describe(
            'Time period: "week" = monthly benefits, "month" = monthly, "quarter" = monthly + quarterly, "year" = all benefit types'
          ),
      },
    },
    async ({ period }) => {
      if (!isFirebaseAdminInitialized()) {
        return {
          content: [{ type: 'text' as const, text: 'Error: Firebase not configured.' }],
          isError: true,
        };
      }
      try {
        const credits = await getCreditsToUse(period);
        return { content: [{ type: 'text' as const, text: formatCreditsOutput(credits) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  mcpServer.registerTool(
    'mark_credit_used',
    {
      description:
        'Mark a credit card benefit as used (or unused) for a specific period. Use cardId and benefitId from get_credits_to_use output. Period format: monthly=yyyy-MM, quarterly=yyyy-Qn, semi-annually=yyyy-Hn, yearly=yyyy.',
      inputSchema: {
        cardId: z.string().describe('Credit card ID'),
        benefitId: z.string().describe('Benefit ID'),
        period: z.string().describe('Period to update (e.g. 2025-02, 2025-Q1, 2025-H1, 2025)'),
        used: z.boolean().default(true).describe('true = mark as used, false = mark as unused'),
        notes: z.string().optional().describe('Optional notes'),
      },
    },
    async ({ cardId, benefitId, period, used, notes }) => {
      if (!isFirebaseAdminInitialized()) {
        return {
          content: [{ type: 'text' as const, text: 'Error: Firebase not configured.' }],
          isError: true,
        };
      }
      try {
        await markCreditUsed(cardId, benefitId, period, used, notes);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Successfully marked as ${used ? 'used' : 'unused'} for period ${period}.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  mcpServer.connect(transport);
  return transport;
}

export async function GET(request: Request) {
  const transport = createMcpHandler();
  return transport.handleRequest(request);
}

export async function POST(request: Request) {
  const transport = createMcpHandler();
  return transport.handleRequest(request);
}
