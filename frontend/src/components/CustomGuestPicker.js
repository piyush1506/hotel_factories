'use client';

import React, { useState, useEffect } from 'react';

const PRESET_OPTIONS = [
  {
    id: '1 Male, 1 Female (1 Room)',
    label: '1 Male, 1 Female (1 Room)',
    sub: 'Most popular for couples & leisure',
    badge: 'Couple',
    icon: 'fa-solid fa-user-group',
    adultsMale: 1,
    adultsFemale: 1,
    adults: 2,
    children: 0,
    rooms: 1
  },
  {
    id: '1 Male (1 Room)',
    label: '1 Male (1 Room)',
    sub: 'Solo business or male leisure traveler',
    badge: 'Solo Male',
    icon: 'fa-solid fa-person',
    adultsMale: 1,
    adultsFemale: 0,
    adults: 1,
    children: 0,
    rooms: 1
  },
  {
    id: '1 Female (1 Room)',
    label: '1 Female (1 Room)',
    sub: 'Solo female business or holiday traveler',
    badge: 'Solo Female',
    icon: 'fa-solid fa-person-dress',
    adultsMale: 0,
    adultsFemale: 1,
    adults: 1,
    children: 0,
    rooms: 1
  },
  {
    id: '2 Male, 1 Female (1 Room)',
    label: '2 Male, 1 Female (1 Room)',
    sub: 'Triple occupancy with extra bedding',
    badge: 'Triple',
    icon: 'fa-solid fa-users',
    adultsMale: 2,
    adultsFemale: 1,
    adults: 3,
    children: 0,
    rooms: 1
  },
  {
    id: '2 Male, 2 Female (2 Rooms)',
    label: '2 Male, 2 Female (2 Rooms)',
    sub: 'Multi-room family or friends group',
    badge: 'Group',
    icon: 'fa-solid fa-door-open',
    adultsMale: 2,
    adultsFemale: 2,
    adults: 4,
    children: 0,
    rooms: 2
  }
];

