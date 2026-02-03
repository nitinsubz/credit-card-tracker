import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
let adminApp;
let adminDb;
function getServiceAccountPath() {
    const possiblePaths = [
        join(process.cwd(), 'firebaseKey.json'),
        join(process.cwd(), '..', 'firebaseKey.json'),
        join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'firebaseKey.json'),
    ];
    for (const p of possiblePaths) {
        try {
            readFileSync(p, 'utf8');
            return p;
        }
        catch {
            continue;
        }
    }
    throw new Error('firebaseKey.json not found. Place it in the project root (credit-card-tracker/firebaseKey.json)');
}
export function initializeFirebase() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        adminDb = getFirestore(adminApp);
        return true;
    }
    try {
        const serviceAccountPath = getServiceAccountPath();
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });
        adminDb = getFirestore(adminApp);
        return true;
    }
    catch (error) {
        console.error('Error initializing Firebase:', error);
        adminApp = undefined;
        adminDb = undefined;
        return false;
    }
}
export function getDb() {
    return adminDb;
}
export function isInitialized() {
    return !!adminApp && !!adminDb;
}
