'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard as CreditCardType, Benefit } from '@/lib/types';
import { getCreditCards } from '@/lib/firestore';
import {
  formatDate,
  getCurrentPeriod,
  getAllPeriods,
  isPeriodUsed,
  formatCurrency,
} from '@/lib/utils';
import { ArrowLeft, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getCreditCards();
      setCards(data);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const allBenefits: Array<{
    card: CreditCardType;
    benefit: Benefit;
    unusedPeriods: string[];
    currentPeriod: string;
    isCurrentUnused: boolean;
  }> = [];

  cards.forEach((card) => {
    const openedDate = new Date(card.openedDate);
    card.benefits.forEach((benefit) => {
      const currentPeriod = getCurrentPeriod(benefit.frequency, openedDate);
      const periods = getAllPeriods(benefit.frequency, openedDate);
      const unusedPeriods = periods.filter(
        (period) => !isPeriodUsed(benefit.usageHistory, period) && period !== currentPeriod
      );
      const isCurrentUnused = !isPeriodUsed(benefit.usageHistory, currentPeriod);

      allBenefits.push({
        card,
        benefit,
        unusedPeriods,
        currentPeriod,
        isCurrentUnused,
      });
    });
  });

  const unusedBenefits = allBenefits.filter((b) => b.unusedPeriods.length > 0 || b.isCurrentUnused);
  const expiringSoon = unusedBenefits.filter((b) => b.isCurrentUnused);

  const totalValueUnused = unusedBenefits.reduce((sum, b) => {
    return sum + (b.benefit.amount || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Analytics & Insights</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unused Benefits</p>
                <p className="text-3xl font-bold text-gray-900">{unusedBenefits.length}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring This Period</p>
                <p className="text-3xl font-bold text-gray-900">{expiringSoon.length}</p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Value Lost</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(totalValueUnused)}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Unused Benefits List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Unused Benefits ({unusedBenefits.length})
          </h2>
          {unusedBenefits.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Great job! All benefits are being used.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unusedBenefits.map(({ card, benefit, unusedPeriods, isCurrentUnused }) => (
                <div
                  key={`${card.id}-${benefit.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{benefit.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                          {benefit.frequency}
                        </span>
                        {benefit.amount && (
                          <span className="text-sm font-semibold text-gray-700">
                            {formatCurrency(benefit.amount, benefit.currency)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <Link
                          href={`/cards/${card.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          {card.name}
                        </Link>
                        {' • '}
                        {card.bank}
                      </p>
                      {benefit.description && (
                        <p className="text-sm text-gray-600 mb-3">{benefit.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {isCurrentUnused && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                            Current Period Unused
                          </span>
                        )}
                        {unusedPeriods.length > 0 && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                            {unusedPeriods.length} Past Period{unusedPeriods.length !== 1 ? 's' : ''}{' '}
                            Unused
                          </span>
                        )}
                      </div>
                      {unusedPeriods.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Unused periods:</p>
                          <div className="flex flex-wrap gap-1">
                            {unusedPeriods.slice(0, 10).map((period) => (
                              <span
                                key={period}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {period}
                              </span>
                            ))}
                            {unusedPeriods.length > 10 && (
                              <span className="px-2 py-1 text-gray-500 text-xs">
                                +{unusedPeriods.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/cards/${card.id}`}
                      className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      View Card
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card) => {
              const totalBenefits = card.benefits.length;
              const openedDate = new Date(card.openedDate);
              let totalPeriods = 0;
              let usedPeriods = 0;

              card.benefits.forEach((benefit) => {
                const periods = getAllPeriods(benefit.frequency, openedDate);
                totalPeriods += periods.length;
                periods.forEach((period) => {
                  if (isPeriodUsed(benefit.usageHistory, period)) {
                    usedPeriods++;
                  }
                });
              });

              const usageRate = totalPeriods > 0 ? (usedPeriods / totalPeriods) * 100 : 0;

              return (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{card.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{card.bank}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usage Rate</span>
                      <span className="font-semibold text-gray-900">
                        {usageRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usageRate >= 80
                            ? 'bg-green-600'
                            : usageRate >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${usageRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{usedPeriods} used</span>
                      <span>{totalPeriods} total</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

