import { format, getQuarter, getMonth } from 'date-fns';
import type { BenefitFrequency, BenefitUsage } from './types.js';

export function getCurrentPeriod(frequency: BenefitFrequency, _openedDate: Date): string {
  const now = new Date();

  switch (frequency) {
    case 'monthly':
      return format(now, 'yyyy-MM');
    case 'quarterly':
      return `${format(now, 'yyyy')}-Q${getQuarter(now)}`;
    case 'semi-annually':
      return `${format(now, 'yyyy')}-H${getMonth(now) < 6 ? 1 : 2}`;
    case 'yearly':
      return format(now, 'yyyy');
    default:
      return '';
  }
}

export function isPeriodUsed(usageHistory: BenefitUsage[] | undefined, period: string): boolean {
  const history = usageHistory ?? [];
  const usage = history.find((u) => u.period === period);
  return usage?.used || false;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
