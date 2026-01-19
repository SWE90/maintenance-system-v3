import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * File Upload Security Interceptor
 *
 * Features:
 * - Whitelist file extensions
 * - Validate file size limits
 * - Sanitize file names
 * - Generate secure file names
 * - Validate MIME types
 */
@Injectable()
export class FileSecurityInterceptor implements NestInterceptor {
  // Allowed file extensions (images and documents only)
  private readonly ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
  ];

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Max file size: 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Max files per request
  private readonly MAX_FILES = 10;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files;

    if (file) {
      this.validateFile(file);
      this.sanitizeFile(file);
    }

    if (files) {
      if (Array.isArray(files)) {
        if (files.length > this.MAX_FILES) {
          throw new BadRequestException(
            `يُسمح برفع ${this.MAX_FILES} ملفات كحد أقصى في المرة الواحدة`,
          );
        }
        files.forEach((f) => {
          this.validateFile(f);
          this.sanitizeFile(f);
        });
      } else {
        // files is an object with field names as keys
        Object.values(files).forEach((fileArray: any) => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach((f) => {
              this.validateFile(f);
              this.sanitizeFile(f);
            });
          }
        });
      }
    }

    return next.handle();
  }

  /**
   * Validate file extension, MIME type, and size
   */
  private validateFile(file: any): void {
    if (!file) return;

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `حجم الملف يجب أن يكون أقل من ${this.MAX_FILE_SIZE / 1024 / 1024} ميجابايت`,
      );
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `امتداد الملف غير مسموح. الامتدادات المسموحة: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مسموح');
    }

    // Additional security: Check if extension matches MIME type
    if (!this.isMimeTypeValid(ext, file.mimetype)) {
      throw new BadRequestException(
        'امتداد الملف لا يطابق نوع الملف الفعلي',
      );
    }
  }

  /**
   * Check if file extension matches MIME type
   */
  private isMimeTypeValid(ext: string, mimeType: string): boolean {
    const mimeMap: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    };

    const validMimes = mimeMap[ext] || [];
    return validMimes.includes(mimeType);
  }

  /**
   * Sanitize and secure file name
   */
  private sanitizeFile(file: any): void {
    if (!file) return;

    // Generate secure random filename while preserving extension
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    // Store original name for reference
    file.originalFilename = file.originalname;

    // Generate new secure filename
    file.filename = `${timestamp}-${randomName}${ext}`;

    // Sanitize original name (remove special characters)
    file.originalname = this.sanitizeFilename(file.originalname);
  }

  /**
   * Sanitize filename by removing special characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove any characters that aren't alphanumeric, dash, underscore, or dot
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Prevent directory traversal
    const parts = sanitized.split(path.sep);
    return parts[parts.length - 1];
  }
}
