'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  FormField,
  Input,
  Textarea,
  Select,
  RadioGroup,
  CardSelect,
} from '@/components/forms/FormField';
import { StepWizard, StepNavigation } from '@/components/forms/StepWizard';
import { MapPicker } from '@/components/forms/MapPicker';
import {
  DeviceType,
  TimeSlot,
  WarrantyStatus,
  DEVICE_TYPE_LABELS_AR,
  TIME_SLOT_LABELS_AR,
  WARRANTY_STATUS_LABELS_AR,
} from '@maintenance/shared';

const DRAFT_KEY = 'ticket_draft_v3';

interface FormData {
  // Step 1: Customer Info
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  latitude: number;
  longitude: number;

  // Step 2: Device Info
  deviceType: DeviceType | '';
  brand: string;
  model: string;
  problemDescription: string;
  preferredTimeSlot: TimeSlot | '';

  // Step 3: Warranty Info
  warrantyStatus: WarrantyStatus | '';
  invoiceNumber: string;
  serialNumber: string;
}

const defaultValues: FormData = {
  customerName: '',
  customerPhone: '',
  customerCity: '',
  customerAddress: '',
  latitude: 0,
  longitude: 0,
  deviceType: '',
  brand: '',
  model: '',
  problemDescription: '',
  preferredTimeSlot: '',
  warrantyStatus: '',
  invoiceNumber: '',
  serialNumber: '',
};

const CITIES = [
  { value: 'riyadh', label: 'الرياض' },
  { value: 'jeddah', label: 'جدة' },
  { value: 'mecca', label: 'مكة المكرمة' },
  { value: 'medina', label: 'المدينة المنورة' },
  { value: 'dammam', label: 'الدمام' },
  { value: 'khobar', label: 'الخبر' },
  { value: 'dhahran', label: 'الظهران' },
  { value: 'taif', label: 'الطائف' },
  { value: 'tabuk', label: 'تبوك' },
  { value: 'abha', label: 'ابها' },
  { value: 'khamis', label: 'خميس مشيط' },
  { value: 'hail', label: 'حائل' },
  { value: 'najran', label: 'نجران' },
  { value: 'jizan', label: 'جيزان' },
  { value: 'qassim', label: 'القصيم' },
];

