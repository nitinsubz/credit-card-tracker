'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard as CreditCardType } from '@/lib/types';
import { getCreditCards } from '@/lib/firestore';
import { formatDate, getRenewalDate, formatCurrency } from '@/lib/utils';
import { CreditCard, Plus, Calendar, DollarSign } from 'lucide-react';

export default function Home() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getCreditCards();
      setCards(data);
      setFirebaseError(null);
    } catch (error: any) {
      console.error('Error loading cards:', error);
      if (error?.message?.includes('Firebase is not initialized') || error?.message?.includes('Firebase')) {
        setFirebaseError(error.message);
      }
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
            <p className="mt-4 text-gray-600">Loading your credit cards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Firebase Configuration Required
                </h3>
                <p className="text-yellow-700 mb-4">
                  {firebaseError}
                </p>
                <div className="bg-white p-4 rounded border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Quick Setup:</p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Firebase Console</a></li>
                    <li>Enable Firestore Database</li>
                    <li>Create a <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file in the project root</li>
                    <li>Copy your Firebase config values from Project Settings → Your apps → Web app</li>
                    <li>Add them to <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> (see <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local.example</code> for format)</li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalAnnualFees = cards.reduce((sum, card) => sum + card.annualFee, 0);
  const upcomingRenewals = cards
    .map(card => ({
      card,
      renewalDate: getRenewalDate(new Date(card.openedDate)),
    }))
    .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Credit Card Benefits Tracker
          </h1>
          <p className="text-gray-600">
            Manage and track all your credit card benefits in one place
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cards</p>
                <p className="text-3xl font-bold text-gray-900">{cards.length}</p>
              </div>
              <CreditCard className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Annual Fees</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(totalAnnualFees)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Benefits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {cards.reduce((sum, card) => sum + card.benefits.length, 0)}
                </p>
              </div>
              <Calendar className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Add Card Button */}
        <div className="mb-8">
          <Link
            href="/cards/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add New Credit Card
          </Link>
        </div>

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Renewals</h2>
            <div className="space-y-3">
              {upcomingRenewals.map(({ card, renewalDate }) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{card.name}</p>
                    <p className="text-sm text-gray-600">{card.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatDate(renewalDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(card.annualFee)} annual fee
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No credit cards added yet</p>
              <Link
                href="/cards/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Card
              </Link>
            </div>
          ) : (
            cards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{card.name}</h3>
                  <p className="text-sm text-gray-600">{card.bank}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Fee:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(card.annualFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opened:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(card.openedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Benefits:</span>
                    <span className="font-semibold text-gray-900">
                      {card.benefits.length}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Navigation Links */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/analytics"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            View Analytics →
          </Link>
        </div>
      </div>
    </div>
  );
}

