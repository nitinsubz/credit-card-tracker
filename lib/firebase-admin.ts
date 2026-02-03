import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function getServiceAccount() {
  // Vercel / production: use env var (paste entire firebaseKey.json as JSON string)
  const envCreds = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envCreds) {
    try {
      return JSON.parse(envCreds);
    } catch {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
      return null;
    }
  }
  // Local dev: use firebaseKey.json
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../firebaseKey.json');
  } catch {
    return null;
  }
}

function initializeFirebaseAdmin() {
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0] as App;
    adminDb = getFirestore(adminApp);
    return;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    console.error('Firebase Admin: No credentials. Set FIREBASE_SERVICE_ACCOUNT (Vercel) or add firebaseKey.json (local).');
    return;
  }

  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
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

