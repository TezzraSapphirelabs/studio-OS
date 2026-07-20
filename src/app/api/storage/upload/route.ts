import { NextResponse } from 'next/server';
import { Upload } from '@aws-sdk/lib-storage';
import { b2, B2_BUCKET } from '@/lib/storage/backblaze';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allows up to 1 minute execution

export async function POST(req: Request) {
  try {
    const key = req.headers.get('x-file-key');
    const contentType = req.headers.get('content-type') || 'application/octet-stream';

    if (!key) {
      return NextResponse.json({ error: 'Missing x-file-key header' }, { status: 400 });
    }

    if (!req.body) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    // Pass the Web ReadableStream directly to @aws-sdk/lib-storage Upload
    const upload = new Upload({
      client: b2,
      params: {
        Bucket: B2_BUCKET,
        Key: key,
        Body: req.body as unknown as ReadableStream, // @aws-sdk/lib-storage supports Web ReadableStream
        ContentType: contentType,
      },
    });

    // Support cancellation if the browser aborts the request
    req.signal.addEventListener('abort', () => {
      upload.abort().catch(console.error);
    });

    await upload.done();

    return NextResponse.json({ success: true, message: 'Uploaded successfully via stream' });
  } catch (error: unknown) {
    console.error('Error during streaming upload:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
