'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { StatusBadge, PhotoUploader, PhotoFile } from '@/components/ui';
import {
  TicketStatus,
  DeviceType,
  AttachmentType,
  ITicket,
  ITicketStatusHistory,
  ITicketAttachment,
  ITicketMessage,
  IEscalation,
  DEVICE_TYPE_LABELS_AR,
  STATUS_LABELS_AR,
  TIME_SLOT_LABELS_AR,
  WARRANTY_STATUS_LABELS_AR,
} from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  ArrowRight,
  Phone,
  MapPin,
  Navigation,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  FileText,
  Camera,
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Upload,
  Image,
  Play,
  CheckCircle,
  Search,
  Wrench,
  Package,
  XCircle,
  Truck,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import {
  StartInspectionModal,
  PartsRequestModal,
  NotFixedModal,
  PickupDeviceModal,
  CompleteRepairModal,
} from '@/components/modals';

/** Device type icons mapping */
const deviceIcons: Record<DeviceType, React.ReactNode> = {
  [DeviceType.AC]: <Wind className="w-6 h-6" />,
  [DeviceType.WASHER]: <CircleDot className="w-6 h-6" />,
  [DeviceType.FRIDGE]: <Refrigerator className="w-6 h-6" />,
  [DeviceType.OVEN]: <Flame className="w-6 h-6" />,
  [DeviceType.DISHWASHER]: <Waves className="w-6 h-6" />,
  [DeviceType.OTHER]: <HelpCircle className="w-6 h-6" />,
};

/** Attachment type labels */
const attachmentTypeLabels: Record<AttachmentType, string> = {
  [AttachmentType.BEFORE_INSPECTION]: 'قبل الفحص',
  [AttachmentType.AFTER_REPAIR]: 'بعد الإصلاح',
  [AttachmentType.SERIAL_PHOTO]: 'الرقم التسلسلي',
  [AttachmentType.INVOICE_PHOTO]: 'الفاتورة',
  [AttachmentType.PARTS_PHOTO]: 'قطع الغيار',
  [AttachmentType.DEVICE_PHOTO]: 'صورة الجهاز',
  [AttachmentType.SIGNATURE]: 'التوقيع',
  [AttachmentType.OTHER]: 'أخرى',
};

