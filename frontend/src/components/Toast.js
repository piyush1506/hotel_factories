'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function ToastItem({ toast, onDismiss }) {
  const duration = toast.duration || 4000;
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

  // Light theme status configurations
  const config = (() => {
    if (isError) {
      return {
        bar: 'bg-rose-500',
        accentBorder: 'border-l-[3px] border-l-rose-500',
        title: toast.title || 'Error'
      };
    }
    if (isSuccess) {
      return {
        bar: 'bg-emerald-500',
        accentBorder: 'border-l-[3px] border-l-emerald-500',
        title: toast.title || 'Success'
      };
    }
    if (isSpecial) {
      return {
        bar: 'bg-amber-500',
        accentBorder: 'border-l-[3px] border-l-amber-500',
        title: toast.title || 'Featured'
      };
    }
    return {
      bar: 'bg-blue-500',
      accentBorder: 'border-l-[3px] border-l-blue-500',
      title: toast.title || ''
    };
  })();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group pointer-events-auto relative w-full sm:w-auto min-w-[260px] sm:max-w-sm flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-md bg-white/98 backdrop-blur-md text-slate-800 border border-slate-200/80 ${config.accentBorder} shadow-[0_8px_24px_rgba(15,23,42,0.1)] transition-all duration-200 select-none animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1 py-0.5">
        {config.title && (
          <span className="text-[11px] font-bold text-slate-900 shrink-0">
            {config.title}:
          </span>
        )}
        <span className="text-xs font-medium text-slate-700 tracking-tight leading-snug line-clamp-1 truncate">
          {toast.message}
        </span>
      </div>

      {/* Action / Dismiss Buttons */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              if (toast.action.onClick) toast.action.onClick();
              onDismiss(toast.id);
            }}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <i className="fa-solid fa-xmark text-[11px]" />
        </button>
      </div>

      {/* Subtle Bottom Progress Countdown Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden pointer-events-none rounded-b-md">
        <div
          className={`h-full ${config.bar} transition-all duration-75 ease-linear`}
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
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full max-w-[calc(100vw-32px)] sm:max-w-md pointer-events-none"
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
