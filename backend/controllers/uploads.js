import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import config from '../config.js';
import { HttpError, badRequest } from '../lib/httpError.js';

const MAX_BYTES = 5 * 1024 * 1024;

// Detect the type from the file's leading bytes; the client-declared mimetype is not trusted.
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'gif', mime: 'image/gif', test: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
];

/**
 * Middleware that reads a single image (max 5 MB) from the `image` form field into memory.
 */
export const parseImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('image');

/**
 * Checks the uploaded file really is an image and picks a random file name for it.
 * @param {Express.Multer.File | undefined} file - The uploaded file.
 * @returns {{ext: string, mime: string, key: string}} Detected type and storage key.
 * @throws {HttpError} 400 when no file was sent or it is not a supported image.
 */
const detectImage = (file) => {
  if (!file) throw badRequest('Attach an image in the "image" field.');
  const type = SIGNATURES.find(({ test }) => test(file.buffer));
  if (!type) throw badRequest('Only JPEG, PNG, GIF or WebP images are allowed.');
  return { ...type, key: `${randomUUID()}.${type.ext}` };
};

/**
 * POST /api/uploads (admin) - Saves an image to the local upload folder.
 * @param {import('express').Request} req
 * @param {import('express').Response} res - Responds with the image's public path.
 */
export const uploadLocal = async (req, res) => {
  const { key } = detectImage(req.file);
  await mkdir(config.uploads.dir, { recursive: true });
  await writeFile(path.join(config.uploads.dir, key), req.file.buffer);
  res.status(201).send(`/uploads/${key}`);
};

let s3Client;

/**
 * POST /api/uploads/s3 (admin) - Uploads an image to the configured S3 bucket.
 * The AWS SDK is loaded on first use; credentials come from the AWS default chain.
 * @param {import('express').Request} req
 * @param {import('express').Response} res - Responds with the image's public S3 URL.
 * @throws {HttpError} 503 when S3_BUCKET is not set.
 */
export const uploadS3 = async (req, res) => {
  const { s3Bucket, s3Region } = config.uploads;
  if (!s3Bucket) throw new HttpError(503, 'S3 uploads are not configured.');

  const { key, mime } = detectImage(req.file);
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  s3Client ??= new S3Client({ region: s3Region });
  await s3Client.send(
    new PutObjectCommand({ Bucket: s3Bucket, Key: key, Body: req.file.buffer, ContentType: mime }),
  );
  res.status(201).send(`https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`);
};
