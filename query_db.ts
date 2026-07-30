import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin (assuming a service account is available or emulator is running)
// The project uses `src/lib/firebase-admin.ts`, we can just import it!

async function main() {
  const { adminDb } = require('./src/lib/firebase-admin');
  
  const snap = await adminDb.collection('users').get();
  const users = snap.docs.map((doc: any) => doc.data());
  
  console.log('--- ALL USERS ---');
  users.forEach((u: any) => {
    console.log(`UID: ${u.uid} | Role: ${u.role} | Status: ${u.status === undefined ? 'undefined' : `'${u.status}'`}`);
  });
  
  const pendingSnap = await adminDb.collection('users').where('status', '==', 'pending').get();
  console.log(`\n--- PENDING USERS (count: ${pendingSnap.size}) ---`);
}

main().catch(console.error);
