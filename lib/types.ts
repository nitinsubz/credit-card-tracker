export type BenefitFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'yearly';

export interface Benefit {
  id: string;
  name: string;
  description?: string;
  frequency: BenefitFrequency;
  amount?: number;
  currency?: string;
  usageHistory: BenefitUsage[];
}

export interface BenefitUsage {
  period: string; // e.g., "2024-01" for monthly, "2024-Q1" for quarterly, "2024-H1" for semi-annually, "2024" for yearly
  used: boolean;
  usedDate?: string;
  notes?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  openedDate: string; // ISO date string
  annualFee: number;
  benefits: Benefit[];
  createdAt: string;
  updatedAt: string;
}

