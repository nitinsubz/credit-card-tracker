import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
function validateFirebaseConfig(): boolean {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  
  for (const field of requiredFields) {
    const value = firebaseConfig[field];
    if (!value || value.trim() === '' || value.includes('your_') || value.includes('_here')) {
      return false;
    }
  }
  return true;
}

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

function initializeFirebase() {
  if (!validateFirebaseConfig()) {
    console.warn(
      'Firebase configuration is missing or incomplete. Please set up your .env.local file with Firebase credentials.'
    );
    return;
  }

  try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    app = undefined;
    db = undefined;
    auth = undefined;
  }
}

// Initialize Firebase
initializeFirebase();

export { db, auth };

// Helper function to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return !!app && !!db && validateFirebaseConfig();
}

