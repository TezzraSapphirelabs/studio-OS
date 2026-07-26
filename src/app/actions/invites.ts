'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import crypto from 'crypto';
import type { WorkspaceRole } from '@/types';

// Fallback to onboarding@resend.dev to avoid domain verification errors in dev
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev'; 
const WORKSPACE_INVITES_COL = 'workspaceInvites';
const WORKSPACE_MEMBERS_COL = 'workspaceMembers'; // Check what collection is used for members. Wait, I should verify the collection name.

export async function createWorkspaceInvite(
  workspaceId: string,
  inviteeEmail: string,
  role: WorkspaceRole,
  inviterUid: string
) {
  try {
    const emailStr = inviteeEmail.trim().toLowerCase();
    
    // 1. Verify inviter is owner/admin
    const membersSnap = await adminDb.collection('workspaceMembers')
      .where('workspaceId', '==', workspaceId)
      .where('userId', '==', inviterUid)
      .limit(1)
      .get();
      
    if (membersSnap.empty) {
      throw new Error('You are not a member of this workspace.');
    }
    
    const inviterRole = membersSnap.docs[0].data().role;
    if (inviterRole !== 'owner' && inviterRole !== 'admin') {
      throw new Error('Only owners and admins can invite members.');
    }

    // 2. Prevent duplicate pending invites
    const pendingInvites = await adminDb.collection(WORKSPACE_INVITES_COL)
      .where('workspaceId', '==', workspaceId)
      .where('inviteeEmail', '==', emailStr)
      .where('status', '==', 'pending')
      .get();
      
    if (!pendingInvites.empty) {
      throw new Error('A pending invitation already exists for this email.');
    }

    if (role === 'owner') {
      const ownerCountSnap = await adminDb.collection('workspaceMembers')
        .where('workspaceId', '==', workspaceId)
        .where('role', '==', 'owner')
        .count()
        .get();

      if (ownerCountSnap.data().count >= 2) {
        throw new Error('This workspace already has the maximum of two permanent owners.');
      }
    }

    // 3. Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 7);

    // 4. Store hashed token in Firestore
    const inviteData = {
      workspaceId,
      inviterUid,
      inviteeEmail: emailStr,
      role,
      status: 'pending',
      tokenHash,
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const docRef = await adminDb.collection(WORKSPACE_INVITES_COL).add(inviteData);

    // 5. Send email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/invite/${rawToken}`;
    
    await resend.emails.send({
      from: `Studio OS <${FROM_EMAIL}>`,
      to: emailStr,
      subject: 'You have been invited to join a Workspace on Studio OS',
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #111;">Studio OS</h2>
          <p>You've been invited to join a workspace as a <strong>${role}</strong>.</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Accept Invitation
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This invitation expires in 7 days.</p>
        </div>
      `
    });

    return { success: true, inviteId: docRef.id };
  } catch (error: any) {
    console.error('Server Action - createWorkspaceInvite error:', error);
    return { error: error.message || 'Failed to send invite' };
  }
}

export async function validateAndAcceptInvite(rawToken: string, currentUid: string) {
  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const invitesSnap = await adminDb.collection(WORKSPACE_INVITES_COL)
      .where('tokenHash', '==', tokenHash)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
      
    if (invitesSnap.empty) {
      throw new Error('Invalid or expired invitation.');
    }

    const inviteDoc = invitesSnap.docs[0];
    const invite = inviteDoc.data();

    if (new Date(invite.expiresAt) < new Date()) {
      await inviteDoc.ref.update({ status: 'expired' });
      throw new Error('This invitation has expired.');
    }
    
    // Check if user is already a member
    const memberSnap = await adminDb.collection('workspaceMembers')
      .where('workspaceId', '==', invite.workspaceId)
      .where('userId', '==', currentUid)
      .limit(1)
      .get();
      
    if (!memberSnap.empty) {
      // User is already a member, just mark invite used
      await inviteDoc.ref.update({ status: 'used', acceptedBy: currentUid });
      return { success: true, workspaceId: invite.workspaceId };
    }

    if (invite.role === 'owner') {
      const ownerCountSnap = await adminDb.collection('workspaceMembers')
        .where('workspaceId', '==', invite.workspaceId)
        .where('role', '==', 'owner')
        .count()
        .get();

      if (ownerCountSnap.data().count >= 2) {
        throw new Error('This workspace already has the maximum of two permanent owners. Ask an admin to invite you as a member instead.');
      }
    }

    const userSnap = await adminDb.collection('users').doc(currentUid).get();
    const userData = userSnap.data();

    // Add to workspace
    const batch = adminDb.batch();
    
    const newMemberRef = adminDb.collection('workspaceMembers').doc(`${invite.workspaceId}_${currentUid}`);
    batch.set(newMemberRef, {
      workspaceId: invite.workspaceId,
      userId: currentUid,
      email: userData?.email || invite.inviteeEmail,
      displayName: userData?.displayName || 'Unknown User',
      photoURL: userData?.photoURL || null,
      role: invite.role,
      joinedAt: new Date().toISOString()
    });

    batch.update(inviteDoc.ref, { 
      status: 'used',
      acceptedBy: currentUid,
      usedAt: new Date().toISOString()
    });

    await batch.commit();

    return { success: true, workspaceId: invite.workspaceId };
  } catch (error: any) {
    console.error('Server Action - validateAndAcceptInvite error:', error);
    return { error: error.message || 'Failed to accept invitation.' };
  }
}
