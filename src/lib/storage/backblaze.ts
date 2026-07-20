import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const region = endpoint.includes('us-east-005') ? 'us-east-005' : 'us-east-1'; // Default or inferred region

export const b2 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID || '',
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY || '',
  },
});

export const B2_BUCKET = process.env.BACKBLAZE_BUCKET_NAME || 'studio-os-cmp-2026';
