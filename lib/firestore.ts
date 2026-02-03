import { CreditCard, Benefit, BenefitUsage } from './types';

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Get all credit cards
export async function getCreditCards(): Promise<CreditCard[]> {
  const response = await fetch('/api/cards');
  return handleApiResponse<CreditCard[]>(response);
}

// Get a single credit card
export async function getCreditCard(id: string): Promise<CreditCard | null> {
  try {
    const response = await fetch(`/api/cards/${id}`);
    if (response.status === 404) {
      return null;
    }
    return handleApiResponse<CreditCard>(response);
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

// Add a new credit card
export async function addCreditCard(card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  });
  const result = await handleApiResponse<CreditCard>(response);
  return result.id;
}

// Update a credit card
export async function updateCreditCard(id: string, updates: Partial<CreditCard>): Promise<void> {
  const response = await fetch(`/api/cards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  await handleApiResponse(response);
}

// Delete a credit card
export async function deleteCreditCard(id: string): Promise<void> {
  const response = await fetch(`/api/cards/${id}`, {
    method: 'DELETE',
  });
  await handleApiResponse(response);
}

// Add a benefit to a credit card
export async function addBenefit(cardId: string, benefit: Omit<Benefit, 'id' | 'usageHistory'>): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}/benefits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(benefit),
  });
  await handleApiResponse(response);
}

// Update a benefit
export async function updateBenefit(
  cardId: string,
  benefitId: string,
  updates: Partial<Benefit>
): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}/benefits`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ benefitId, ...updates }),
  });
  await handleApiResponse(response);
}

// Delete a benefit
export async function deleteBenefit(cardId: string, benefitId: string): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}/benefits?benefitId=${benefitId}`, {
    method: 'DELETE',
  });
  await handleApiResponse(response);
}

// Mark benefit usage for a period
export async function markBenefitUsage(
  cardId: string,
  benefitId: string,
  period: string,
  used: boolean,
  notes?: string
): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}/benefits/usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ benefitId, period, used, notes }),
  });
  await handleApiResponse(response);
}

