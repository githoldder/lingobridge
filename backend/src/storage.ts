import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const storageRoot = path.resolve(process.cwd(), 'backend/storage');

export function publicUrlFor(relativePath: string) {
  return `/uploads/${relativePath.replaceAll(path.sep, '/')}`;
}

export async function saveBase64File(params: {
  base64: string;
  filename: string;
  folder: string;
}) {
  const id = crypto.randomUUID();
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const relativePath = `${params.folder}/${id}-${safeName}`;
  const absoluteDir = path.join(storageRoot, params.folder);
  const absolutePath = path.join(storageRoot, relativePath);
  await mkdir(absoluteDir, { recursive: true });
  const payload = params.base64.includes(',') ? params.base64.split(',').pop() || '' : params.base64;
  const buffer = Buffer.from(payload, 'base64');
  await writeFile(absolutePath, buffer);
  return {
    id,
    relativePath,
    absolutePath,
    sizeBytes: buffer.byteLength,
    url: publicUrlFor(relativePath)
  };
}

export async function saveBufferFile(params: {
  buffer: Buffer;
  filename: string;
  folder: string;
}) {
  const id = crypto.randomUUID();
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const relativePath = `${params.folder}/${id}-${safeName}`;
  const absoluteDir = path.join(storageRoot, params.folder);
  const absolutePath = path.join(storageRoot, relativePath);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, params.buffer);
  return {
    id,
    relativePath,
    absolutePath,
    sizeBytes: params.buffer.byteLength,
    url: publicUrlFor(relativePath)
  };
}

export { storageRoot };
