'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function ToastItem({ toast, onDismiss }) {
  const duration = toast.duration || 4200;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const intervalTime = 25;
    const initialRemaining = remainingTimeRef.current;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(0, initialRemaining - elapsed);
      remainingTimeRef.current = newRemaining;
      const pct = (newRemaining / duration) * 100;
      setProgress(pct);

      if (newRemaining <= 0) {
        clearInterval(timerRef.current);
        onDismiss(toast.id);
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, duration, toast.id, onDismiss]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isSpecial = toast.type === 'special';

  // Light Luxury Theme config
  const config = (() => {
    if (isError) {
      return {
        badgeBg: 'bg-rose-50 text-rose-600 ring-rose-200 shadow-xs',
        icon: 'fa-solid fa-circle-exclamation',
        ring: 'ring-rose-200/60',
        progress: 'bg-rose-500',
        glow: 'shadow-[0_12px_36px_rgba(244,63,94,0.14),0_2px_8px_rgba(0,0,0,0.06)]',
      };
    }
    if (isSuccess) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200 shadow-xs',
        icon: 'fa-solid fa-circle-check',
        ring: 'ring-emerald-200/60',
        progress: 'bg-emerald-500',
        glow: 'shadow-[0_12px_36px_rgba(16,185,129,0.14),0_2px_8px_rgba(0,0,0,0.06)]',
      };
    }
    if (isSpecial) {
      return {
        badgeBg: 'bg-amber-50 text-amber-600 ring-amber-200 shadow-xs',
        icon: 'fa-solid fa-sparkles',
        ring: 'ring-amber-200/60',
        progress: 'bg-amber-500',
        glow: 'shadow-[0_12px_36px_rgba(245,158,11,0.14),0_2px_8px_rgba(0,0,0,0.06)]',
      };
    }
    return {
      badgeBg: 'bg-sky-50 text-sky-600 ring-sky-200 shadow-xs',
      icon: 'fa-solid fa-circle-info',
      ring: 'ring-sky-200/60',
      progress: 'bg-sky-500',
      glow: 'shadow-[0_12px_36px_rgba(14,165,233,0.14),0_2px_8px_rgba(0,0,0,0.06)]',
    };
  })();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group pointer-events-auto relative inline-flex items-center gap-3 py-2.5 px-4 sm:px-4.5 rounded-full bg-white/98 backdrop-blur-2xl text-slate-900 border border-slate-200/90 ring-1 ${config.ring} ${config.glow} transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] animate-in fade-in slide-in-from-top-3 zoom-in-95 duration-200 select-none`}
    >
      {/* Status Icon Badge */}
      <div className={`w-6 h-6 rounded-full ring-1 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${config.badgeBg}`}>
        <i className={`${config.icon} text-xs`} />
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 pr-1">
        {toast.title && (
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            {toast.title}
          </span>
        )}
        <span className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight leading-snug truncate max-w-[65vw] sm:max-w-md">
          {toast.message}
        </span>
      </div>

      {/* Optional Action Button */}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            if (toast.action.onClick) toast.action.onClick();
            onDismiss(toast.id);
          }}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 underline underline-offset-2 shrink-0 cursor-pointer px-1 transition-colors"
        >
          {toast.action.label}
        </button>
      )}

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-0.5"
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <i className="fa-solid fa-xmark text-[11px]" />
      </button>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-1 left-5 right-5 h-[2px] bg-slate-100 rounded-full overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div
          className={`h-full ${config.progress} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Toast() {
  const { toasts, dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-auto max-w-[94vw] sm:max-w-lg pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
        />
      ))}
    </aside>
  );
}
