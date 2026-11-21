'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';

// Safe local date parser and formatter (zero timezone shift)
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatLocalDate(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
  checkInDate,
  checkOutDate,
  onChange,
  onClose,
  initialFocus = 'checkin', // 'checkin' | 'checkout'
  minDate = null,
  isDualMonth = true
}) {
  const parsedIn = useMemo(() => parseLocalDate(checkInDate), [checkInDate]);
  const parsedOut = useMemo(() => parseLocalDate(checkOutDate), [checkOutDate]);

  // Current view month (default to checkIn month or today)
  const [viewDate, setViewDate] = useState(() => {
    const focusTarget = initialFocus === 'checkout' && checkOutDate ? checkOutDate : checkInDate;
    if (focusTarget) {
      const d = parseLocalDate(focusTarget);
      if (d) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(2026, 9, 1); // Default to October 2026
  });

  // Track selection state: 'start' (picking check-in) or 'end' (picking check-out)
  const [selectingStep, setSelectingStep] = useState(
    initialFocus === 'checkout' && checkInDate ? 'end' : 'start'
  );
  const [tempStart, setTempStart] = useState(checkInDate || '');
  const [tempEnd, setTempEnd] = useState(checkOutDate || '');
  const [hoverDate, setHoverDate] = useState('');

  const isInternalChangeRef = useRef(false);
  const prevFocusRef = useRef(initialFocus);

  // Synchronize internal selection state whenever props change from outside
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    setTempStart(checkInDate || '');
    setTempEnd(checkOutDate || '');
    const focusTarget = initialFocus === 'checkout' && checkOutDate ? checkOutDate : checkInDate;
    if (focusTarget) {
      const d = parseLocalDate(focusTarget);
      if (d) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    if (prevFocusRef.current !== initialFocus) {
      prevFocusRef.current = initialFocus;
      setSelectingStep(initialFocus === 'checkout' && checkInDate ? 'end' : 'start');
      const focusTarget = initialFocus === 'checkout' && checkOutDate ? checkOutDate : checkInDate;
      if (focusTarget) {
        const d = parseLocalDate(focusTarget);
        if (d) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [initialFocus, checkInDate, checkOutDate]);

  // Min selectable date (default to today at midnight)
  const minSelectable = useMemo(() => {
    if (minDate) return parseLocalDate(minDate);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [minDate]);

  // Navigate months
  const prevMonth = (e) => {
    e?.stopPropagation();
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = (e) => {
    e?.stopPropagation();
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build calendar matrix for a given month
  const getMonthMatrix = (year, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const matrix = [];
    let currentWeek = [];

    // Blank cells before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Days 1..N
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, monthIndex, d);
      currentWeek.push({
        day: d,
        dateStr: formatLocalDate(dayDate),
        dateObj: dayDate
      });

      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    }

    // Trailing blank cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      matrix.push(currentWeek);
    }

    return matrix;
  };

  const month1Year = viewDate.getFullYear();
  const month1Index = viewDate.getMonth();
  const month1Matrix = useMemo(() => getMonthMatrix(month1Year, month1Index), [month1Year, month1Index]);

  const month2Date = useMemo(() => new Date(month1Year, month1Index + 1, 1), [month1Year, month1Index]);
  const month2Year = month2Date.getFullYear();
  const month2Index = month2Date.getMonth();
  const month2Matrix = useMemo(() => getMonthMatrix(month2Year, month2Index), [month2Year, month2Index]);

  // Effective hover preview end date
  const effectiveHoverEnd = hoverDate && tempStart && hoverDate > tempStart ? hoverDate : '';

  // Night count calculation (updates dynamically on hover when picking check-out)
  const calculatedNights = useMemo(() => {
    const s = parseLocalDate(tempStart);
    const endToCompare = tempEnd || (selectingStep === 'end' && effectiveHoverEnd ? effectiveHoverEnd : '');
    const e = parseLocalDate(endToCompare);
    if (!s || !e || e <= s) return 0;
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  }, [tempStart, tempEnd, selectingStep, effectiveHoverEnd]);

  // Format chip date with day of week (e.g., "Mon, 9 Aug '27")
  const formatChipDisplay = (dateStr) => {
    if (!dateStr) return 'Select date';
    const d = parseLocalDate(dateStr);
    if (!d) return dateStr;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
  };

  // Date selection handler: lets user customize arbitrary Check-In and Check-Out dates
  const handleDateClick = (dateStr) => {
    if (!dateStr) return;

    if (selectingStep === 'start') {
      // 1. User clicked to set Check-In date
      setTempStart(dateStr);
      setTempEnd(''); // Clear Check-Out so user can pick any custom Check-Out date
      setSelectingStep('end');
    } else {
      // 2. User clicked to set Check-Out date
      if (tempStart && dateStr > tempStart) {
        // Valid Check-Out date after Check-In -> set range & complete selection!
        setTempEnd(dateStr);
        setSelectingStep('start');
        isInternalChangeRef.current = true;
        if (onChange) {
          onChange({ checkInDate: tempStart, checkOutDate: dateStr });
        }
        if (onClose) {
          window.setTimeout(() => onClose(), 220);
        }
      } else {
        // Clicked date is earlier than or equal to current Check-In date
        // Treat as new Check-In date and keep waiting for Check-Out
        setTempStart(dateStr);
        setTempEnd('');
        setSelectingStep('end');
      }
    }
  };

  // Quick preset shortcuts
  const applyPreset = (startStr, endStr) => {
    setTempStart(startStr);
    setTempEnd(endStr);
    setSelectingStep('start');
    const d = parseLocalDate(startStr);
    if (d) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    isInternalChangeRef.current = true;
    if (onChange) {
      onChange({ checkInDate: startStr, checkOutDate: endStr });
    }
    if (onClose) {
      window.setTimeout(() => onClose(), 200);
    }
  };

  const handleApply = () => {
    if (tempStart) {
      let finalEnd = tempEnd;
      if (!finalEnd || finalEnd <= tempStart) {
        // Default to +1 night if checkout was not selected yet
        const s = parseLocalDate(tempStart);
        s.setDate(s.getDate() + 1);
        finalEnd = formatLocalDate(s);
      }
      isInternalChangeRef.current = true;
      if (onChange) {
        onChange({ checkInDate: tempStart, checkOutDate: finalEnd });
      }
    }
    if (onClose) onClose();
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    setSelectingStep('start');
  };

  // Render month calendar grid
  const renderMonth = (year, monthIdx, matrix) => (
    <div className="custom-calendar-month flex-1 min-w-[280px]">
      <div className="custom-cal-month-title text-center font-bold text-slate-800 text-sm mb-3">
        {MONTH_NAMES[monthIdx]} {year}
      </div>

      <div className="custom-cal-weekdays grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
        {WEEKDAY_NAMES.map((w) => (
          <span key={w} className="custom-cal-weekday py-1">{w}</span>
        ))}
      </div>

      <div className="custom-cal-days-grid">
        {matrix.map((week, wIdx) => (
          <div key={wIdx} className="custom-cal-week-row">
            {week.map((cell, cIdx) => {
              if (!cell) {
                return <div key={cIdx} className="custom-cal-day-cell is-empty" />;
              }

              const { day, dateStr, dateObj } = cell;
              const isPast = minSelectable && dateObj < minSelectable;
              const isStart = dateStr === tempStart;
              const isEnd = dateStr === tempEnd;
              
              // In active selected range (connecting start and end dates with continuous blue strip)
              const isInSelectedRange = Boolean(tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd);

              // In hover preview range (when picking checkout date and hovering forward)
              const isInHoverRange = Boolean(
                selectingStep === 'end' && tempStart && !tempEnd && effectiveHoverEnd &&
                dateStr > tempStart && dateStr < effectiveHoverEnd
              );

              const isHoverEnd = Boolean(
                selectingStep === 'end' && tempStart && !tempEnd && effectiveHoverEnd &&
                dateStr === effectiveHoverEnd
              );

              const isStandalone = Boolean(isStart && !tempEnd && !effectiveHoverEnd);

              const isToday = (() => {
                const now = new Date();
                return dateObj.getFullYear() === now.getFullYear() &&
                       dateObj.getMonth() === now.getMonth() &&
                       dateObj.getDate() === now.getDate();
              })();

              const cellClasses = [
                'custom-cal-day-cell',
                isPast ? 'is-disabled' : '',
                isToday ? 'is-today' : '',
                isStart ? 'is-start-date' : '',
                isEnd ? 'is-end-date' : '',
                isStandalone ? 'is-standalone' : '',
                isHoverEnd ? 'is-hover-end' : '',
                isInSelectedRange ? 'in-range' : '',
                isInHoverRange ? 'in-hover-range' : ''
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={cIdx}
                  type="button"
                  className={cellClasses}
                  disabled={isPast}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  onMouseEnter={() => !isPast && setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate('')}
                  title={dateStr}
                >
                  <span className="cal-day-number text-xs leading-none">{day}</span>
                  {isStart && <span className="cal-badge-pill start">Check-In</span>}
                  {(isEnd || isHoverEnd) && !isStart && <span className="cal-badge-pill end">Check-Out</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="custom-datepicker-card bg-white rounded-2xl shadow-xl border border-slate-200 p-4 select-none max-w-full" onClick={(e) => e.stopPropagation()}>
      {/* Calendar Header with Step Guidance & Month Switchers */}
      <div className="custom-datepicker-head flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="datepicker-status-chips flex items-center gap-2 flex-wrap">
          <div
            className={`status-chip px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${selectingStep === 'start' ? 'active bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setSelectingStep('start')}
            role="button"
            tabIndex={0}
            title="Click to select Check-In date"
          >
            <span className="chip-label block text-[10px] text-slate-400 uppercase tracking-wider">Check-In</span>
            <strong className="text-slate-800">{tempStart ? formatChipDisplay(tempStart) : 'Select date'}</strong>
          </div>
          <div className="datepicker-arrow-icon text-slate-400 text-xs">
            <i className="fa-solid fa-arrow-right" />
          </div>
          <div
            className={`status-chip px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${selectingStep === 'end' ? 'active bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setSelectingStep('end')}
            role="button"
            tabIndex={0}
            title="Click to select Check-Out date"
          >
            <span className="chip-label block text-[10px] text-slate-400 uppercase tracking-wider">Check-Out</span>
            <strong className="text-slate-800">
              {tempEnd
                ? formatChipDisplay(tempEnd)
                : (selectingStep === 'end' && effectiveHoverEnd ? formatChipDisplay(effectiveHoverEnd) : 'Select date')}
            </strong>
          </div>
          {calculatedNights > 0 && (
            <div className="nights-counter-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xs">
              <i className="fa-solid fa-moon text-[11px]" /> {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
            </div>
          )}
        </div>

        <div className="cal-nav-controls flex items-center gap-1.5">
          <button
            type="button"
            className="cal-nav-btn prev w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={prevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
          </button>
          <button
            type="button"
            className="cal-nav-btn next w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={nextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <i className="fa-solid fa-chevron-right text-xs" />
          </button>
        </div>
      </div>

      {/* Calendar Months Container (Dual Month on Desktop, Single on Mobile) */}
      <div className={`custom-datepicker-months py-3 flex gap-6 overflow-x-auto ${isDualMonth ? 'dual-view flex-col md:flex-row' : 'single-view'}`}>
        {renderMonth(month1Year, month1Index, month1Matrix)}
        {isDualMonth && (
          <div className="hidden md:block flex-1 min-w-[280px]">
            {renderMonth(month2Year, month2Index, month2Matrix)}
          </div>
        )}
      </div>

      {/* Quick Select Presets Bar */}
      <div className="custom-datepicker-presets flex items-center gap-2 py-2.5 border-t border-slate-100 flex-wrap text-xs">
        <span className="presets-label text-slate-400 font-semibold mr-1">Quick picks:</span>
        <button
          type="button"
          className="preset-btn px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          onClick={() => {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            applyPreset(formatLocalDate(today), formatLocalDate(tomorrow));
          }}
        >
          Today (1N)
        </button>
        <button
          type="button"
          className="preset-btn px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          onClick={() => {
            const d = new Date();
            const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
            const sat = new Date();
            sat.setDate(d.getDate() + daysUntilSat);
            const sun = new Date();
            sun.setDate(sat.getDate() + 1);
            applyPreset(formatLocalDate(sat), formatLocalDate(sun));
          }}
        >
          This Weekend
        </button>
        <button
          type="button"
          className="preset-btn highlight px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
          onClick={() => applyPreset('2026-10-10', '2026-10-13')}
        >
          10-13 Oct'26 (Default)
        </button>
        <button
          type="button"
          className="preset-btn px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          onClick={() => {
            const now = new Date();
            const weekLater = new Date();
            weekLater.setDate(now.getDate() + 7);
            applyPreset(formatLocalDate(now), formatLocalDate(weekLater));
          }}
        >
          1 Week Stay
        </button>
      </div>

      {/* Action Footer */}
      <div className="custom-datepicker-foot flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
        <button type="button" className="cal-clear-btn px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors" onClick={handleClear}>
          Clear
        </button>
        <div className="cal-foot-right flex items-center gap-2">
          {onClose && (
            <button type="button" className="cal-cancel-btn px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="cal-apply-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            onClick={handleApply}
          >
            Apply Dates
          </button>
        </div>
      </div>
    </div>
  );
}
