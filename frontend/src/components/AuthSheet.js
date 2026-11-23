'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthSheet() {
  const { isAuthSheetOpen, closeAllSheets, login, register, user, logout, updateProfile, switchNav, authTab } = useApp();
  const [tab, setTab] = useState(authTab || 'login'); // 'login' | 'register'
  
  // Sync local tab with context authTab (e.g. forced register when a guest books)
  useEffect(() => {
    if (isAuthSheetOpen && authTab) {
      setTab(authTab);
    }
  }, [authTab, isAuthSheetOpen]);
  
  // Profile edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`bottom-sheet ${isAuthSheetOpen ? 'active' : ''} p-6`}
      role="dialog"
      aria-modal="true"
      aria-label={user ? 'My Profile' : (tab === 'login' ? 'Account Login' : 'Create Account')}
    >
      <div className="sheet-handle w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden"></div>
      <div className="sheet-header flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="sheet-title text-lg font-extrabold text-ink">{user ? 'My Profile' : (tab === 'login' ? 'Account Login' : 'Create Account')}</div>
        <button 
          type="button"
          className="sheet-close-btn w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors" 
          onClick={closeAllSheets}
          aria-label="Close dialog"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="sheet-content space-y-4">
        {user ? (
          <div className="text-center py-3">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-brand text-2xl flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-user-check"></i>
            </div>

            {isEditingName ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!customName.trim()) return;
                  setSavingName(true);
                  try {
                    await updateProfile({ name: customName.trim() });
                    setIsEditingName(false);
                  } finally {
                    setSavingName(false);
                  }
                }}
                className="max-w-xs mx-auto mb-3 px-2"
              >
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-left">Your Full Name</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:border-black outline-none"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-base font-extrabold text-ink">
                  {user.name || 'Valued Guest'}
                </h3>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Edit your name"
                  onClick={() => {
                    setCustomName(user.name || '');
                    setIsEditingName(true);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square" />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-2">
              {user.email}
            </p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-5">
              Role: {user.role || 'Customer'}
            </span>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                onClick={() => {
                  switchNav('bookings');
                  closeAllSheets();
                }}
              >
                <i className="fa-solid fa-ticket" /> View My Trips & Bookings
              </button>

              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                onClick={() => {
                  switchNav('saved');
                  closeAllSheets();
                }}
              >
                <i className="fa-solid fa-heart text-rose-500" /> Saved Wishlist
              </button>

              {(user.role === 'admin' || user.role === 'hotel_owner') && (
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-amber-200"
                  onClick={() => {
                    switchNav('admin');
                    closeAllSheets();
                  }}
                >
                  <i className="fa-solid fa-crown text-amber-500" /> Partner / Admin Console
                </button>
              )}

              <button
                type="button"
                className="mmt-select-room-btn w-full py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200 shadow-none flex items-center justify-center gap-1.5"
                onClick={() => {
                  logout();
                  closeAllSheets();
                }}
              >
                <i className="fa-solid fa-right-from-bracket mr-1.5"></i> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selector */}
            <div className="auth-tab-bar grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                className={`auth-tab-btn py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'login' ? 'active bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'}`}
                onClick={() => setTab('login')}
              >
                <i className="fa-solid fa-arrow-right-to-bracket mr-1.5"></i> Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'register' ? 'active bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'}`}
                onClick={() => setTab('register')}
              >
                <i className="fa-solid fa-user-plus mr-1.5"></i> Register
              </button>
            </div>

            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="name@example.com"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="Enter your password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary-block w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Hotel Factories
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">Quick Demo Accounts</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                      onClick={() => {
                        setLoginEmail('admin@hotelfactories.com');
                        setLoginPassword('Password@123');
                        login('admin@hotelfactories.com', 'Password@123');
                      }}
                    >
                      <i className="fa-solid fa-shield-halved text-brand mr-1"></i> Admin
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                      onClick={() => {
                        setLoginEmail('hotelier1@hotelfactories.com');
                        setLoginPassword('Password@123');
                        login('hotelier1@hotelfactories.com', 'Password@123');
                      }}
                    >
                      <i className="fa-solid fa-hotel text-emerald-600 mr-1"></i> Hotelier
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                      onClick={() => {
                        setLoginEmail('rahul@example.com');
                        setLoginPassword('Password@123');
                        login('rahul@example.com', 'Password@123');
                      }}
                    >
                      <i className="fa-solid fa-user text-emerald-600 mr-1"></i> Customer
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="e.g. Vikram Singhania"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>

                <div className="form-row-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      placeholder="vikram@example.com"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      placeholder="+91 9876543210"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    className="form-input w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-ink font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary-block w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-user-plus"></i> Register &amp; Continue
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
