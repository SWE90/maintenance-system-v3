'use client';

import { useState, useCallback } from 'react';
import { PhotoUploader, PhotoFile } from '@/components/ui';
import { api } from '@/lib/api';
import { TicketStatus } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  X,
  Package,
  Loader2,
  AlertCircle,
  Camera,
} from 'lucide-react';

export interface PartsRequestModalProps {
  /** Task ID */
  taskId: number;
  /** Close handler */
  onClose: (refresh?: boolean) => void;
}

/**
 * PartsRequestModal Component
 * Modal for requesting parts with serial photo (required), part name, and notes
 */
export function PartsRequestModal({
  taskId,
  onClose,
}: PartsRequestModalProps) {
  const [serialPhotos, setSerialPhotos] = useState<PhotoFile[]>([]);
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form is valid
  const isValid = serialPhotos.length >= 1 && partName.trim().length > 0;

  // Handle photo upload
  const handleUpload = useCallback(async (file: File): Promise<string> => {
    // In production, this would upload to your file storage
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
      // Get photo URLs
      const photoUrls = serialPhotos
        .filter((p) => p.status === 'uploaded' || p.status === 'pending')
        .map((p) => p.url || p.preview);

      // Call API to request parts
      await api.transitionTask(taskId, {
        toStatus: TicketStatus.WAITING_PARTS,
        partsRequest: {
          partName: partName.trim(),
          partNumber: partNumber.trim() || undefined,
          quantity,
          notes: notes.trim() || undefined,
          serialPhotos: photoUrls,
        },
      });

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'فشل في طلب قطع الغيار');
    } finally {
      setIsSubmitting(false);
    }
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
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">طلب قطع غيار</h2>
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

          {/* Serial Photo */}
          <div>
            <label className="label">
              صورة الرقم التسلسلي
              <span className="text-red-500 mr-1">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              التقط صورة واضحة للرقم التسلسلي على الجهاز
            </p>
            <PhotoUploader
              value={serialPhotos}
              onChange={setSerialPhotos}
              onUpload={handleUpload}
              minPhotos={1}
              maxPhotos={3}
              showCamera
              label="صورة الرقم التسلسلي"
            />
          </div>

          {/* Part Name */}
          <div>
            <label className="label">
              اسم القطعة
              <span className="text-red-500 mr-1">*</span>
            </label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="مثال: ضاغط، موتور، ثرموستات..."
              className="input"
            />
          </div>

          {/* Part Number */}
          <div>
            <label className="label">رقم القطعة (اختياري)</label>
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="رقم القطعة إن وجد"
              className="input font-mono"
              dir="ltr"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="label">الكمية</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-20 text-center input"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات إضافية عن القطعة المطلوبة..."
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
              'bg-amber-600 text-white hover:bg-amber-700',
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
                <Package className="w-4 h-4" />
                <span>طلب القطعة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PartsRequestModal;
