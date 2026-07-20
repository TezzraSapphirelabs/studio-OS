import { NextResponse } from 'next/server';
import { generateDownloadUrl } from '@/lib/storage/storage-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const url = await generateDownloadUrl(path);
    return NextResponse.redirect(url);
  } catch (error: unknown) {
    console.error('Error getting file url:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}
