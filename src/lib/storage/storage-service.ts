import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { b2, B2_BUCKET } from './backblaze';

export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: B2_BUCKET,
    Key: key,
  });

  // URL valid for 1 hour
  return getSignedUrl(b2, command, { expiresIn: 3600 });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: B2_BUCKET,
    Key: key,
  });

  await b2.send(command);
}