const STEPS = [
  { id: 1, title: 'بيانات العميل', description: 'معلومات الاتصال والموقع' },
  { id: 2, title: 'بيانات الجهاز', description: 'نوع الجهاز والمشكلة' },
  { id: 3, title: 'معلومات الضمان', description: 'حالة الضمان' },
];

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues,
    mode: 'onChange',
  });

  const warrantyStatus = watch('warrantyStatus');
  const formValues = watch();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        reset({ ...defaultValues, ...parsed });
      } catch (e) {
        // Invalid draft, ignore
      }
    }
  }, [reset]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setValue('customerName', user.name || '');
      setValue('customerPhone', user.phone || '');
    }
  }, [user, setValue]);

  // Save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
    }, 500);
    return () => clearTimeout(timer);
  }, [formValues]);

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['customerName', 'customerPhone', 'customerCity', 'customerAddress', 'latitude', 'longitude'];
        break;
      case 2:
        fieldsToValidate = ['deviceType', 'brand', 'problemDescription'];
        break;
      case 3:
        fieldsToValidate = ['warrantyStatus'];
        if (warrantyStatus === WarrantyStatus.YES) {
          fieldsToValidate.push('invoiceNumber');
        }
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  // Navigate to next step
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit form
  const onSubmit = async (data: FormData) => {
    const isValid = await validateStep(3);
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerCity: data.customerCity,
        customerAddress: data.customerAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        deviceType: data.deviceType,
        brand: data.brand,
        model: data.model || undefined,
        problemDescription: data.problemDescription,
        preferredTimeSlot: data.preferredTimeSlot || undefined,
        warrantyStatus: data.warrantyStatus,
        invoiceNumber: data.invoiceNumber || undefined,
        serialNumber: data.serialNumber || undefined,
      };

      const result = await api.createTask(payload);

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Navigate to success page
      router.push(`/customer/create/success?ticketNumber=${result.ticketNumber}&trackingToken=${result.trackingToken}`);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'حدث خطأ اثناء انشاء التذكرة';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear draft
  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset(defaultValues);
    if (user) {
      setValue('customerName', user.name || '');
      setValue('customerPhone', user.phone || '');
    }
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">انشاء تذكرة صيانة</h1>
          <p className="text-slate-400">اكمل البيانات التالية لانشاء طلب صيانة جديد</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
          <StepWizard steps={STEPS} currentStep={currentStep}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Customer Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">بيانات العميل</h2>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                    >
                      مسح المسودة
                    </button>
                  </div>

                  <FormField label="الاسم الكامل" error={errors.customerName} required>
                    <Input
                      {...register('customerName', {
                        required: 'الاسم مطلوب',
                        minLength: { value: 3, message: 'الاسم يجب ان يكون 3 احرف على الاقل' },
                      })}
                      placeholder="ادخل اسمك الكامل"
                      error={!!errors.customerName}
                    />
                  </FormField>

                  <FormField label="رقم الجوال" error={errors.customerPhone} required>
                    <Input
                      {...register('customerPhone', {
                        required: 'رقم الجوال مطلوب',
                        pattern: {
                          value: /^(05|5)\d{8}$/,
                          message: 'رقم الجوال غير صحيح',
                        },
                      })}
                      placeholder="05xxxxxxxx"
                      type="tel"
                      dir="ltr"
                      error={!!errors.customerPhone}
                    />
                  </FormField>

                  <FormField label="المدينة" error={errors.customerCity} required>
                    <Controller
                      name="customerCity"
                      control={control}
                      rules={{ required: 'المدينة مطلوبة' }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={CITIES}
                          placeholder="اختر المدينة"
                          error={!!errors.customerCity}
                        />
                      )}
                    />
                  </FormField>

                  <FormField label="العنوان التفصيلي" error={errors.customerAddress} required>
                    <Textarea
                      {...register('customerAddress', {
                        required: 'العنوان مطلوب',
                        minLength: { value: 10, message: 'الرجاء ادخال عنوان تفصيلي' },
                      })}
                      placeholder="الحي، الشارع، رقم المبنى، معالم قريبة..."
                      rows={3}
                      error={!!errors.customerAddress}
                    />
                  </FormField>

                  <FormField
                    label="الموقع على الخريطة"
                    error={errors.latitude || errors.longitude}
                    required
                    hint="حدد موقعك على الخريطة لسهولة الوصول"
                  >
                    <Controller
                      name="latitude"
                      control={control}
                      rules={{ required: 'الموقع مطلوب', min: { value: 0.001, message: 'الرجاء تحديد الموقع' } }}
                      render={({ field: latField }) => (
                        <Controller
                          name="longitude"
                          control={control}
                          rules={{ required: 'الموقع مطلوب' }}
                          render={({ field: lngField }) => (
                            <MapPicker
                              latitude={latField.value}
                              longitude={lngField.value}
                              onChange={(lat, lng) => {
                                latField.onChange(lat);
                                lngField.onChange(lng);
                              }}
                              error={!!errors.latitude || !!errors.longitude}
                            />
                          )}
                        />
                      )}
                    />
                  </FormField>
                </div>
              )}

              {/* Step 2: Device Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">بيانات الجهاز</h2>

                  <FormField label="نوع الجهاز" error={errors.deviceType} required>
                    <Controller
                      name="deviceType"
                      control={control}
                      rules={{ required: 'نوع الجهاز مطلوب' }}
                      render={({ field }) => (
                        <CardSelect
                          options={Object.entries(DEVICE_TYPE_LABELS_AR).map(([value, label]) => ({
                            value,
                            label,
                            icon: <DeviceIcon type={value as DeviceType} />,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!errors.deviceType}
                        />
                      )}
                    />
                  </FormField>

                  <FormField label="الماركة / العلامة التجارية" error={errors.brand} required>
                    <Input
                      {...register('brand', { required: 'الماركة مطلوبة' })}
                      placeholder="مثال: سامسونج، LG، كاريير..."
                      error={!!errors.brand}
                    />
                  </FormField>

                  <FormField label="الموديل" error={errors.model} hint="اختياري - يساعد الفني">
                    <Input
                      {...register('model')}
                      placeholder="رقم الموديل ان وجد"
                      error={!!errors.model}
                    />
                  </FormField>

                  <FormField label="وصف المشكلة" error={errors.problemDescription} required>
                    <Textarea
                      {...register('problemDescription', {
                        required: 'وصف المشكلة مطلوب',
                        minLength: { value: 10, message: 'الرجاء وصف المشكلة بشكل مفصل' },
                      })}
                      placeholder="اشرح المشكلة بالتفصيل: متى بدأت، ماذا يحدث، هل حاولت حلها..."
                      rows={4}
                      error={!!errors.problemDescription}
                    />
                  </FormField>

                  <FormField label="الوقت المفضل للزيارة" error={errors.preferredTimeSlot}>
                    <Controller
                      name="preferredTimeSlot"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={Object.entries(TIME_SLOT_LABELS_AR).map(([value, label]) => ({
                            value,
                            label,
                          }))}
                          placeholder="اختر الوقت المفضل (اختياري)"
                          error={!!errors.preferredTimeSlot}
                        />
                      )}
                    />
                  </FormField>
                </div>
              )}

              {/* Step 3: Warranty Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">معلومات الضمان</h2>

                  <FormField label="هل الجهاز تحت الضمان؟" error={errors.warrantyStatus} required>
                    <Controller
                      name="warrantyStatus"
                      control={control}
                      rules={{ required: 'الرجاء تحديد حالة الضمان' }}
                      render={({ field }) => (
                        <RadioGroup
                          name="warrantyStatus"
                          options={Object.entries(WARRANTY_STATUS_LABELS_AR).map(([value, label]) => ({
                            value,
                            label,
                            description:
                              value === 'yes'
                                ? 'الجهاز ما زال في فترة الضمان'
                                : value === 'no'
                                ? 'انتهت فترة ضمان الجهاز'
                                : 'لست متأكداً من حالة الضمان',
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!errors.warrantyStatus}
                        />
                      )}
                    />
                  </FormField>

                  {/* Conditional fields for warranty */}
                  {warrantyStatus === WarrantyStatus.YES && (
                    <div className="space-y-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <WarrantyIcon className="w-5 h-5" />
                        الجهاز تحت الضمان - يرجى تقديم المعلومات التالية
                      </p>

                      <FormField label="رقم الفاتورة" error={errors.invoiceNumber} required>
                        <Input
                          {...register('invoiceNumber', {
                            required: warrantyStatus === WarrantyStatus.YES ? 'رقم الفاتورة مطلوب للضمان' : false,
                          })}
                          placeholder="ادخل رقم فاتورة الشراء"
                          error={!!errors.invoiceNumber}
                        />
                      </FormField>

                      <FormField label="الرقم التسلسلي" error={errors.serialNumber} hint="اختياري - موجود على ملصق الجهاز">
                        <Input
                          {...register('serialNumber')}
                          placeholder="الرقم التسلسلي للجهاز"
                          error={!!errors.serialNumber}
                        />
                      </FormField>
                    </div>
                  )}

                  {/* Submit Error */}
                  {submitError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {submitError}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 bg-slate-700/50 rounded-xl">
                    <h3 className="font-medium text-white mb-3">ملخص الطلب</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">العميل:</span>
                        <span className="text-white">{formValues.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الجوال:</span>
                        <span className="text-white" dir="ltr">{formValues.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الجهاز:</span>
                        <span className="text-white">
                          {DEVICE_TYPE_LABELS_AR[formValues.deviceType as DeviceType]} - {formValues.brand}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الضمان:</span>
                        <span className="text-white">
                          {WARRANTY_STATUS_LABELS_AR[formValues.warrantyStatus as WarrantyStatus]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <StepNavigation
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit(onSubmit)}
                isFirstStep={currentStep === 1}
                isLastStep={currentStep === 3}
                isLoading={isSubmitting}
                submitLabel="ارسال الطلب"
              />
            </form>
          </StepWizard>
        </div>
      </div>
    </div>
  );
}

// Device Type Icons
function DeviceIcon({ type }: { type: DeviceType }) {
  switch (type) {
    case DeviceType.AC:
      return <WindIcon className="w-6 h-6" />;
    case DeviceType.WASHER:
      return <WasherIcon className="w-6 h-6" />;
    case DeviceType.FRIDGE:
      return <FridgeIcon className="w-6 h-6" />;
    case DeviceType.OVEN:
      return <OvenIcon className="w-6 h-6" />;
    case DeviceType.DISHWASHER:
      return <DishwasherIcon className="w-6 h-6" />;
    default:
      return <OtherIcon className="w-6 h-6" />;
  }
}

// Icons
function WindIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </svg>
  );
}

function WasherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="5" strokeWidth={2} />
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
      <circle cx="12" cy="13" r="2" strokeWidth={2} />
      <line x1="8" y1="7" x2="8" y2="7" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

function FridgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
      <line x1="4" y1="10" x2="20" y2="10" strokeWidth={2} />
      <line x1="8" y1="6" x2="10" y2="6" strokeWidth={2} strokeLinecap="round" />
      <line x1="8" y1="14" x2="10" y2="14" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function OvenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2} />
      <rect x="6" y="10" width="12" height="7" rx="1" strokeWidth={2} />
      <circle cx="7" cy="7" r="1" strokeWidth={2} />
      <circle cx="12" cy="7" r="1" strokeWidth={2} />
      <circle cx="17" cy="7" r="1" strokeWidth={2} />
    </svg>
  );
}

function DishwasherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
      <line x1="3" y1="8" x2="21" y2="8" strokeWidth={2} />
      <circle cx="12" cy="15" r="3" strokeWidth={2} />
      <line x1="7" y1="5.5" x2="9" y2="5.5" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function OtherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function WarrantyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