/** Extended task data */
interface TaskDetailData extends ITicket {
  statusHistory?: ITicketStatusHistory[];
  attachments?: ITicketAttachment[];
  messages?: ITicketMessage[];
  escalations?: IEscalation[];
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = Number(params.id);

  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    device: true,
    attachments: false,
    communication: false,
    timeline: false,
  });

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Attachment upload
  const [uploadType, setUploadType] = useState<AttachmentType | null>(null);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);

  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Action loading
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch task details
  const fetchTask = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTask(taskId);
      setTask(data);
    } catch (err) {
      setError('فشل في تحميل تفاصيل المهمة');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  // Toggle section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle call
  const handleCall = () => {
    if (task?.customerPhone) {
      window.location.href = `tel:${task.customerPhone}`;
    }
  };

  // Handle navigation
  const handleGoogleMaps = () => {
    if (task) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`,
        '_blank'
      );
    }
  };

  const handleWaze = () => {
    if (task) {
      window.open(
        `https://waze.com/ul?ll=${task.latitude},${task.longitude}&navigate=yes`,
        '_blank'
      );
    }
  };

  // Handle status transition
  const handleTransition = async (toStatus: TicketStatus) => {
    if (!task) return;

    setIsActionLoading(true);
    try {
      const location = await getCurrentLocation();
      await api.transitionTask(task.id, {
        toStatus,
        location,
      });
      await fetchTask();
    } catch (err) {
      console.error('Transition failed:', err);
      alert('فشل في تحديث الحالة');
    } finally {
      setIsActionLoading(false);
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

  // Handle send message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !task) return;

    setIsSendingMessage(true);
    try {
      // API call to send message would go here
      // await api.sendMessage(task.id, { content: chatMessage });
      setChatMessage('');
      await fetchTask();
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle modal close
  const handleModalClose = (refresh?: boolean) => {
    setActiveModal(null);
    if (refresh) {
      fetchTask();
    }
  };

  // Format date
  const formatDateTime = (date?: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get action buttons based on status
  const getActionButtons = () => {
    if (!task) return [];

    const status = task.status;

    switch (status) {
      case TicketStatus.SCHEDULED:
        return [
          {
            label: 'بدء الرحلة',
            icon: <Play className="w-5 h-5" />,
            action: () => handleTransition(TicketStatus.ON_ROUTE),
            variant: 'primary' as const,
          },
          {
            label: 'جدولة موعد آخر',
            icon: <Calendar className="w-5 h-5" />,
            action: () => setActiveModal('reschedule'),
            variant: 'secondary' as const,
          },
        ];

      case TicketStatus.ON_ROUTE:
        return [
          {
            label: 'وصلت',
            icon: <MapPin className="w-5 h-5" />,
            action: () => handleTransition(TicketStatus.ARRIVED),
            variant: 'primary' as const,
          },
        ];

      case TicketStatus.ARRIVED:
        return [
          {
            label: 'بدء الفحص',
            icon: <Search className="w-5 h-5" />,
            action: () => setActiveModal('startInspection'),
            variant: 'primary' as const,
          },
        ];

      case TicketStatus.INSPECTING:
        return [
          {
            label: 'إتمام التشخيص',
            icon: <CheckCircle className="w-5 h-5" />,
            action: () => handleTransition(TicketStatus.DIAGNOSED),
            variant: 'primary' as const,
          },
        ];

      case TicketStatus.DIAGNOSED:
        return [
          {
            label: 'بدء الإصلاح',
            icon: <Wrench className="w-5 h-5" />,
            action: () => handleTransition(TicketStatus.REPAIRING),
            variant: 'primary' as const,
          },
          {
            label: 'طلب قطع غيار',
            icon: <Package className="w-5 h-5" />,
            action: () => setActiveModal('partsRequest'),
            variant: 'secondary' as const,
          },
          {
            label: 'لم يتم الإصلاح',
            icon: <XCircle className="w-5 h-5" />,
            action: () => setActiveModal('notFixed'),
            variant: 'danger' as const,
          },
          {
            label: 'سحب الجهاز',
            icon: <Truck className="w-5 h-5" />,
            action: () => setActiveModal('pickupDevice'),
            variant: 'secondary' as const,
          },
        ];

      case TicketStatus.REPAIRING:
        return [
          {
            label: 'تم الإصلاح',
            icon: <CheckCircle className="w-5 h-5" />,
            action: () => setActiveModal('completeRepair'),
            variant: 'success' as const,
          },
          {
            label: 'طلب قطع غيار',
            icon: <Package className="w-5 h-5" />,
            action: () => setActiveModal('partsRequest'),
            variant: 'secondary' as const,
          },
          {
            label: 'لم يتم الإصلاح',
            icon: <XCircle className="w-5 h-5" />,
            action: () => setActiveModal('notFixed'),
            variant: 'danger' as const,
          },
        ];

      default:
        return [];
    }
  };

  const actionButtons = getActionButtons();

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Render error state
  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'المهمة غير موجودة'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 btn-primary"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  // Active escalations
  const activeEscalations = task.escalations?.filter((e) => !e.isResolved) || [];

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-500">
                #{task.ticketNumber}
              </span>
              <StatusBadge status={task.status} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Warning */}
      {activeEscalations.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">تنبيه تصعيد</p>
              {activeEscalations.map((esc) => (
                <p key={esc.id} className="text-sm text-red-600 mt-1">
                  {esc.reason}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Customer Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('customer')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">بيانات العميل</span>
            </div>
            {expandedSections.customer ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.customer && (
            <div className="p-4 space-y-4">
              {/* Customer Name */}
              <div>
                <p className="text-sm text-gray-500">اسم العميل</p>
                <p className="font-semibold text-gray-900">{task.customerName}</p>
              </div>

              {/* Phone with Call Button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">رقم الجوال</p>
                  <p className="font-semibold text-gray-900" dir="ltr">
                    {task.customerPhone}
                  </p>
                </div>
                <button
                  onClick={handleCall}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">اتصال</span>
                </button>
              </div>

              {/* Address */}
              <div>
                <p className="text-sm text-gray-500">العنوان</p>
                <p className="text-gray-900">{task.customerAddress}</p>
                <p className="text-sm text-gray-500 mt-1">{task.customerCity}</p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleGoogleMaps}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  <span className="font-medium">خرائط قوقل</span>
                </button>
                <button
                  onClick={handleWaze}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  <span className="font-medium">Waze</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Device & Problem Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('device')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
          >
            <div className="flex items-center gap-2">
              {deviceIcons[task.deviceType] || deviceIcons[DeviceType.OTHER]}
              <span className="font-semibold text-gray-900">
                الجهاز والمشكلة
              </span>
            </div>
            {expandedSections.device ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.device && (
            <div className="p-4 space-y-4">
              {/* Device Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">نوع الجهاز</p>
                  <p className="font-semibold text-gray-900">
                    {DEVICE_TYPE_LABELS_AR[task.deviceType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الماركة</p>
                  <p className="font-semibold text-gray-900">{task.brand}</p>
                </div>
                {task.model && (
                  <div>
                    <p className="text-sm text-gray-500">الموديل</p>
                    <p className="font-semibold text-gray-900">{task.model}</p>
                  </div>
                )}
                {task.serialNumber && (
                  <div>
                    <p className="text-sm text-gray-500">الرقم التسلسلي</p>
                    <p className="font-semibold text-gray-900 font-mono">
                      {task.serialNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Warranty */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">الضمان:</span>
                <span className="font-medium text-gray-900">
                  {WARRANTY_STATUS_LABELS_AR[task.warrantyStatus]}
                </span>
                {task.invoiceNumber && (
                  <span className="text-sm text-gray-500 mr-2">
                    (فاتورة: {task.invoiceNumber})
                  </span>
                )}
              </div>

              {/* Problem Description */}
              <div>
                <p className="text-sm text-gray-500 mb-1">وصف المشكلة</p>
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                  {task.problemDescription}
                </p>
              </div>

              {/* Diagnosis Notes */}
              {task.diagnosisNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">ملاحظات التشخيص</p>
                  <p className="text-gray-900 bg-blue-50 rounded-lg p-3">
                    {task.diagnosisNotes}
                  </p>
                </div>
              )}

              {/* Repair Notes */}
              {task.repairNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">ملاحظات الإصلاح</p>
                  <p className="text-gray-900 bg-green-50 rounded-lg p-3">
                    {task.repairNotes}
                  </p>
                </div>
              )}

              {/* Schedule */}
              {task.scheduledDate && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900">
                    {formatDateTime(task.scheduledDate)}
                    {task.scheduledTimeSlot && (
                      <span className="mr-2">
                        ({TIME_SLOT_LABELS_AR[task.scheduledTimeSlot]})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('attachments')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">المرفقات</span>
              {task.attachments && task.attachments.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {task.attachments.length}
                </span>
              )}
            </div>
            {expandedSections.attachments ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.attachments && (
            <div className="p-4 space-y-4">
              {/* Upload Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">رفع صورة</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUploadDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {Object.entries(attachmentTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => {
                          setUploadType(type as AttachmentType);
                          setShowUploadDropdown(false);
                        }}
                        className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Attachments */}
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                        {attachmentTypeLabels[attachment.type]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Image className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">لا توجد مرفقات</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Communication Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('communication')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">المحادثة</span>
              {task.messages && task.messages.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {task.messages.length}
                </span>
              )}
            </div>
            {expandedSections.communication ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.communication && (
            <div className="p-4">
              {/* Messages */}
              <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                {task.messages && task.messages.length > 0 ? (
                  task.messages.map((message) => (
                    <div
                      key={message.id}
                      className={clsx(
                        'max-w-[80%] rounded-lg p-3',
                        message.senderRole === 'technician'
                          ? 'bg-primary-100 mr-auto'
                          : 'bg-gray-100 ml-auto'
                      )}
                    >
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد رسائل</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="flex-1 input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isSendingMessage}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">سجل الحالات</span>
            </div>
            {expandedSections.timeline ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.timeline && (
            <div className="p-4">
              {task.statusHistory && task.statusHistory.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute top-0 bottom-0 right-3 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {task.statusHistory.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4 relative">
                        {/* Dot */}
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                            index === 0
                              ? 'bg-primary-600 ring-4 ring-primary-100'
                              : 'bg-gray-300'
                          )}
                        >
                          <div
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              index === 0 ? 'bg-white' : 'bg-gray-500'
                            )}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={entry.toStatus}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.actorName} - {entry.actorRole}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(entry.createdAt)}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded p-2">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">لا يوجد سجل</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      {actionButtons.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 safe-area-pb">
          <div className="flex flex-wrap gap-2">
            {actionButtons.map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                disabled={isActionLoading}
                className={clsx(
                  'flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50',
                  {
                    'bg-primary-600 text-white hover:bg-primary-700':
                      btn.variant === 'primary',
                    'bg-gray-100 text-gray-700 hover:bg-gray-200':
                      btn.variant === 'secondary',
                    'bg-green-600 text-white hover:bg-green-700':
                      btn.variant === 'success',
                    'bg-red-600 text-white hover:bg-red-700':
                      btn.variant === 'danger',
                  }
                )}
              >
                {isActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  btn.icon
                )}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'startInspection' && (
        <StartInspectionModal
          taskId={task.id}
          onClose={handleModalClose}
        />
      )}

      {activeModal === 'partsRequest' && (
        <PartsRequestModal
          taskId={task.id}
          onClose={handleModalClose}
        />
      )}

      {activeModal === 'notFixed' && (
        <NotFixedModal
          taskId={task.id}
          onClose={handleModalClose}
        />
      )}

      {activeModal === 'pickupDevice' && (
        <PickupDeviceModal
          taskId={task.id}
          onClose={handleModalClose}
        />
      )}

      {activeModal === 'completeRepair' && (
        <CompleteRepairModal
          taskId={task.id}
          customerPhone={task.customerPhone}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
