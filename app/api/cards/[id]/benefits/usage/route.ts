import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { Benefit, BenefitUsage } from '@/lib/types';

const CARDS_COLLECTION = 'creditCards';

// POST - Mark benefit usage for a period
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
    const { benefitId, period, used, notes } = body;

    if (!benefitId || !period || typeof used !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: benefitId, period, used' },
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

    const benefit = benefits.find((b: Benefit) => b.id === benefitId);
    if (!benefit) {
      return NextResponse.json({ error: 'Benefit not found' }, { status: 404 });
    }

    const usageHistory = benefit.usageHistory ?? [];
    const existingUsageIndex = usageHistory.findIndex(
      (u: BenefitUsage) => u.period === period
    );
    const updatedUsageHistory = [...usageHistory];

    // Create usage entry without undefined values (Firestore doesn't accept undefined)
    const usageEntry: any = {
      period,
      used,
    };
    
    if (used) {
      usageEntry.usedDate = new Date().toISOString();
    }
    
    if (notes !== undefined && notes !== null && notes !== '') {
      usageEntry.notes = notes;
    }

    if (existingUsageIndex >= 0) {
      // Update existing entry, preserving other fields
      const existing = updatedUsageHistory[existingUsageIndex];
      updatedUsageHistory[existingUsageIndex] = {
        ...existing,
        ...usageEntry,
      };
    } else {
      updatedUsageHistory.push(usageEntry);
    }

    const updatedBenefits = benefits.map((b: Benefit) =>
      b.id === benefitId ? { ...b, usageHistory: updatedUsageHistory } : b
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
    console.error('Error marking benefit usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark benefit usage' },
      { status: 500 }
    );
  }
}

