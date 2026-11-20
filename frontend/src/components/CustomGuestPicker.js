'use client';

import React, { useState, useEffect } from 'react';

const PRESET_OPTIONS = [
  {
    id: '2 Adults (1 Room)',
    label: '2 Adults (1 Room)',
    sub: 'Most popular for couples & leisure',
    badge: 'Couple',
    icon: 'fa-solid fa-user-group',
    adults: 2,
    children: 0,
    rooms: 1
  },
  {
    id: '1 Adult (1 Room)',
    label: '1 Adult (1 Room)',
    sub: 'Single business or solo traveler',
    badge: 'Solo',
    icon: 'fa-solid fa-user',
    adults: 1,
    children: 0,
    rooms: 1
  },
  {
    id: '2 Adults, 1 Child (1 Room)',
    label: '2 Adults, 1 Child (1 Room)',
    sub: 'Family holiday with child (0-11 yrs)',
    badge: 'Family',
    icon: 'fa-solid fa-people-roof',
    adults: 2,
    children: 1,
    rooms: 1
  },
  {
    id: '3 Adults (1 Room)',
    label: '3 Adults (1 Room)',
    sub: 'Triple occupancy with extra bedding',
    badge: 'Triple',
    icon: 'fa-solid fa-users',
    adults: 3,
    children: 0,
    rooms: 1
  },
  {
    id: '4 Adults (2 Rooms)',
    label: '4 Adults (2 Rooms)',
    sub: 'Multi-room family or friends group',
    badge: 'Group',
    icon: 'fa-solid fa-door-open',
    adults: 4,
    children: 0,
    rooms: 2
  }
];

