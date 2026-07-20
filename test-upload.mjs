import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const region = endpoint.includes('us-east-005') ? 'us-east-005' : 'us-east-1';
const B2_BUCKET = process.env.BACKBLAZE_BUCKET_NAME;

console.log('--- ENV CHECK ---');
console.log('BACKBLAZE_KEY_ID present:', !!process.env.BACKBLAZE_KEY_ID);
console.log('BACKBLAZE_APPLICATION_KEY present:', !!process.env.BACKBLAZE_APPLICATION_KEY);
console.log('BACKBLAZE_BUCKET_NAME:', B2_BUCKET);
console.log('BACKBLAZE_ENDPOINT:', endpoint);

const b2 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID || '',
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY || '',
  },
});

async function run() {
  try {
    const key = 'test-upload-from-node.txt';
    const contentType = 'text/plain';
    
    console.log('\n--- GENERATING PRESIGNED URL ---');
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    
    const url = await getSignedUrl(b2, command, { expiresIn: 3600 });
    console.log('URL generated successfully.');
    
    console.log('\n--- ATTEMPTING UPLOAD VIA FETCH ---');
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: 'Hello from Node test script',
    });
    
    console.log('Upload HTTP Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Upload Response Body:', body);
    
  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();
