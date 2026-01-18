'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import {
  TicketStatus,
  Priority,
  DeviceType,
  WarrantyStatus,
  TimeSlot,
  AttachmentType,
  EscalationLevel,
  EscalationType,
  DEVICE_TYPE_LABELS_AR,
  STATUS_LABELS_AR,
  PRIORITY_LABELS_AR,
  WARRANTY_STATUS_LABELS_AR,
  TIME_SLOT_LABELS_AR,
  ITicket,
  ITicketStatusHistory,
  ITicketAttachment,
  IEscalation,
  ITechnician,
} from '@maintenance/shared';
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  Clock,
  FileText,
  Image,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  CalendarDays,
  ArrowUpCircle,
  Ban,
  Edit,
  ExternalLink,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  X,
  RefreshCw,
  History,
  Shield,
  Wrench,
} from 'lucide-react';

// Device Icon Component
function DeviceIcon({
  deviceType,
  className,
}: {
  deviceType: DeviceType;
  className?: string;
}) {
  const icons = {
    [DeviceType.AC]: Wind,
    [DeviceType.WASHER]: CircleDot,
    [DeviceType.FRIDGE]: Refrigerator,
    [DeviceType.OVEN]: Flame,
    [DeviceType.DISHWASHER]: Waves,
    [DeviceType.OTHER]: HelpCircle,
  };
  const Icon = icons[deviceType] || HelpCircle;
  return <Icon className={className} />;
}

// Info Card Component
interface InfoCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function InfoCard({
  title,
  icon: Icon,
  children,
  actions,
  collapsible = false,
  defaultOpen = true,
}: InfoCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-500" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <button className="p-1 text-gray-400 hover:text-gray-600">
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && <div className="p-4">{children}</div>}
    </div>
  );
}

// Info Row Component
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}

