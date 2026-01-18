'use client';

import { useState, useCallback } from 'react';
import { PhotoUploader, PhotoFile } from '@/components/ui';
import { api } from '@/lib/api';
import { TicketStatus } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  X,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface StartInspectionModalProps {
  /** Task ID */
  taskId: number;
  /** Close handler */
  onClose: (refresh?: boolean) => void;
}

/**
 * StartInspectionModal Component
 * Modal for starting inspection with photo upload (min 1) and optional notes
 */
export function StartInspectionModal({
  taskId,
  onClose,
}: StartInspectionModalProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form is valid
  const isValid = photos.length >= 1;

  // Handle photo upload
  const handleUpload = useCallback(async (file: File): Promise<string> => {
    // In production, this would upload to your file storage
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 500);
    });
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Get current location
      const location = await getCurrentLocation();

      // Get photo URLs (in production, these would be uploaded URLs)
      const photoUrls = photos
        .filter((p) => p.status === 'uploaded' || p.status === 'pending')
        .map((p) => p.url || p.preview);

      // Call API to start inspection
      await api.transitionTask(taskId, {
        toStatus: TicketStatus.INSPECTING,
        notes: notes || undefined,
        location,
        photos: photoUrls,
      });

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'فشل في بدء الفحص');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose()}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">بدء الفحص</h2>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="label">
              صور الجهاز قبل الفحص
              <span className="text-red-500 mr-1">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              يجب رفع صورة واحدة على الأقل
            </p>
            <PhotoUploader
              value={photos}
              onChange={setPhotos}
              onUpload={handleUpload}
              minPhotos={1}
              maxPhotos={5}
              showCamera
              label="اضغط لإضافة صورة للجهاز"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات عن حالة الجهاز..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose()}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>بدء الفحص</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartInspectionModal;
