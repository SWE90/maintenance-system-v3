'use client';

import { useState, useCallback } from 'react';
import { PhotoUploader, PhotoFile } from '@/components/ui';
import { api } from '@/lib/api';
import { TicketStatus } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  X,
  Truck,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface PickupDeviceModalProps {
  /** Task ID */
  taskId: number;
  /** Close handler */
  onClose: (refresh?: boolean) => void;
}

/** Predefined pickup reasons */
const PICKUP_REASONS = [
  'يحتاج فحص بالورشة',
  'قطع غيار غير متوفرة بالموقع',
  'إصلاح يتطلب معدات خاصة',
  'ضمان المصنع يتطلب الإصلاح بالورشة',
  'طلب العميل',
  'أخرى',
];

/**
 * PickupDeviceModal Component
 * Modal for device pickup with reason, photos, and customer acknowledgment
 */
export function PickupDeviceModal({
  taskId,
  onClose,
}: PickupDeviceModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [customerAcknowledged, setCustomerAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form is valid
  const isValid =
    (selectedReason && selectedReason !== 'أخرى' ? true : customReason.trim().length > 0) &&
    customerAcknowledged;

  // Handle photo upload
  const handleUpload = useCallback(async (file: File): Promise<string> => {
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
      // Get final reason
      const reason = selectedReason === 'أخرى' ? customReason.trim() : selectedReason;

      // Get photo URLs
      const photoUrls = photos
        .filter((p) => p.status === 'uploaded' || p.status === 'pending')
        .map((p) => p.url || p.preview);

      // Call API to pickup device
      await api.transitionTask(taskId, {
        toStatus: TicketStatus.PICKUP_DEVICE,
        pickupData: {
          reason,
          photos: photoUrls,
          customerAcknowledged,
        },
      });

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'فشل في تسجيل سحب الجهاز');
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
            <Truck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">سحب الجهاز</h2>
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

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 text-purple-800 rounded-lg">
            <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">سحب الجهاز للورشة</p>
              <p>سيتم نقل الجهاز للورشة للإصلاح وإعادته بعد الانتهاء.</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="label">
              سبب سحب الجهاز
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="space-y-2">
              {PICKUP_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-right',
                    selectedReason === reason
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      selectedReason === reason
                        ? 'bg-purple-500'
                        : 'border border-gray-300'
                    )}
                  >
                    {selectedReason === reason && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          {selectedReason === 'أخرى' && (
            <div>
              <label className="label">
                حدد السبب
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="اكتب سبب سحب الجهاز..."
                className="input"
              />
            </div>
          )}

          {/* Photos */}
          <div>
            <label className="label">صور الجهاز (اختياري)</label>
            <p className="text-sm text-gray-500 mb-2">
              التقط صور للجهاز قبل السحب للتوثيق
            </p>
            <PhotoUploader
              value={photos}
              onChange={setPhotos}
              onUpload={handleUpload}
              maxPhotos={5}
              showCamera
              label="التقط صور للجهاز"
            />
          </div>

          {/* Customer Acknowledgment */}
          <div className="pt-2">
            <button
              onClick={() => setCustomerAcknowledged(!customerAcknowledged)}
              className={clsx(
                'w-full flex items-start gap-3 p-4 rounded-lg border transition-colors text-right',
                customerAcknowledged
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div
                className={clsx(
                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5',
                  customerAcknowledged
                    ? 'bg-green-500 text-white'
                    : 'border border-gray-300'
                )}
              >
                {customerAcknowledged && <Check className="w-3 h-3" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  تأكيد موافقة العميل
                  <span className="text-red-500 mr-1">*</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  أؤكد أن العميل وافق على سحب الجهاز للورشة وتم إبلاغه بالإجراءات
                </p>
              </div>
            </button>
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
              'bg-purple-600 text-white hover:bg-purple-700',
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
                <Truck className="w-4 h-4" />
                <span>تأكيد السحب</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PickupDeviceModal;
