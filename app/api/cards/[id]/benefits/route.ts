import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { Benefit } from '@/lib/types';

const CARDS_COLLECTION = 'creditCards';

// POST - Add a benefit to a credit card
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isFirebaseAdminInitialized() || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, description, frequency, amount, currency } = body;

    if (!name || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, frequency' },
        { status: 400 }
      );
    }

    const cardDoc = await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const cardData = cardDoc.data();
    const benefits = cardData?.benefits || [];

    // Create benefit object without undefined values (Firestore doesn't accept undefined)
    const newBenefit: any = {
      id: Date.now().toString(),
      name,
      frequency,
      usageHistory: [],
    };
    
    if (description !== undefined && description !== null && description !== '') {
      newBenefit.description = description;
    }
    
    if (amount !== undefined && amount !== null) {
      newBenefit.amount = amount;
    }
    
    if (currency !== undefined && currency !== null && currency !== '') {
      newBenefit.currency = currency;
    }

    await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .update({
        benefits: [...benefits, newBenefit],
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ success: true, benefit: newBenefit });
  } catch (error: any) {
    console.error('Error adding benefit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add benefit' },
      { status: 500 }
    );
  }
}

// PUT - Update a benefit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isFirebaseAdminInitialized() || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { benefitId, ...updates } = body;

    if (!benefitId) {
      return NextResponse.json(
        { error: 'Missing required field: benefitId' },
        { status: 400 }
      );
    }

    const cardDoc = await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const cardData = cardDoc.data();
    const benefits = cardData?.benefits || [];

    // Remove undefined values from updates (Firestore doesn't accept undefined)
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    const updatedBenefits = benefits.map((b: Benefit) =>
      b.id === benefitId ? { ...b, ...cleanUpdates } : b
    );

    await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .update({
        benefits: updatedBenefits,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating benefit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update benefit' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a benefit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isFirebaseAdminInitialized() || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const benefitId = searchParams.get('benefitId');

    if (!benefitId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: benefitId' },
        { status: 400 }
      );
    }

    const cardDoc = await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const cardData = cardDoc.data();
    const benefits = cardData?.benefits || [];

    const updatedBenefits = benefits.filter((b: Benefit) => b.id !== benefitId);

    await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .update({
        benefits: updatedBenefits,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting benefit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete benefit' },
      { status: 500 }
    );
  }
}

