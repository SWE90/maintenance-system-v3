'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PhotoUploader, PhotoFile } from '@/components/ui';
import { api } from '@/lib/api';
import { TicketStatus } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  PenTool,
  Smartphone,
  Star,
  Eraser,
  Send,
} from 'lucide-react';

export interface CompleteRepairModalProps {
  /** Task ID */
  taskId: number;
  /** Customer phone for OTP */
  customerPhone: string;
  /** Close handler */
  onClose: (refresh?: boolean) => void;
}

type ConfirmationType = 'signature' | 'otp';

/**
 * CompleteRepairModal Component
 * Modal for completing repair with after photos (min 3), notes, signature pad OR OTP, and rating
 */
export function CompleteRepairModal({
  taskId,
  customerPhone,
  onClose,
}: CompleteRepairModalProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [notes, setNotes] = useState('');
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>('signature');

  // Signature state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Rating
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form is valid
  const isValid =
    photos.length >= 3 &&
    (confirmationType === 'signature' ? hasSignature : otp.length === 6);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [confirmationType]);

  // Handle photo upload
  const handleUpload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 500);
    });
  }, []);

  // Signature drawing handlers
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureBase64 = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return null;
    return canvas.toDataURL('image/png');
  };

  // OTP handlers
  const handleSendOtp = async () => {
    setOtpSending(true);
    setOtpError(null);

    try {
      await api.sendVerificationCode(taskId);
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err.message || 'فشل في إرسال رمز التحقق');
    } finally {
      setOtpSending(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Get photo URLs
      const photoUrls = photos
        .filter((p) => p.status === 'uploaded' || p.status === 'pending')
        .map((p) => p.url || p.preview);

      // Prepare confirmation data
      const confirmationData: any = {
        confirmationType,
      };

      if (confirmationType === 'signature') {
        confirmationData.signature = getSignatureBase64();
      } else {
        confirmationData.otp = otp;
      }

      // Call API to complete repair
      await api.transitionTask(taskId, {
        toStatus: TicketStatus.COMPLETED,
        photos: photoUrls,
        notes: notes.trim() || undefined,
        ...confirmationData,
        customerRating: rating > 0 ? rating : undefined,
        customerFeedback: feedback.trim() || undefined,
      });

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'فشل في إتمام الإصلاح');
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
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">إتمام الإصلاح</h2>
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

          {/* After Photos */}
          <div>
            <label className="label">
              صور بعد الإصلاح
              <span className="text-red-500 mr-1">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              يجب رفع 3 صور على الأقل للجهاز بعد الإصلاح
            </p>
            <PhotoUploader
              value={photos}
              onChange={setPhotos}
              onUpload={handleUpload}
              minPhotos={3}
              maxPhotos={10}
              showCamera
              label="التقط صور للجهاز بعد الإصلاح"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات الإصلاح (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات عن الإصلاح الذي تم..."
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Confirmation Type Toggle */}
          <div>
            <label className="label">
              تأكيد العميل
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setConfirmationType('signature')}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  confirmationType === 'signature'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <PenTool className="w-4 h-4" />
                توقيع
              </button>
              <button
                onClick={() => setConfirmationType('otp')}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  confirmationType === 'otp'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Smartphone className="w-4 h-4" />
                رمز تحقق
              </button>
            </div>
          </div>

          {/* Signature Pad */}
          {confirmationType === 'signature' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">توقيع العميل</p>
                {hasSignature && (
                  <button
                    onClick={clearSignature}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <Eraser className="w-4 h-4" />
                    مسح
                  </button>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={150}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {!hasSignature && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  اطلب من العميل التوقيع في المربع أعلاه
                </p>
              )}
            </div>
          )}

          {/* OTP Input */}
          {confirmationType === 'otp' && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                رمز التحقق سيرسل للعميل على:
                <span className="font-mono mr-1" dir="ltr">{customerPhone}</span>
              </p>

              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={otpSending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رمز التحقق</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="ادخل رمز التحقق"
                    maxLength={6}
                    className="input text-center text-2xl tracking-widest font-mono"
                    dir="ltr"
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    إعادة إرسال الرمز
                  </button>
                </div>
              )}

              {otpError && (
                <p className="text-sm text-red-600 mt-2">{otpError}</p>
              )}
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="label">تقييم العميل (اختياري)</label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={clsx(
                      'w-8 h-8 transition-colors',
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="ملاحظات العميل (اختياري)"
                className="input mt-2"
              />
            )}
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
              'bg-green-600 text-white hover:bg-green-700',
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
                <CheckCircle className="w-4 h-4" />
                <span>إتمام الإصلاح</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompleteRepairModal;
