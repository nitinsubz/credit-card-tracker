export type BenefitFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'yearly';

export interface BenefitUsage {
  period: string;
  used: boolean;
  usedDate?: string;
  notes?: string;
}

export interface Benefit {
  id: string;
  name: string;
  description?: string;
  frequency: BenefitFrequency;
  amount?: number;
  currency?: string;
  usageHistory: BenefitUsage[];
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  openedDate: string;
  annualFee: number;
  benefits: Benefit[];
  createdAt: string;
  updatedAt: string;
}

export interface CreditToUse {
  cardName: string;
  bank: string;
  benefitName: string;
  amount?: number;
  currency?: string;
  frequency: string;
  period: string;
  description?: string;
}
