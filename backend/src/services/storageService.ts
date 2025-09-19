import AWS from 'aws-sdk';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';

function uuidv4() {
  return crypto.randomUUID();
}

// Configure MinIO/S3 client
const s3Client = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'slack-files';

// Supported file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  private multerConfig = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
      }
    },
  });

  async initializeBucket() {
    try {
      const bucketExists = await s3Client.headBucket({ Bucket: BUCKET_NAME }).promise()
        .then(() => true)
        .catch(() => false);

      if (!bucketExists) {
        await s3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`Created bucket: ${BUCKET_NAME}`);
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
      throw new Error('Failed to initialize storage');
    }
  }

  getUploadMiddleware() {
    return this.multerConfig;
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const key = `uploads/${filename}`;

      let processedBuffer = file.buffer;

      // Process images (resize if too large)
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        processedBuffer = await this.processImage(file.buffer, file.mimetype);
      }

      // Upload to S3/MinIO
      await s3Client.upload({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }).promise();

      // Generate public URL
      const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;

      return {
        filename,
        originalName: file.originalname,
        url,
        size: processedBuffer.length,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const key = `uploads/${filename}`;
      await s3Client.deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async generatePresignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    try {
      const key = `uploads/${filename}`;
      const url = s3Client.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
      });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  private async processImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      const maxWidth = 1920;
      const maxHeight = 1080;
      const quality = 80;

      let sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Only resize if image is larger than max dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      // Apply compression based on format
      if (mimeType === 'image/jpeg') {
        return sharpInstance.jpeg({ quality }).toBuffer();
      } else if (mimeType === 'image/png') {
        return sharpInstance.png({ compressionLevel: 8 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        return sharpInstance.webp({ quality }).toBuffer();
      }

      // For other formats, return original buffer
      return buffer;
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original buffer if processing fails
      return buffer;
    }
  }

  isImageFile(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
  }

  getFileIcon(mimeType: string): string {
    const iconMap: { [key: string]: string } = {
      'application/pdf': '📄',
      'text/plain': '📝',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/json': '🔧',
      'text/csv': '📊',
      'application/zip': '🗜️',
      'application/x-zip-compressed': '🗜️',
    };

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return '🖼️';
    }

    return iconMap[mimeType] || '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const storageService = new StorageService();
