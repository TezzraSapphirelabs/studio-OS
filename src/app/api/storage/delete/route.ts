import { NextResponse } from 'next/server';
import { deleteObject } from '@/lib/storage/storage-service';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    await deleteObject(key);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting object:', error);
    return NextResponse.json({ error: 'Failed to delete object' }, { status: 500 });
  }
}
