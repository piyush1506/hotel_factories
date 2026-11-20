'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function DesktopFooter() {
  const { switchNav, setSelectedDestination, setIsDestinationsModalOpen } = useApp();

  const handleCityClick = (city) => {
    setSelectedDestination(city);
    switchNav('home');
    const el = document.getElementById('hotelsListSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-neutral-50 text-slate-700 border-t border-slate-200 mt-auto">
      {/* 1. Value Proposition Trust Bar */}
      <div className="border-b border-slate-200/90 py-5 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-black flex items-center justify-center shrink-0">
                <i className="fa-solid fa-calendar-check text-sm" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900 leading-tight">
                  Free Cancellation
                </strong>
                <span className="block text-[11px] text-slate-500">
                  On most rooms and bookings
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-black flex items-center justify-center shrink-0">
                <i className="fa-solid fa-headset text-sm" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900 leading-tight">
                  24/7 Global Support
                </strong>
                <span className="block text-[11px] text-slate-500">
                  Always here to help you
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-black flex items-center justify-center shrink-0">
                <i className="fa-solid fa-hotel text-sm" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900 leading-tight">
                  2.5M+ Properties
                </strong>
                <span className="block text-[11px] text-slate-500">
                  Worldwide verified inventory
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-black flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved text-sm" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900 leading-tight">
                  Best Price Guarantee
                </strong>
                <span className="block text-[11px] text-slate-500">
                  Find it cheaper? We match it
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Five Column Nav Directory */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-xs">
          
          {/* Column 1: Support */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-tight">Support</h4>
            <ul className="space-y-2 text-slate-600">
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Customer Help Center</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Safety Resource Center</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Cancellation Options</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Dispute Resolution</button></li>
            </ul>
          </div>

          {/* Column 2: Discover */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-tight">Discover</h4>
            <ul className="space-y-2 text-slate-600">
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Hotel Factories Club Rewards</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Seasonal &amp; Holiday Deals</button></li>
              <li><button onClick={() => switchNav('destinations')} className="hover:text-black transition-colors cursor-pointer text-left">India Travel Guides &amp; Stays</button></li>
              <li><button onClick={() => switchNav('destinations')} className="hover:text-black transition-colors cursor-pointer text-left font-semibold text-slate-900">Where We Provide Service (All Cities)</button></li>
            </ul>
          </div>

          {/* Column 3: Terms & Settings */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-tight">Terms &amp; Settings</h4>
            <ul className="space-y-2 text-slate-600">
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Privacy &amp; Cookie Statement</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Terms and Conditions</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">GST &amp; Invoicing Compliance</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Security &amp; Indian Privacy Rules</button></li>
            </ul>
          </div>

          {/* Column 4: About Hotel Factories */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-tight">About Hotel Factories</h4>
            <ul className="space-y-2 text-slate-600">
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">About Us</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Careers &amp; Culture</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Direct Hotelier Partnerships</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Investor Relations</button></li>
            </ul>
          </div>

          {/* Column 5: Partner with Us */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-tight">Partner with Us</h4>
            <ul className="space-y-2 text-slate-600">
              <li><button onClick={() => switchNav('admin')} className="hover:text-black transition-colors cursor-pointer text-left font-semibold text-black">List Your Hotel Property</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Hotelier Partner Network</button></li>
              <li><button onClick={() => switchNav('admin')} className="hover:text-black transition-colors cursor-pointer text-left">Extranet Partner Hub</button></li>
              <li><button onClick={() => {}} className="hover:text-black transition-colors cursor-pointer text-left">Hotel Factories Corporate</button></li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom App Badges & Copyright Strip */}
      <div className="border-t border-slate-200/80 py-5 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div>
            <p>© 2026 Hotel Factories India. All rights reserved. Rates are quoted in Indian Rupees (₹).</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hotel Factories is India&apos;s dedicated hotel &amp; stay booking network.</p>
          </div>

          {/* App Store / Google Play Buttons */}
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white transition-all cursor-pointer text-slate-800"
              onClick={() => {}}
            >
              <i className="fa-brands fa-apple text-base" />
              <div className="text-left leading-tight">
                <span className="block text-[9px] text-slate-400 uppercase font-semibold">GET IT ON</span>
                <span className="block text-xs font-bold">App Store</span>
              </div>
            </button>

            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white transition-all cursor-pointer text-slate-800"
              onClick={() => {}}
            >
              <i className="fa-brands fa-google-play text-sm text-emerald-500" />
              <div className="text-left leading-tight">
                <span className="block text-[9px] text-slate-400 uppercase font-semibold">DOWNLOAD FOR</span>
                <span className="block text-xs font-bold">Google Play</span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
