import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import serviceAccount from '../firebaseKey.json';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function initializeFirebaseAdmin() {
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminDb = getFirestore(adminApp);
    return;
  }

  try {
    // Initialize Firebase Admin with service account
    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
    });
    
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    adminApp = undefined;
    adminDb = undefined;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export { adminDb, adminApp };

// Helper function to check if Firebase Admin is initialized
export function isFirebaseAdminInitialized(): boolean {
  return !!adminApp && !!adminDb;
}

