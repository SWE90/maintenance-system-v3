'use client';

import { useState, useCallback } from 'react';
import { PhotoUploader, PhotoFile } from '@/components/ui';
import { api } from '@/lib/api';
import { TicketStatus, NOT_FIXED_REASONS_AR } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  X,
  XCircle,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface NotFixedModalProps {
  /** Task ID */
  taskId: number;
  /** Close handler */
  onClose: (refresh?: boolean) => void;
}

/**
 * NotFixedModal Component
 * Modal for marking a task as not fixed with reasons checklist, notes, and evidence photo
 */
export function NotFixedModal({
  taskId,
  onClose,
}: NotFixedModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<PhotoFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form is valid
  const isValid = selectedReasons.length > 0 || otherReason.trim().length > 0;

  // Toggle reason selection
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

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
      // Compile reasons
      const reasons = [...selectedReasons];
      if (otherReason.trim()) {
        reasons.push(otherReason.trim());
      }

      // Get evidence photo URLs
      const photoUrls = evidencePhotos
        .filter((p) => p.status === 'uploaded' || p.status === 'pending')
        .map((p) => p.url || p.preview);

      // Call API to mark as not fixed
      await api.transitionTask(taskId, {
        toStatus: TicketStatus.NOT_FIXED,
        notFixedData: {
          reasons,
          notes: notes.trim() || undefined,
          evidencePhoto: photoUrls[0],
        },
      });

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'فشل في تسجيل عدم الإصلاح');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out "أخرى" from predefined list since we handle it separately
  const predefinedReasons = NOT_FIXED_REASONS_AR.filter((r) => r !== 'أخرى');

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
            <XCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">لم يتم الإصلاح</h2>
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

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">تنبيه</p>
              <p>سيتم إغلاق المهمة بحالة "لم يتم الإصلاح". يرجى تحديد السبب.</p>
            </div>
          </div>

          {/* Reasons Checklist */}
          <div>
            <label className="label">
              سبب عدم الإصلاح
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-right',
                    selectedReasons.includes(reason)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                      selectedReasons.includes(reason)
                        ? 'bg-red-500 text-white'
                        : 'border border-gray-300'
                    )}
                  >
                    {selectedReasons.includes(reason) && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-gray-900">{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Other Reason */}
          <div>
            <label className="label">سبب آخر (اختياري)</label>
            <input
              type="text"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="اكتب السبب إن لم يكن من الأسباب أعلاه..."
              className="input"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات إضافية (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات توضيحية..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Evidence Photo */}
          <div>
            <label className="label">صورة توضيحية (اختياري)</label>
            <PhotoUploader
              value={evidencePhotos}
              onChange={setEvidencePhotos}
              onUpload={handleUpload}
              maxPhotos={1}
              showCamera
              label="التقط صورة للدليل"
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
              'bg-red-600 text-white hover:bg-red-700',
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
                <XCircle className="w-4 h-4" />
                <span>تأكيد عدم الإصلاح</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFixedModal;
