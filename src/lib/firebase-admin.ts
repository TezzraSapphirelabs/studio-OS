import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

function getFirebaseCredentials() {
  const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');
  
  if (fs.existsSync(keyPath)) {
    try {
      const keyJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      return cert(keyJson);
    } catch {
      console.warn('⚠️ Found firebase-admin-key.json but could not parse it.');
    }
  }
  
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  
  return null;
}

const credential = getFirebaseCredentials();

if (!credential && getApps().length === 0) {
  console.error('\n❌ CRITICAL: Missing Firebase Admin credentials.');
  console.error('Please either:');
  console.error('  1. Place your service account JSON file at the root as "firebase-admin-key.json"');
  console.error('  2. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.\n');
}

const app = getApps().length === 0 ? initializeApp(credential ? { credential } : {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}) : getApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
