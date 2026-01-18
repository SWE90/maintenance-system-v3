'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Dynamic import for Leaflet (client-side only)
let L: typeof import('leaflet') | null = null;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapPickerProps {
  /** Current position */
  value?: LatLng | null;
  /** Change handler */
  onChange?: (position: LatLng) => void;
  /** Default center if no value provided */
  defaultCenter?: LatLng;
  /** Default zoom level */
  defaultZoom?: number;
  /** Map height */
  height?: string | number;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Show "use my location" button */
  showLocationButton?: boolean;
  /** Placeholder text when no location is selected */
  placeholder?: string;
  /** Optional additional CSS classes */
  className?: string;
}

// Default center: Riyadh, Saudi Arabia
const DEFAULT_CENTER: LatLng = { lat: 24.7136, lng: 46.6753 };
const DEFAULT_ZOOM = 13;

/**
 * MapPicker Component
 * A Leaflet map component for picking location
 */
export function MapPicker({
  value,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  height = 300,
  disabled = false,
  showLocationButton = true,
  placeholder = 'انقر على الخريطة لتحديد الموقع',
  className,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Leaflet
  useEffect(() => {
    const initLeaflet = async () => {
      if (typeof window === 'undefined') return;

      try {
        L = await import('leaflet');

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        setIsLoading(false);
      } catch (err) {
        setError('فشل في تحميل الخريطة');
        setIsLoading(false);
      }
    };

    initLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (isLoading || !L || !mapContainerRef.current || mapRef.current) return;

    const center = value || defaultCenter;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if value exists
    if (value) {
      markerRef.current = L.marker([value.lat, value.lng], {
        draggable: !disabled,
      }).addTo(map);

      if (!disabled) {
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current?.getLatLng();
          if (pos && onChange) {
            onChange({ lat: pos.lat, lng: pos.lng });
          }
        });
      }
    }

    // Click handler
    if (!disabled) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(map);

          markerRef.current.on('dragend', () => {
            const pos = markerRef.current?.getLatLng();
            if (pos && onChange) {
              onChange({ lat: pos.lat, lng: pos.lng });
            }
          });
        }

        if (onChange) {
          onChange({ lat, lng });
        }
      });
    }

    mapRef.current = map;
    setIsMapReady(true);

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setIsMapReady(false);
    };
  }, [isLoading, defaultCenter, defaultZoom, disabled]); // Removed value and onChange to prevent re-initialization

  // Update marker when value changes externally
  useEffect(() => {
    if (!isMapReady || !L || !mapRef.current) return;

    if (value) {
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng]);
      } else {
        markerRef.current = L.marker([value.lat, value.lng], {
          draggable: !disabled,
        }).addTo(mapRef.current);

        if (!disabled) {
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current?.getLatLng();
            if (pos && onChange) {
              onChange({ lat: pos.lat, lng: pos.lng });
            }
          });
        }
      }
      mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
    }
  }, [value, isMapReady, disabled, onChange]);

  // Get user's current location
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };

        if (onChange) {
          onChange(newPos);
        }

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }

        setIsLocating(false);
      },
      (err) => {
        let message = 'فشل في تحديد الموقع';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'تم رفض صلاحية تحديد الموقع';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'الموقع غير متاح';
        } else if (err.code === err.TIMEOUT) {
          message = 'انتهت مهلة تحديد الموقع';
        }
        setError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={clsx('relative rounded-xl overflow-hidden border border-gray-200', className)}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{ height: heightStyle }}
        className={clsx(
          'w-full',
          disabled && 'opacity-60 pointer-events-none'
        )}
      />

      {/* Loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ height: heightStyle }}
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>جاري تحميل الخريطة...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-2 right-2 left-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Placeholder when no location selected */}
      {!value && !isLoading && !error && (
        <div className="absolute bottom-2 right-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          {placeholder}
        </div>
      )}

      {/* Location button */}
      {showLocationButton && !disabled && (
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className={clsx(
            'absolute top-2 left-2 bg-white rounded-lg shadow-md p-2 transition-all',
            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="تحديد موقعي الحالي"
          aria-label="تحديد موقعي الحالي"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 text-primary-500" />
          )}
        </button>
      )}

      {/* Selected coordinates display */}
      {value && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600 font-mono">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

export default MapPicker;
