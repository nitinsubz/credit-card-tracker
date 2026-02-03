import { format, addMonths, addYears, getQuarter, getMonth, startOfDay } from 'date-fns';
import { BenefitFrequency, BenefitUsage } from './types';

export function getCurrentPeriod(frequency: BenefitFrequency, openedDate: Date): string {
  const now = new Date();
  
  switch (frequency) {
    case 'monthly':
      return format(now, 'yyyy-MM');
    case 'quarterly':
      const quarter = getQuarter(now);
      return `${format(now, 'yyyy')}-Q${quarter}`;
    case 'semi-annually':
      const half = getMonth(now) < 6 ? 1 : 2;
      return `${format(now, 'yyyy')}-H${half}`;
    case 'yearly':
      return format(now, 'yyyy');
    default:
      return '';
  }
}

export function getAllPeriods(
  frequency: BenefitFrequency,
  openedDate: Date,
  endDate: Date = new Date()
): string[] {
  const periods: string[] = [];
  const start = startOfDay(new Date(openedDate));
  const end = startOfDay(endDate);
  let current = new Date(start);
  
  switch (frequency) {
    case 'monthly':
      while (current <= end) {
        periods.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
      }
      break;
    case 'quarterly':
      while (current <= end) {
        const quarter = getQuarter(current);
        const year = format(current, 'yyyy');
        const period = `${year}-Q${quarter}`;
        if (!periods.includes(period)) {
          periods.push(period);
        }
        current = addMonths(current, 1);
      }
      break;
    case 'semi-annually':
      while (current <= end) {
        const half = getMonth(current) < 6 ? 1 : 2;
        const year = format(current, 'yyyy');
        const period = `${year}-H${half}`;
        if (!periods.includes(period)) {
          periods.push(period);
        }
        current = addMonths(current, 1);
      }
      break;
    case 'yearly':
      while (current <= end) {
        const year = format(current, 'yyyy');
        if (!periods.includes(year)) {
          periods.push(year);
        }
        current = addYears(current, 1);
      }
      break;
  }
  
  // Ensure current period is always included (handles edge cases like future opened dates)
  const currentPeriod = getCurrentPeriod(frequency, openedDate);
  if (currentPeriod && !periods.includes(currentPeriod)) {
    periods.push(currentPeriod);
    periods.sort();
  }
  
  return periods;
}

export function getRenewalDate(openedDate: Date): Date {
  return addYears(openedDate, 1);
}

export function isPeriodUsed(usageHistory: BenefitUsage[] | undefined, period: string): boolean {
  const history = usageHistory ?? [];
  const usage = history.find(u => u.period === period);
  return usage?.used || false;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