function InfoRow({ label, value, icon: Icon }: InfoRowProps) {
  return (
    <div className="flex items-start py-2">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1 text-sm text-gray-900 font-medium">{value}</div>
    </div>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  entry: ITicketStatusHistory;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineItem({ entry, isFirst, isLast }: TimelineItemProps) {
  const statusColor = {
    [TicketStatus.NEW]: 'bg-blue-500',
    [TicketStatus.ASSIGNED]: 'bg-indigo-500',
    [TicketStatus.SCHEDULED]: 'bg-purple-500',
    [TicketStatus.ON_ROUTE]: 'bg-yellow-500',
    [TicketStatus.ARRIVED]: 'bg-orange-500',
    [TicketStatus.INSPECTING]: 'bg-cyan-500',
    [TicketStatus.DIAGNOSED]: 'bg-teal-500',
    [TicketStatus.REPAIRING]: 'bg-sky-500',
    [TicketStatus.WAITING_PARTS]: 'bg-amber-500',
    [TicketStatus.PICKUP_DEVICE]: 'bg-pink-500',
    [TicketStatus.IN_WORKSHOP]: 'bg-fuchsia-500',
    [TicketStatus.READY_DELIVERY]: 'bg-lime-500',
    [TicketStatus.COMPLETED]: 'bg-green-500',
    [TicketStatus.NOT_FIXED]: 'bg-red-500',
    [TicketStatus.CANCELLED]: 'bg-gray-500',
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full ${
            statusColor[entry.toStatus] || 'bg-gray-400'
          }`}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {STATUS_LABELS_AR[entry.toStatus]}
            </p>
            {entry.fromStatus && (
              <p className="text-sm text-gray-500">
                من: {STATUS_LABELS_AR[entry.fromStatus]}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>
        {entry.notes && (
          <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          بواسطة: {entry.actorName} ({entry.actorRole})
        </p>
      </div>
    </div>
  );
}

// Attachment Item Component
interface AttachmentItemProps {
  attachment: ITicketAttachment;
  onView: (url: string) => void;
}

function AttachmentItem({ attachment, onView }: AttachmentItemProps) {
  const typeLabels: Record<AttachmentType, string> = {
    [AttachmentType.BEFORE_INSPECTION]: 'قبل الفحص',
    [AttachmentType.AFTER_REPAIR]: 'بعد الإصلاح',
    [AttachmentType.SERIAL_PHOTO]: 'رقم السيريال',
    [AttachmentType.INVOICE_PHOTO]: 'الفاتورة',
    [AttachmentType.PARTS_PHOTO]: 'القطع',
    [AttachmentType.DEVICE_PHOTO]: 'الجهاز',
    [AttachmentType.SIGNATURE]: 'التوقيع',
    [AttachmentType.OTHER]: 'أخرى',
  };

  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(attachment.url)}
            className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mx-1"
          >
            <Eye className="w-5 h-5" />
          </button>
          <a
            href={attachment.url}
            download={attachment.originalName}
            className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mx-1"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-xs text-white truncate">{typeLabels[attachment.type]}</p>
      </div>
    </div>
  );
}

// Escalation Item Component
interface EscalationItemProps {
  escalation: IEscalation;
}

function EscalationItem({ escalation }: EscalationItemProps) {
  const levelColors = {
    [EscalationLevel.L1]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    [EscalationLevel.L2]: 'bg-orange-100 border-orange-300 text-orange-800',
    [EscalationLevel.L3]: 'bg-red-100 border-red-300 text-red-800',
  };

  const typeLabels: Record<EscalationType, string> = {
    [EscalationType.ASSIGNMENT_DELAY]: 'تأخر الإسناد',
    [EscalationType.SCHEDULE_DELAY]: 'تأخر الجدولة',
    [EscalationType.TRIP_DELAY]: 'تأخر الرحلة',
    [EscalationType.ARRIVAL_DELAY]: 'تأخر الوصول',
    [EscalationType.PARTS_DELAY]: 'تأخر القطع',
    [EscalationType.COMPLETION_DELAY]: 'تأخر الإكمال',
    [EscalationType.CUSTOMER_COMPLAINT]: 'شكوى عميل',
    [EscalationType.SLA_BREACH]: 'تجاوز SLA',
  };

  const formattedDate = new Date(escalation.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-4 rounded-lg border ${
        escalation.isResolved
          ? 'bg-gray-50 border-gray-200'
          : levelColors[escalation.level]
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-5 h-5 ${
              escalation.isResolved ? 'text-gray-400' : ''
            }`}
          />
          <div>
            <p className="font-medium">
              تصعيد {escalation.level} - {typeLabels[escalation.type]}
            </p>
            <p className="text-sm opacity-80">{escalation.reason}</p>
          </div>
        </div>
        {escalation.isResolved ? (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            تم الحل
          </span>
        ) : (
          <span className="text-xs opacity-70">{formattedDate}</span>
        )}
      </div>
      {escalation.isResolved && escalation.resolutionNotes && (
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">الحل:</span> {escalation.resolutionNotes}
        </p>
      )}
    </div>
  );
}

// Action Button Component
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
}: ActionButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

// Assign Modal
interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: ITechnician[];
  onAssign: (technicianId: number) => void;
  isLoading: boolean;
}

function AssignModal({
  isOpen,
  onClose,
  technicians,
  onAssign,
  isLoading,
}: AssignModalProps) {
  const [selectedTech, setSelectedTech] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-xl z-50">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">إسناد لفني</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => setSelectedTech(tech.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  selectedTech === tech.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">{tech.name}</p>
                  <p className="text-sm text-gray-500">
                    {tech.isAvailable ? (
                      <span className="text-green-600">متاح</span>
                    ) : (
                      <span className="text-red-600">مشغول</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={() => selectedTech && onAssign(selectedTech)}
            disabled={!selectedTech || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'جاري الإسناد...' : 'إسناد'}
          </button>
        </div>
      </div>
    </>
  );
}

// Schedule Modal
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, timeSlot: TimeSlot) => void;
  isLoading: boolean;
}

