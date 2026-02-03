import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { CreditCard } from '@/lib/types';

const CARDS_COLLECTION = 'creditCards';

// GET - Get all credit cards
export async function GET() {
  try {
    if (!isFirebaseAdminInitialized() || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    const snapshot = await adminDb
      .collection(CARDS_COLLECTION)
      .orderBy('openedDate', 'desc')
      .get();

    const cards: CreditCard[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        openedDate: data.openedDate,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as CreditCard;
    });

    return NextResponse.json(cards);
  } catch (error: any) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST - Add a new credit card
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseAdminInitialized() || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, bank, openedDate, annualFee, benefits } = body;

    if (!name || !bank || !openedDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, bank, openedDate' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const cardData = {
      name,
      bank,
      openedDate,
      annualFee: annualFee || 0,
      benefits: benefits || [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(CARDS_COLLECTION).add(cardData);

    return NextResponse.json({ id: docRef.id, ...cardData }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add card' },
      { status: 500 }
    );
  }
}

