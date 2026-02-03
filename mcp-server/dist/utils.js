import { format, getQuarter, getMonth } from 'date-fns';
export function getCurrentPeriod(frequency, _openedDate) {
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
export function isPeriodUsed(usageHistory, period) {
    const history = usageHistory ?? [];
    const usage = history.find((u) => u.period === period);
    return usage?.used || false;
}
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}