export default function CustomGuestPicker({
  value = '1 Male, 1 Female (1 Room)',
  onChange,
  isOpen = false,
  onToggle,
  onClose
}) {
  // Parse initial counts from value
  const [adultsMale, setAdultsMale] = useState(() => {
    const mMatch = String(value).match(/(\d+)\s*Male/i);
    if (mMatch) return Number(mMatch[1]);
    const aMatch = String(value).match(/(\d+)\s*Adult/i);
    return aMatch ? Math.ceil(Number(aMatch[1]) / 2) : 1;
  });

  const [adultsFemale, setAdultsFemale] = useState(() => {
    const fMatch = String(value).match(/(\d+)\s*Female/i);
    if (fMatch) return Number(fMatch[1]);
    const aMatch = String(value).match(/(\d+)\s*Adult/i);
    return aMatch ? Math.floor(Number(aMatch[1]) / 2) : 1;
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
    const mMatch = String(value).match(/(\d+)\s*Male/i);
    const fMatch = String(value).match(/(\d+)\s*Female/i);
    const aMatch = String(value).match(/(\d+)\s*Adult/i);
    const cMatch = String(value).match(/(\d+)\s*Child/i);
    const rMatch = String(value).match(/(\d+)\s*Room/i);

    if (mMatch) setAdultsMale(Number(mMatch[1]));
    else if (aMatch) setAdultsMale(Math.ceil(Number(aMatch[1]) / 2));

    if (fMatch) setAdultsFemale(Number(fMatch[1]));
    else if (aMatch) setAdultsFemale(Math.floor(Number(aMatch[1]) / 2));

    if (cMatch) setChildrenCount(Number(cMatch[1]));
    if (rMatch) setRooms(Number(rMatch[1]));
  }, [value]);

  const computeConfigString = (m, f, c, r) => {
    const guestsParts = [];
    if (m > 0) guestsParts.push(`${m} Male`);
    if (f > 0) guestsParts.push(`${f} Female`);
    if (guestsParts.length === 0) guestsParts.push('1 Adult');
    const guestStr = guestsParts.join(', ');
    const childStr = c > 0 ? `, ${c} ${c === 1 ? 'Child' : 'Children'}` : '';
    const roomStr = ` (${r} ${r === 1 ? 'Room' : 'Rooms'})`;
    return `${guestStr}${childStr}${roomStr}`;
  };

  const handleSelectPreset = (preset) => {
    setAdultsMale(preset.adultsMale);
    setAdultsFemale(preset.adultsFemale);
    setChildrenCount(preset.children);
    setRooms(preset.rooms);
    if (onChange) {
      onChange({
        id: preset.id,
        adults: preset.adults,
        adultsMale: preset.adultsMale,
        adultsFemale: preset.adultsFemale,
        children: preset.children,
        rooms: preset.rooms,
        text: preset.id
      });
    }
    if (onClose) onClose();
  };

  const handleUpdateSteppers = (newM, newF, newC, newR) => {
    setAdultsMale(newM);
    setAdultsFemale(newF);
    setChildrenCount(newC);
    setRooms(newR);
    const newStr = computeConfigString(newM, newF, newC, newR);
    if (onChange) {
      onChange({
        id: newStr,
        adults: newM + newF,
        adultsMale: newM,
        adultsFemale: newF,
        children: newC,
        rooms: newR,
        text: newStr
      });
    }
  };

  const totalAdults = adultsMale + adultsFemale;

  return (
    <div className="custom-guest-picker-container relative w-full">
      {/* Trigger Card */}
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
            <strong className="guest-trigger-value block text-sm font-bold text-slate-800">
              {value || `${adultsMale} Male, ${adultsFemale} Female (${rooms} Room)`}
            </strong>
          </div>
        </div>

        <div className={`guest-trigger-chevron text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate rotate-180 text-emerald-600' : ''}`}>
          <i className="fa-solid fa-chevron-down" />
        </div>
      </div>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div className="custom-guest-dropdown-card absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="guest-dropdown-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Guests &amp; Rooms Configuration</h4>
              <p className="text-xs text-slate-500 mt-0.5">Adults split into Male &amp; Female for clear stay planning</p>
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
              const isSelected = value === opt.id || (adultsMale === opt.adultsMale && adultsFemale === opt.adultsFemale && rooms === opt.rooms && childrenCount === opt.children);
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
              <span>{showSteppers ? 'Hide Custom Steppers' : '+ Customize Exact Counts (Male, Female, Kids, Rooms)'}</span>
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
                    onClick={() => handleUpdateSteppers(adultsMale, adultsFemale, childrenCount, Math.max(1, rooms - 1))}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{rooms}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={rooms >= 5}
                    onClick={() => handleUpdateSteppers(adultsMale, adultsFemale, childrenCount, Math.min(5, rooms + 1))}
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* Adults (Male) Counter */}
              <div className="stepper-row flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="fa-solid fa-person text-sky-600 text-xs" />
                    <span>Adult (Male)</span>
                  </strong>
                  <small className="block text-[10px] text-slate-400">Age 12+ years</small>
                </div>
                <div className="stepper-controls flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adultsMale <= 0 || (adultsMale === 1 && adultsFemale === 0)}
                    onClick={() => {
                      const nextM = Math.max(0, adultsMale - 1);
                      if (nextM + adultsFemale >= 1) {
                        handleUpdateSteppers(nextM, adultsFemale, childrenCount, rooms);
                      }
                    }}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{adultsMale}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adultsMale >= 8}
                    onClick={() => handleUpdateSteppers(adultsMale + 1, adultsFemale, childrenCount, rooms)}
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* Adults (Female) Counter */}
              <div className="stepper-row flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="fa-solid fa-person-dress text-pink-600 text-xs" />
                    <span>Adult (Female)</span>
                  </strong>
                  <small className="block text-[10px] text-slate-400">Age 12+ years</small>
                </div>
                <div className="stepper-controls flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adultsFemale <= 0 || (adultsFemale === 1 && adultsMale === 0)}
                    onClick={() => {
                      const nextF = Math.max(0, adultsFemale - 1);
                      if (adultsMale + nextF >= 1) {
                        handleUpdateSteppers(adultsMale, nextF, childrenCount, rooms);
                      }
                    }}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{adultsFemale}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={adultsFemale >= 8}
                    onClick={() => handleUpdateSteppers(adultsMale, adultsFemale + 1, childrenCount, rooms)}
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
                    onClick={() => handleUpdateSteppers(adultsMale, adultsFemale, Math.max(0, childrenCount - 1), rooms)}
                  >
                    &minus;
                  </button>
                  <span className="stepper-count w-6 text-center text-xs font-bold text-slate-800">{childrenCount}</span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition-all"
                    disabled={childrenCount >= 6}
                    onClick={() => handleUpdateSteppers(adultsMale, adultsFemale, Math.min(6, childrenCount + 1), rooms)}
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
              <span className="truncate">{adultsMale} Male, {adultsFemale} Female ({rooms} Room)</span>
            </div>
            <button
              type="button"
              className="guest-apply-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
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
