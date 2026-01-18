'use client';

import { useState, useEffect, useCallback } from 'react';

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  error?: boolean;
}

// Default to Riyadh, Saudi Arabia
const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;

export function MapPicker({ latitude, longitude, onChange, error }: MapPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const lat = latitude || DEFAULT_LAT;
  const lng = longitude || DEFAULT_LNG;

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('تم رفض صلاحية الوصول للموقع');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('معلومات الموقع غير متاحة');
            break;
          case error.TIMEOUT:
            setLocationError('انتهى وقت طلب الموقع');
            break;
          default:
            setLocationError('حدث خطأ في تحديد الموقع');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  // Try to get location on mount if not provided
  useEffect(() => {
    if (!latitude && !longitude) {
      getCurrentLocation();
    }
  }, []);

  // Generate static map URL (using OpenStreetMap)
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x300&maptype=mapnik&markers=${lat},${lng},red-pushpin`;

  return (
    <div className="space-y-3">
      {/* Map Display */}
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
          error ? 'border-red-500' : 'border-slate-600'
        }`}
      >
        {/* Map Image */}
        <div className="relative h-48 bg-slate-700">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
          <img
            src={mapUrl}
            alt="Map location"
            className={`w-full h-full object-cover transition-opacity ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapLoaded(true)}
          />

          {/* Overlay for click/tap to adjust */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-lg" />
          </div>
        </div>

        {/* Location Button */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="absolute top-3 left-3 bg-white text-slate-700 p-2 rounded-lg shadow-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="تحديد موقعي الحالي"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <LocationIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {locationError && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <WarningIcon className="w-4 h-4" />
          {locationError}
        </p>
      )}

      {/* Coordinates Display */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex-1 bg-slate-700 rounded-lg px-3 py-2">
          <span className="text-slate-400 text-xs block mb-0.5">خط العرض</span>
          <span className="text-white font-mono" dir="ltr">{lat.toFixed(6)}</span>
        </div>
        <div className="flex-1 bg-slate-700 rounded-lg px-3 py-2">
          <span className="text-slate-400 text-xs block mb-0.5">خط الطول</span>
          <span className="text-white font-mono" dir="ltr">{lng.toFixed(6)}</span>
        </div>
      </div>

      {/* Manual Adjustment */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onChange(lat + 0.001, lng)}
          className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
          title="شمال"
        >
          <ArrowUpIcon className="w-5 h-5 mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => onChange(lat - 0.001, lng)}
          className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
          title="جنوب"
        >
          <ArrowDownIcon className="w-5 h-5 mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => onChange(lat, lng - 0.001)}
          className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
          title="شرق"
        >
          <ArrowLeftIcon className="w-5 h-5 mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => onChange(lat, lng + 0.001)}
          className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
          title="غرب"
        >
          <ArrowRightIcon className="w-5 h-5 mx-auto" />
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        استخدم الاسهم لتعديل الموقع بدقة او اضغط على زر تحديد الموقع
      </p>
    </div>
  );
}

// Icons
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
