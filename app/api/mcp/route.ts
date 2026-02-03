import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { getCurrentPeriod, isPeriodUsed, formatCurrency } from '@/lib/utils';
import type { CreditCard, Benefit, BenefitFrequency } from '@/lib/types';

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
      `• **${c.benefitName}**${c.amount != null ? ` (${formatCurrency(c.amount, c.currency ?? 'USD')})` : ''} — ${c.cardName} (${c.bank}) — ${c.frequency}, period: ${c.period}`
  );
  return `**Credits to use:**\n\n${lines.join('\n')}`;
}

// Stateless transport - create per request for serverless
function createMcpHandler() {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const mcpServer = new McpServer({ name: 'credit-card-tracker', version: '1.0.0' });

  mcpServer.registerTool(
    'get_credits_to_use',
    {
      description:
        'Get credit card benefits/credits that need to be used for a given time period. Returns unused benefits that expire or reset in the specified period.',
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
