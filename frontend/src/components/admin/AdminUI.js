'use client';

import React, { useEffect } from 'react';
import { getInitials, statusToneClasses } from './adminUtils';

export function Badge({ tone = 'slate', children, dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusToneClasses(tone)} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Panel({ children, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] ${className}`}>
      {children}
    </Tag>
  );
}

export function PanelHeader({ title, subtitle, action, icon, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-sm text-slate-400 ring-1 ring-inset ring-slate-200">
            <i className={`fa-solid ${icon}`} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">{eyebrow}</span>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-[24px] font-bold leading-tight tracking-[-0.015em] text-slate-900 sm:text-[28px]">
            {title}
          </h1>
          {meta}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, hint, trend, className = '' }) {
  const positive = typeof trend === 'number' ? trend >= 0 : null;
  return (
    <Panel className={`relative overflow-hidden p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-1.5 truncate font-heading text-[24px] font-semibold leading-tight tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200" aria-hidden="true">
          <i className={`fa-solid ${icon}`} />
        </span>
      </div>
      <div className="mt-3 flex min-h-[18px] items-center gap-2">
        {positive !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            <i className={`fa-solid fa-arrow-trend-${positive ? 'up' : 'down'}`} aria-hidden="true" />
            {Math.abs(trend)}%
          </span>
        )}
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </Panel>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search…', className = '', ariaLabel }) {
  return (
    <label className={`relative block ${className}`}>
      <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}

export function FilterSelect({ value, onChange, options, ariaLabel, className = '' }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedTabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto rounded-md bg-slate-100 p-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 rounded px-3 py-1 text-xs font-semibold transition ${
            value === tab.value
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 rounded px-1.5 py-0.2 text-xs font-semibold ${value === tab.value ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'fa-inbox', title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center ${className}`}>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-50 text-base text-slate-400 ring-1 ring-slate-200">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-heading text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading data…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-6 py-16 text-xs font-semibold text-slate-500 ${className}`}>
      <i className="fa-solid fa-circle-notch fa-spin text-slate-400" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Avatar({ name, size = 'md', src, className = '' }) {
  const sizes = { xs: 'h-7 w-7 text-xs', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' };
  if (src) {
    return <img src={src} alt={name || 'User avatar'} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`} />;
  }
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-slate-700 font-semibold text-white ${sizes[size]} ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export function DetailRow({ label, value, strong = false, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 text-xs ${className}`}>
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className={`text-right ${strong ? 'font-semibold text-slate-900' : 'font-semibold text-slate-700'}`}>{value}</span>
    </div>
  );
}

export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`block ${className}`}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';

export function TextInput({ className = '', ...props }) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

export function TextArea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} {...props} className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`} />;
}

export function SelectInput({ className = '', children, ...props }) {
  return <select {...props} className={`${inputClass} ${className}`}>{children}</select>;
}

export function PrimaryButton({ children, icon, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon && <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function GhostButton({ children, icon, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon && <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close panel" onClick={onClose} className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]" />
      <div className={`admin-drawer-panel relative flex h-full w-full flex-col border-l border-slate-200 bg-[#f8fafc] shadow-lg shadow-slate-950/10 ${width}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="admin-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]" />
      <div className={`admin-modal-panel relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-lg shadow-slate-950/10 sm:rounded-lg ${size}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="admin-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', busy = false, tone = 'rose' }) {
  const toneClass = tone === 'rose' ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300' : 'bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-300';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
          >
            {busy && <i className="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  );
}

export function TableShell({ children, className = '' }) {
  return <div className={`admin-table-scroll overflow-x-auto ${className}`}>{children}</div>;
}
