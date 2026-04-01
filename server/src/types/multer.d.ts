declare module 'multer' {
  import type { Request } from 'express';

  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }

  export type StorageDestinationCallback = (
    error: Error | null,
    destination: string,
  ) => void;

  export type StorageFilenameCallback = (
    error: Error | null,
    filename: string,
  ) => void;

  export interface DiskStorageOptions {
    destination?:
      | string
      | ((
          request: Request,
          file: File,
          callback: StorageDestinationCallback,
        ) => void);
    filename?: (
      request: Request,
      file: File,
      callback: StorageFilenameCallback,
    ) => void;
  }

  export interface StorageEngine {
    _handleFile(
      request: Request,
      file: File,
      callback: (error?: Error | null, info?: Partial<File>) => void,
    ): void;
    _removeFile(
      request: Request,
      file: File,
      callback: (error: Error | null) => void,
    ): void;
  }

  export function diskStorage(options: DiskStorageOptions): StorageEngine;
}