export default function CustomGuestPicker({
  value = '2 Adults (1 Room)',
  onChange,
  isOpen = false,
  onToggle,
  onClose
}) {
  // Parse initial counts from value
  const [adults, setAdults] = useState(() => {
    const match = String(value).match(/(\d+)\s*Adult/i);
    return match ? Number(match[1]) : 2;
  });

  const [childrenCount, setChildrenCount] = useState(() => {
    const match = String(value).match(/(\d+)\s*Child/i);
    return match ? Number(match[1]) : 0;
  });

  const [rooms, setRooms] = useState(() => {
    const match = String(value).match(/(\d+)\s*Room/i);
    return match ? Number(match[1]) : 1;
  });

  const [showSteppers, setShowSteppers] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    const aMatch = String(value).match(/(\d+)\s*Adult/i);
    const cMatch = String(value).match(/(\d+)\s*Child/i);
    const rMatch = String(value).match(/(\d+)\s*Room/i);
    if (aMatch) setAdults(Number(aMatch[1]));
    if (cMatch) setChildrenCount(Number(cMatch[1]));
    if (rMatch) setRooms(Number(rMatch[1]));
  }, [value]);

  const computeConfigString = (a, c, r) => {
    const adultStr = `${a} ${a === 1 ? 'Adult' : 'Adults'}`;
    const childStr = c > 0 ? `, ${c} ${c === 1 ? 'Child' : 'Children'}` : '';
    const roomStr = ` (${r} ${r === 1 ? 'Room' : 'Rooms'})`;
    return `${adultStr}${childStr}${roomStr}`;
  };

  const handleSelectPreset = (preset) => {
    setAdults(preset.adults);
    setChildrenCount(preset.children);
    setRooms(preset.rooms);
    if (onChange) onChange(preset.id);
    if (onClose) onClose();
  };

  const handleUpdateSteppers = (newA, newC, newR) => {
    setAdults(newA);
    setChildrenCount(newC);
    setRooms(newR);
    const newStr = computeConfigString(newA, newC, newR);
    if (onChange) onChange(newStr);
  };

  return (
    <div className="custom-guest-picker-container relative w-full">
      {/* Trigger Card (replacing raw HTML select) */}
      <div
        className={`custom-guest-trigger flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-blue-400 transition-all shadow-2xs ${isOpen ? 'is-open ring-2 ring-blue-500/20 border-blue-500' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-label="Select Guests and Rooms"
      >
        <div className="guest-trigger-left flex items-center gap-3">
          <div className="guest-trigger-icon w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-user-group text-sm" />
          </div>
          <div className="guest-trigger-info text-left">
            <span className="guest-trigger-label block text-[10px] font-bold text-slate-400 uppercase tracking-wider">GUESTS &amp; ROOMS</span>
            <strong className="guest-trigger-value block text-sm font-bold text-slate-800">{value || `${adults} ${adults === 1 ? 'Adult' : 'Adults'} (${rooms} ${rooms === 1 ? 'Room' : 'Rooms'})`}</strong>
          </div>
        </div>

        <div className={`guest-trigger-chevron text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate rotate-180 text-emerald-600' : ''}`}>
          <i className="fa-solid fa-chevron-down" />
        </div>
      </div>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div className="custom-guest-dropdown-card absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="guest-dropdown-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Guests &amp; Rooms Configuration</h4>
              <p className="text-xs text-slate-500 mt-0.5">Select a quick stay option or customize exact counts</p>
            </div>
            {onClose && (
              <button
                type="button"
                className="guest-dropdown-close-btn w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            )}
          </div>

          {/* Quick Presets List */}
          <div className="guest-presets-stack py-3 space-y-2">
            {PRESET_OPTIONS.map((opt) => {
              const isSelected = value === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`guest-preset-option flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'active bg-emerald-50/70 border-emerald-500 shadow-2xs' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'}`}
                  onClick={() => handleSelectPreset(opt)}
                >
                  <div className={`preset-option-icon w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <i className={opt.icon} />
                  </div>
                  <div className="preset-option-details flex-1 min-w-0">
                    <div className="preset-title-row flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold text-slate-900 truncate">{opt.label}</strong>
                      <span className="preset-pill-tag text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">{opt.badge}</span>
                    </div>
                    <small className="block text-[11px] text-slate-500 mt-0.5 truncate">{opt.sub}</small>
                  </div>
                  <div className="preset-radio-indicator text-sm shrink-0">
                    <i className={`fa-${isSelected ? 'solid fa-circle-check text-emerald-600' : 'regular fa-circle text-slate-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Steppers Toggle Bar */}
          <div className="guest-stepper-toggle-bar border-t border-slate-100 pt-2 pb-1">
            <button
              type="button"
              className="toggle-steppers-btn w-full py-2 px-3 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-between transition-colors"
              onClick={() => setShowSteppers(!showSteppers)}
            >
              <span>{showSteppers ? 'Hide Custom Steppers' : '+ Customize Exact Counts (Adults, Kids, Rooms)'}</span>
              <i className={`fa-solid fa-chevron-${showSteppers ? 'up' : 'down'} text-[10px]`} />
            </button>
          </div>

          {/* Fine-tuning Steppers */}
          {showSteppers && (
            <div className="guest-steppers-panel bg-slate-50 rounded-xl p-3 my-2 space-y-3 border border-slate-100">
              {/* Rooms Counter */}
              <div className="stepper-row flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Rooms</strong>
                  <small className="block text-[10px] text-slate-400">Max 5 rooms per booking</small>
                </div>
                <div className="stepper-controls flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={rooms <= 1}
                    onClick={() => handleUpdateSteppers(adults, childrenCount, Math.max(1, rooms - 1))}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{rooms}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={rooms >= 5}
                    onClick={() => handleUpdateSteppers(adults, childrenCount, Math.min(5, rooms + 1))}
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* Adults Counter */}
              <div className="stepper-row flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Adults</strong>
                  <small className="block text-[10px] text-slate-400">Age 12+ years</small>
                </div>
                <div className="stepper-controls flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adults <= 1}
                    onClick={() => handleUpdateSteppers(Math.max(1, adults - 1), childrenCount, rooms)}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{adults}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adults >= 10}
                    onClick={() => handleUpdateSteppers(Math.min(10, adults + 1), childrenCount, rooms)}
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* Children Counter */}
              <div className="stepper-row flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Children</strong>
                  <small className="block text-[10px] text-slate-400">Age 0 - 11 years</small>
                </div>
                <div className="stepper-controls flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={childrenCount <= 0}
                    onClick={() => handleUpdateSteppers(adults, Math.max(0, childrenCount - 1), rooms)}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{childrenCount}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={childrenCount >= 6}
                    onClick={() => handleUpdateSteppers(adults, Math.min(6, childrenCount + 1), rooms)}
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="guest-dropdown-footer flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <div className="current-summary flex items-center gap-1.5 text-xs text-slate-600 font-semibold truncate">
              <i className="fa-solid fa-circle-check text-emerald-600" />
              <span className="truncate">{value}</span>
            </div>
            <button
              type="button"
              className="guest-apply-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0"
              onClick={onClose}
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