function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  isLoading,
}: ScheduleModalProps) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>('');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-xl z-50">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">جدولة الزيارة</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ الزيارة
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفترة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIME_SLOT_LABELS_AR).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTimeSlot(value as TimeSlot)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    timeSlot === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={() => date && timeSlot && onSchedule(date, timeSlot)}
            disabled={!date || !timeSlot || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'جاري الجدولة...' : 'جدولة'}
          </button>
        </div>
      </div>
    </>
  );
}

// Priority Change Modal
interface PriorityModalProps {
  isOpen: boolean;
  currentPriority: Priority;
  onClose: () => void;
  onChangePriority: (priority: Priority) => void;
  isLoading: boolean;
}

function PriorityModal({
  isOpen,
  currentPriority,
  onClose,
  onChangePriority,
  isLoading,
}: PriorityModalProps) {
  const [selected, setSelected] = useState<Priority>(currentPriority);

  if (!isOpen) return null;

  const priorities = [
    { value: Priority.LOW, label: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
    { value: Priority.NORMAL, label: 'عادية', color: 'bg-blue-100 text-blue-800' },
    { value: Priority.HIGH, label: 'عالية', color: 'bg-orange-100 text-orange-800' },
    { value: Priority.URGENT, label: 'عاجلة', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-white rounded-xl shadow-xl z-50">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">تغيير الأولوية</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelected(p.value)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                  selected === p.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.color}`}>
                  {p.label}
                </span>
                {currentPriority === p.value && (
                  <span className="text-xs text-gray-400">الحالية</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={() => onChangePriority(selected)}
            disabled={selected === currentPriority || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'جاري التغيير...' : 'تغيير'}
          </button>
        </div>
      </div>
    </>
  );
}

// Internal Notes Section
interface InternalNotesSectionProps {
  notes: string;
  onSave: (notes: string) => void;
  isLoading: boolean;
}

function InternalNotesSection({ notes, onSave, isLoading }: InternalNotesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    onSave(editedNotes);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      {isEditing ? (
        <>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="أضف ملاحظات داخلية..."
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedNotes(notes);
              }}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </>
      ) : (
        <>
          {notes ? (
            <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-gray-400 italic">لا توجد ملاحظات داخلية</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            {notes ? 'تعديل' : 'إضافة ملاحظة'}
          </button>
        </>
      )}
    </div>
  );
}

// Image Viewer Modal
interface ImageViewerProps {
  url: string | null;
  onClose: () => void;
}

function ImageViewer({ url, onClose }: ImageViewerProps) {
  if (!url) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 z-50" onClick={onClose} />
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-0 left-0 p-4 text-white hover:text-gray-300"
        >
          <X className="w-8 h-8" />
        </button>
        <img
          src={url}
          alt="Preview"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </>
  );
}

// Main Component
export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params.id);

  // State
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [timeline, setTimeline] = useState<ITicketStatusHistory[]>([]);
  const [attachments, setAttachments] = useState<ITicketAttachment[]>([]);
  const [escalations, setEscalations] = useState<IEscalation[]>([]);
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Load ticket data
  const loadTicket = useCallback(async () => {
    try {
      const data = await api.getTask(ticketId);
      setTicket(data);

      // Mock timeline data
      setTimeline([
        {
          id: 1,
          ticketId,
          fromStatus: null,
          toStatus: TicketStatus.NEW,
          actorId: 1,
          actorName: 'النظام',
          actorRole: 'system',
          createdAt: new Date(data.createdAt),
        },
        ...(data.assignedAt
          ? [
              {
                id: 2,
                ticketId,
                fromStatus: TicketStatus.NEW,
                toStatus: TicketStatus.ASSIGNED,
                actorId: 1,
                actorName: 'المشرف',
                actorRole: 'supervisor',
                createdAt: new Date(data.assignedAt),
              },
            ]
          : []),
      ]);

      // Mock attachments
      setAttachments([]);

      // Mock escalations
      setEscalations([]);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  const loadTechnicians = useCallback(async () => {
    try {
      const response = await api.getTechnicians();
      const items = response.items || response || [];
      setTechnicians(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  }, []);

  useEffect(() => {
    loadTicket();
    loadTechnicians();
  }, [loadTicket, loadTechnicians]);

  // Handlers
  const handleAssign = async (technicianId: number) => {
    try {
      setIsActionLoading(true);
      await api.assignTechnician(ticketId, { technicianId });
      setShowAssignModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error assigning technician:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSchedule = async (date: string, timeSlot: TimeSlot) => {
    try {
      setIsActionLoading(true);
      await api.updateTask(ticketId, {
        scheduledDate: date,
        scheduledTimeSlot: timeSlot,
      });
      setShowScheduleModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error scheduling:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangePriority = async (priority: Priority) => {
    try {
      setIsActionLoading(true);
      await api.updateTask(ticketId, { priority });
      setShowPriorityModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error changing priority:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    try {
      setIsActionLoading(true);
      await api.updateTask(ticketId, { internalNotes: notes });
      loadTicket();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('هل أنت متأكد من إلغاء هذه التذكرة؟')) return;

    try {
      setIsActionLoading(true);
      await api.transitionTask(ticketId, {
        toStatus: TicketStatus.CANCELLED,
        notes: 'تم الإلغاء من لوحة الإدارة',
      });
      loadTicket();
    } catch (error) {
      console.error('Error cancelling ticket:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل بيانات التذكرة...</p>
        </div>
      </div>
    );
  }

  const isTerminal = [
    TicketStatus.COMPLETED,
    TicketStatus.NOT_FIXED,
    TicketStatus.CANCELLED,
  ].includes(ticket.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tickets"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900" dir="ltr">
                #{ticket.ticketNumber}
              </h1>
              <StatusBadge status={ticket.status} showDot />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="text-gray-500">
              {ticket.customerName} - {ticket.customerCity}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!isTerminal && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton
              icon={UserPlus}
              label="إسناد لفني"
              onClick={() => setShowAssignModal(true)}
              variant={ticket.technicianId ? 'secondary' : 'primary'}
            />
            <ActionButton
              icon={CalendarDays}
              label="جدولة"
              onClick={() => setShowScheduleModal(true)}
            />
            <ActionButton
              icon={ArrowUpCircle}
              label="الأولوية"
              onClick={() => setShowPriorityModal(true)}
            />
            <ActionButton
              icon={Ban}
              label="إلغاء"
              onClick={handleCancel}
              variant="danger"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <InfoCard title="معلومات العميل" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="الاسم" value={ticket.customerName} icon={User} />
              <InfoRow
                label="الهاتف"
                value={
                  <a
                    href={`tel:${ticket.customerPhone}`}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    dir="ltr"
                  >
                    {ticket.customerPhone}
                    <Phone className="w-4 h-4" />
                  </a>
                }
                icon={Phone}
              />
              {ticket.customerEmail && (
                <InfoRow
                  label="البريد"
                  value={
                    <a
                      href={`mailto:${ticket.customerEmail}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {ticket.customerEmail}
                    </a>
                  }
                  icon={Mail}
                />
              )}
              <InfoRow label="المدينة" value={ticket.customerCity} icon={Building} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <InfoRow
                label="العنوان"
                value={
                  <div className="flex items-start justify-between">
                    <span>{ticket.customerAddress}</span>
                    <a
                      href={`https://maps.google.com/?q=${ticket.latitude},${ticket.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mr-4"
                    >
                      <MapPin className="w-4 h-4" />
                      الخريطة
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                }
                icon={MapPin}
              />
            </div>
          </InfoCard>

          {/* Device & Warranty Info */}
          <InfoCard title="معلومات الجهاز والضمان" icon={Wrench}>
            <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                <DeviceIcon deviceType={ticket.deviceType} className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {DEVICE_TYPE_LABELS_AR[ticket.deviceType]}
                </h4>
                <p className="text-gray-600">
                  {ticket.brand} {ticket.model && `- ${ticket.model}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <InfoRow
                label="الضمان"
                value={
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      ticket.warrantyStatus === WarrantyStatus.YES
                        ? 'bg-green-100 text-green-700'
                        : ticket.warrantyStatus === WarrantyStatus.NO
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {WARRANTY_STATUS_LABELS_AR[ticket.warrantyStatus]}
                  </span>
                }
                icon={Shield}
              />
              {ticket.serialNumber && (
                <InfoRow
                  label="رقم السيريال"
                  value={<span dir="ltr">{ticket.serialNumber}</span>}
                />
              )}
              {ticket.invoiceNumber && (
                <InfoRow
                  label="رقم الفاتورة"
                  value={<span dir="ltr">{ticket.invoiceNumber}</span>}
                />
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h5 className="text-sm font-medium text-gray-500 mb-2">وصف المشكلة</h5>
              <p className="text-gray-700">{ticket.problemDescription}</p>
            </div>
          </InfoCard>

          {/* Timeline */}
          <InfoCard
            title="سجل الحالات"
            icon={History}
            collapsible
            defaultOpen
          >
            {timeline.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا يوجد سجل</p>
            ) : (
              <div className="space-y-0">
                {timeline.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    isFirst={index === 0}
                    isLast={index === timeline.length - 1}
                  />
                ))}
              </div>
            )}
          </InfoCard>

          {/* Attachments */}
          <InfoCard
            title="المرفقات"
            icon={Image}
            collapsible
            defaultOpen={attachments.length > 0}
          >
            {attachments.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا توجد مرفقات</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onView={setViewingImage}
                  />
                ))}
              </div>
            )}
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Assigned Technician */}
          <InfoCard title="الفني المسند" icon={Users}>
            {ticket.technicianName ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-700">
                    {ticket.technicianName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{ticket.technicianName}</p>
                  <p className="text-sm text-gray-500">
                    تم الإسناد:{' '}
                    {ticket.assignedAt
                      ? new Date(ticket.assignedAt).toLocaleDateString('ar-SA')
                      : '-'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">لم يتم إسناد فني بعد</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  إسناد فني
                </button>
              </div>
            )}
          </InfoCard>

          {/* Schedule Info */}
          <InfoCard title="الجدولة" icon={Calendar}>
            {ticket.scheduledDate ? (
              <div className="space-y-2">
                <InfoRow
                  label="التاريخ"
                  value={new Date(ticket.scheduledDate).toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  icon={Calendar}
                />
                {ticket.scheduledTimeSlot && (
                  <InfoRow
                    label="الفترة"
                    value={TIME_SLOT_LABELS_AR[ticket.scheduledTimeSlot]}
                    icon={Clock}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">لم يتم الجدولة بعد</p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  جدولة الزيارة
                </button>
              </div>
            )}
          </InfoCard>

          {/* Internal Notes */}
          <InfoCard title="ملاحظات داخلية" icon={MessageSquare}>
            <InternalNotesSection
              notes={ticket.internalNotes || ''}
              onSave={handleSaveNotes}
              isLoading={isActionLoading}
            />
          </InfoCard>

          {/* Escalation History */}
          <InfoCard
            title="سجل التصعيدات"
            icon={AlertTriangle}
            collapsible
            defaultOpen={escalations.some((e) => !e.isResolved)}
          >
            {escalations.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا توجد تصعيدات</p>
            ) : (
              <div className="space-y-3">
                {escalations.map((escalation) => (
                  <EscalationItem key={escalation.id} escalation={escalation} />
                ))}
              </div>
            )}
          </InfoCard>
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        technicians={technicians}
        onAssign={handleAssign}
        isLoading={isActionLoading}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
        isLoading={isActionLoading}
      />

      <PriorityModal
        isOpen={showPriorityModal}
        currentPriority={ticket.priority}
        onClose={() => setShowPriorityModal(false)}
        onChangePriority={handleChangePriority}
        isLoading={isActionLoading}
      />

      <ImageViewer url={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}
