'use client';

import { useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ZoomIn,
} from 'lucide-react';

export interface PhotoFile {
  /** Unique identifier */
  id: string;
  /** File object */
  file: File;
  /** Preview URL (blob URL) */
  preview: string;
  /** Upload status */
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  /** Uploaded URL (after successful upload) */
  url?: string;
  /** Error message if upload failed */
  error?: string;
  /** Upload progress (0-100) */
  progress?: number;
}

export interface PhotoUploaderProps {
  /** Current photos */
  value?: PhotoFile[];
  /** Change handler */
  onChange?: (photos: PhotoFile[]) => void;
  /** Upload handler - receives file, returns URL */
  onUpload?: (file: File) => Promise<string>;
  /** Maximum number of photos */
  maxPhotos?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Accepted file types */
  accept?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Minimum required photos */
  minPhotos?: number;
  /** Label for the upload area */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Show camera option for mobile */
  showCamera?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

const DEFAULT_MAX_PHOTOS = 5;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';

/**
 * Generate unique ID
 */
const generateId = () => `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * PhotoUploader Component
 * A component for uploading multiple photos with preview
 */
export function PhotoUploader({
  value = [],
  onChange,
  onUpload,
  maxPhotos = DEFAULT_MAX_PHOTOS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  accept = DEFAULT_ACCEPT,
  disabled = false,
  minPhotos = 0,
  label = 'اضغط لإضافة صورة',
  helpText,
  showCamera = true,
  className,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canAddMore = value.length < maxPhotos && !disabled;
  const photosNeeded = Math.max(0, minPhotos - value.length);

  // Process and add files
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const availableSlots = maxPhotos - value.length;

      if (availableSlots <= 0) return;

      const filesToProcess = fileArray.slice(0, availableSlots);
      const newPhotos: PhotoFile[] = [];

      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Validate file size
        if (file.size > maxFileSize) {
          continue;
        }

        const photo: PhotoFile = {
          id: generateId(),
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
        };

        newPhotos.push(photo);
      }

      if (newPhotos.length === 0) return;

      // Add photos to state
      const updatedPhotos = [...value, ...newPhotos];
      onChange?.(updatedPhotos);

      // Upload if handler provided
      if (onUpload) {
        for (const photo of newPhotos) {
          try {
            // Update status to uploading
            onChange?.(
              updatedPhotos.map((p) =>
                p.id === photo.id ? { ...p, status: 'uploading' } : p
              )
            );

            const url = await onUpload(photo.file);

            // Update status to uploaded
            onChange?.((current) =>
              current.map((p) =>
                p.id === photo.id ? { ...p, status: 'uploaded', url } : p
              )
            );
          } catch (error) {
            // Update status to error
            onChange?.((current) =>
              current.map((p) =>
                p.id === photo.id
                  ? {
                      ...p,
                      status: 'error',
                      error: error instanceof Error ? error.message : 'فشل الرفع',
                    }
                  : p
              )
            );
          }
        }
      }
    },
    [value, maxPhotos, maxFileSize, onChange, onUpload]
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Remove photo
  const handleRemove = (photoId: string) => {
    const photo = value.find((p) => p.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.preview);
    }
    onChange?.(value.filter((p) => p.id !== photoId));
  };

  // Open preview modal
  const handlePreview = (preview: string) => {
    setPreviewImage(preview);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Upload area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'relative border-2 border-dashed rounded-xl p-6 transition-all duration-200',
            'flex flex-col items-center justify-center gap-3',
            {
              'border-primary-400 bg-primary-50': isDragging,
              'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100':
                !isDragging && !disabled,
              'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed': disabled,
            }
          )}
        >
          <div className="flex items-center gap-3">
            {showCamera && (
              <>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-colors',
                    'bg-primary-100 text-primary-600 hover:bg-primary-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500'
                  )}
                  aria-label="التقاط صورة"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">الكاميرا</span>
                </button>
                <div className="w-px h-10 bg-gray-300" />
              </>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={clsx(
                'flex flex-col items-center gap-1 p-3 rounded-lg transition-colors',
                'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label="رفع صورة من المعرض"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs font-medium">المعرض</span>
            </button>
          </div>

          <p className="text-sm text-gray-500">{label}</p>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            className="sr-only"
            disabled={disabled}
          />
          {showCamera && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="sr-only"
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Photos needed indicator */}
      {photosNeeded > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            يجب إضافة {photosNeeded} {photosNeeded === 1 ? 'صورة' : 'صور'} على الأقل
          </span>
        </div>
      )}

      {/* Photo counter */}
      <div className="text-sm text-gray-500">
        {value.length} / {maxPhotos} صورة
      </div>

      {/* Photo grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {value.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              {/* Image */}
              <img
                src={photo.preview}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Uploading overlay */}
              {photo.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {photo.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              )}

              {/* Hover actions */}
              <div
                className={clsx(
                  'absolute inset-0 bg-black/40 flex items-center justify-center gap-2',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  { 'opacity-100': photo.status === 'error' }
                )}
              >
                {/* Preview button */}
                <button
                  type="button"
                  onClick={() => handlePreview(photo.preview)}
                  className="p-1.5 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
                  aria-label="عرض الصورة"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(photo.id)}
                    className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    aria-label="حذف الصورة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* File size badge */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {formatFileSize(photo.file.size)}
              </div>
            </div>
          ))}

          {/* Empty placeholder slots */}
          {canAddMore &&
            Array.from({ length: Math.min(3, maxPhotos - value.length) }).map((_, index) => (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={clsx(
                  'aspect-square rounded-lg border-2 border-dashed border-gray-200',
                  'flex items-center justify-center',
                  'hover:border-gray-300 hover:bg-gray-50 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="إضافة صورة"
              >
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </button>
            ))}
        </div>
      )}

      {/* Preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreviewImage(null)}
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
