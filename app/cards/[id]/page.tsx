'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard as CreditCardType, Benefit, BenefitFrequency } from '@/lib/types';
import {
  getCreditCard,
  deleteCreditCard,
  addBenefit,
  updateBenefit,
  deleteBenefit,
  markBenefitUsage,
} from '@/lib/firestore';
import {
  formatDate,
  getRenewalDate,
  formatCurrency,
  getCurrentPeriod,
  getAllPeriods,
  isPeriodUsed,
} from '@/lib/utils';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Edit,
  X,
  Check,
  Calendar,
  DollarSign,
} from 'lucide-react';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const [card, setCard] = useState<CreditCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBenefit, setShowAddBenefit] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<string | null>(null);
  const [newBenefit, setNewBenefit] = useState({
    name: '',
    description: '',
    frequency: 'monthly' as BenefitFrequency,
    amount: '',
    currency: 'USD',
  });

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    try {
      const data = await getCreditCard(cardId);
      if (data?.benefits) {
        data.benefits = data.benefits.map((b) => ({
          ...b,
          usageHistory: b.usageHistory ?? [],
        }));
      }
      setCard(data);
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Are you sure you want to delete this credit card?')) return;
    try {
      await deleteCreditCard(cardId);
      router.push('/');
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card');
    }
  };

  const handleAddBenefit = async () => {
    if (!newBenefit.name.trim()) return;
    try {
      await addBenefit(cardId, {
        name: newBenefit.name,
        description: newBenefit.description || undefined,
        frequency: newBenefit.frequency,
        amount: newBenefit.amount ? parseFloat(newBenefit.amount) : undefined,
        currency: newBenefit.currency,
      });
      setNewBenefit({
        name: '',
        description: '',
        frequency: 'monthly',
        amount: '',
        currency: 'USD',
      });
      setShowAddBenefit(false);
      loadCard();
    } catch (error) {
      console.error('Error adding benefit:', error);
      alert('Failed to add benefit');
    }
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    if (!confirm('Are you sure you want to delete this benefit?')) return;
    try {
      await deleteBenefit(cardId, benefitId);
      loadCard();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      alert('Failed to delete benefit');
    }
  };

  const handleToggleUsage = async (
    benefitId: string,
    period: string,
    currentlyUsed: boolean
  ) => {
    try {
      await markBenefitUsage(cardId, benefitId, period, !currentlyUsed);
      loadCard();
    } catch (error) {
      console.error('Error updating usage:', error);
      alert('Failed to update usage');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading card details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">Card not found</p>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renewalDate = getRenewalDate(new Date(card.openedDate));
  const openedDate = new Date(card.openedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{card.name}</h1>
                <p className="text-lg text-gray-600">{card.bank}</p>
              </div>
              <button
                onClick={handleDeleteCard}
                className="text-red-600 hover:text-red-700 p-2"
                title="Delete card"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Annual Fee</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(card.annualFee)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opened Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatDate(card.openedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Renewal Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatDate(renewalDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Benefits</p>
                <p className="text-xl font-semibold text-gray-900">
                  {card.benefits.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Benefits</h2>
            <button
              onClick={() => setShowAddBenefit(!showAddBenefit)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Benefit
            </button>
          </div>

          {/* Add Benefit Form */}
          {showAddBenefit && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Benefit</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefit Name *
                  </label>
                  <input
                    type="text"
                    value={newBenefit.name}
                    onChange={(e) => setNewBenefit({ ...newBenefit, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., $50 Dining Credit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newBenefit.description}
                    onChange={(e) =>
                      setNewBenefit({ ...newBenefit, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={newBenefit.frequency}
                      onChange={(e) =>
                        setNewBenefit({
                          ...newBenefit,
                          frequency: e.target.value as BenefitFrequency,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annually">Semi-annually</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={newBenefit.amount}
                      onChange={(e) =>
                        setNewBenefit({ ...newBenefit, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddBenefit}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add Benefit
                  </button>
                  <button
                    onClick={() => setShowAddBenefit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Benefits List */}
          {card.benefits.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No benefits added yet. Click &quot;Add Benefit&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {card.benefits.map((benefit) => (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  openedDate={openedDate}
                  onToggleUsage={handleToggleUsage}
                  onDelete={() => handleDeleteBenefit(benefit.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  benefit,
  openedDate,
  onToggleUsage,
  onDelete,
}: {
  benefit: Benefit;
  openedDate: Date;
  onToggleUsage: (benefitId: string, period: string, currentlyUsed: boolean) => void;
  onDelete: () => void;
}) {
  const periods = getAllPeriods(benefit.frequency, openedDate);
  const currentPeriod = getCurrentPeriod(benefit.frequency, openedDate);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
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
          {benefit.description && (
            <p className="text-sm text-gray-600 mb-2">{benefit.description}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 p-1"
          title="Delete benefit"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Usage History:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {periods.slice(-12).map((period) => {
            const used = isPeriodUsed(benefit.usageHistory, period);
            const isCurrent = period === currentPeriod;
            return (
              <button
                key={period}
                onClick={() => onToggleUsage(benefit.id, period, used)}
                className={`p-2 rounded-lg text-sm border-2 transition-colors ${
                  used
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : isCurrent
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{period}</span>
                  {used ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-current rounded"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

