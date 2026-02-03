import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { CreditCard } from '@/lib/types';

const CARDS_COLLECTION = 'creditCards';

// GET - Get a single credit card
export async function GET(
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

    const doc = await adminDb.collection(CARDS_COLLECTION).doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const data = doc.data();
    const card: CreditCard = {
      id: doc.id,
      ...data,
      openedDate: data?.openedDate,
      createdAt: data?.createdAt || new Date().toISOString(),
      updatedAt: data?.updatedAt || new Date().toISOString(),
    } as CreditCard;

    return NextResponse.json(card);
  } catch (error: any) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

// PUT - Update a credit card
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
    
    // Remove undefined values from updates (Firestore doesn't accept undefined)
    const cleanUpdates: any = {
      updatedAt: new Date().toISOString(),
    };
    Object.keys(body).forEach(key => {
      const value = body[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    await adminDb
      .collection(CARDS_COLLECTION)
      .doc(params.id)
      .update(cleanUpdates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update card' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a credit card
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

    await adminDb.collection(CARDS_COLLECTION).doc(params.id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete card' },
      { status: 500 }
    );
  }
}

