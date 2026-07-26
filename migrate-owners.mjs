import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// 1. Initialize Firebase Admin
const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');
const keyJson = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const app = initializeApp({
  credential: cert(keyJson),
});

const db = getFirestore(app);

async function migrate() {
  console.log('🚀 Starting Option B Migration: Explicit Ownership');

  try {
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users. Checking for missing workspace owner records...`);

    let addedCount = 0;
    const batch = db.batch();
    
    for (const doc of usersSnap.docs) {
      const userData = doc.data();
      const workspaceId = doc.id; // user id is workspace id
      const memberId = `${workspaceId}_${workspaceId}`;
      
      const memberRef = db.collection('workspaceMembers').doc(memberId);
      const memberDoc = await memberRef.get();
      
      if (!memberDoc.exists) {
        batch.set(memberRef, {
          workspaceId: workspaceId,
          userId: workspaceId,
          email: userData.email || '',
          displayName: userData.displayName || 'Owner',
          photoURL: userData.photoURL || null,
          role: 'owner',
          joinedAt: userData.createdAt || new Date().toISOString(),
        });
        addedCount++;
        console.log(`Prepared owner document for workspace: ${workspaceId}`);
      }
    }

    if (addedCount > 0) {
      console.log(`Committing batch of ${addedCount} documents...`);
      await batch.commit();
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ No migration needed. All owners already exist.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
