'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function TicketSuccessPage() {
  const searchParams = useSearchParams();
  const ticketNumber = searchParams.get('ticketNumber');
  const trackingToken = searchParams.get('trackingToken');

  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const copyToClipboard = async (text: string, type: 'ticket' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'ticket') {
        setCopiedTicket(true);
        setTimeout(() => setCopiedTicket(false), 2000);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Confetti effect
  useEffect(() => {
    // Simple confetti animation using CSS
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      confetti.style.animationDuration = `${3 + Math.random() * 2}s`;
      container.appendChild(confetti);
    }

    // Cleanup
    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  if (!ticketNumber || !trackingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <WarningIcon className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">خطأ</h1>
          <p className="text-slate-400 mb-6">معلومات التذكرة غير متوفرة</p>
          <Link
            href="/customer/create"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>انشاء تذكرة جديدة</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Confetti Container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-0" />

      <style jsx global>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          top: -10px;
          opacity: 0;
          animation: fall linear forwards;
        }

        @keyframes fall {
          0% {
            opacity: 1;
            top: -10px;
            transform: rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            top: 100vh;
            transform: rotate(720deg) scale(0);
          }
        }
      `}</style>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Success Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 text-center mb-6 shadow-xl shadow-green-600/20">
          {/* Checkmark Animation */}
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center animate-scale-in">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon className="w-12 h-12 text-white animate-draw-check" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">تم انشاء طلب الصيانة بنجاح!</h1>
          <p className="text-green-100">سيتم التواصل معك قريباً لتأكيد الموعد</p>
        </div>

        <style jsx>{`
          @keyframes scale-in {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }

          @keyframes draw-check {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 0; }
          }

          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
        `}</style>

        {/* Ticket Info Card */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">معلومات التذكرة</h2>

          {/* Ticket Number */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">رقم التذكرة</span>
              <button
                onClick={() => copyToClipboard(ticketNumber, 'ticket')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {copiedTicket ? (
                  <span className="text-green-400 text-sm">تم النسخ!</span>
                ) : (
                  <CopyIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-2xl font-bold text-white font-mono tracking-wider" dir="ltr">
              {ticketNumber}
            </p>
          </div>

          {/* Tracking Token */}
          <div className="bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">رمز التتبع</span>
              <button
                onClick={() => copyToClipboard(trackingToken, 'token')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {copiedToken ? (
                  <span className="text-green-400 text-sm">تم النسخ!</span>
                ) : (
                  <CopyIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-lg font-medium text-white font-mono break-all" dir="ltr">
              {trackingToken}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              احتفظ برمز التتبع لمتابعة حالة طلبك
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-300 mb-1">الخطوات التالية</h3>
              <ul className="text-sm text-blue-200/80 space-y-1">
                <li>سيقوم فريقنا بمراجعة طلبك</li>
                <li>سيتم تعيين فني متخصص لخدمتك</li>
                <li>ستتلقى رسالة تأكيد بالموعد</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/customer/track?token=${trackingToken}`}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <TrackIcon className="w-5 h-5" />
            <span>تتبع الطلب</span>
          </Link>

          <Link
            href="/customer"
            className="flex items-center justify-center gap-2 bg-slate-700 text-white px-6 py-4 rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            <span>الصفحة الرئيسية</span>
          </Link>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'طلب صيانة جديد',
                text: `تم انشاء طلب صيانة برقم ${ticketNumber}\nرمز التتبع: ${trackingToken}`,
              });
            }
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white py-3 rounded-xl transition-colors"
        >
          <ShareIcon className="w-5 h-5" />
          <span>مشاركة معلومات التذكرة</span>
        </button>
      </div>
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
