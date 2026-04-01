import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import {
  diskStorage,
  type File as MulterFile,
  type StorageEngine,
} from 'multer';

export const uploadsDir = join(process.cwd(), 'uploads');
export const paymentProofsDir = join(
  uploadsDir,
  'payment-proofs',
);
export const productImagesDir = join(uploadsDir, 'product-images');

export function ensureUploadDirectories() {
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(paymentProofsDir, { recursive: true });
  mkdirSync(productImagesDir, { recursive: true });
}

function buildStorage(targetDir: string, prefix: string): StorageEngine {
  ensureUploadDirectories();

  return diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, targetDir);
    },
    filename: (_request, file: MulterFile, callback) => {
      const extension =
        extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeTimestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      callback(null, `${prefix}-${safeTimestamp}-${randomSuffix}${extension}`);
    },
  });
}

export function paymentProofStorage(): StorageEngine {
  return buildStorage(paymentProofsDir, 'proof');
}

export function productImageStorage(): StorageEngine {
  return buildStorage(productImagesDir, 'product');
}

export function isManagedUploadPath(publicPath?: string | null) {
  return Boolean(publicPath?.startsWith('/uploads/'));
}

export function removeLocalUploadFile(publicPath?: string | null) {
  if (!publicPath?.startsWith('/uploads/')) {
    return;
  }

  const normalizedPublicPath = publicPath.replace(/^\/uploads\//, '');
  const absolutePath = normalize(join(uploadsDir, normalizedPublicPath));

  if (!absolutePath.startsWith(normalize(uploadsDir))) {
    return;
  }

  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
  }
}
