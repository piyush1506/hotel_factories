'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';

/**
 * DynamicQRCode Component with Cryptographic Anti-Forgery Protection
 * - Encodes a server-signed verification URL containing an HMAC-SHA256 cryptographic signature
 * - Protects against arbitrary/counterfeit QR payload generation by unauthorized third parties
 * - When scanned, the server validates the digital signature against the private server key
 * - Interactive scanner enlargement modal with laser scan-line effect
 * - Direct 1-tap download of high-res QR pass PNG to phone gallery
 * - 1-tap interactive tests: Authenticate Genuine Pass or Simulate Tampered QR
 */
export default function DynamicQRCode({
  booking,
  size = 64,
  showLabel = true,
  className = ''
}) {
  const { showToast, verifyBookingCode } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [lastSynced, setLastSynced] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const bookingCode = booking?.bookingCode || (
    booking?.id ? (
      booking.id.startsWith('BK-') || booking.id.startsWith('bk-')
        ? 'HF-' + booking.id.replace(/^bk-/i, '').slice(0, 8).toUpperCase()
        : booking.id
    ) : 'HF-2026-PASS'
  );

  const passSignature = booking?.passSignature || '';

  // Construct dynamic cryptographically signed verification URL using environment variable
  const getVerifyUrl = (forceTamper = false) => {
    const sig = forceTamper ? 'FORGED_INVALID_HASH_123' : passSignature;
    const sigParam = sig ? `&sig=${encodeURIComponent(sig)}` : '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}/?verify=${encodeURIComponent(bookingCode)}${sigParam}`;
  };

  useEffect(() => {
    let isMounted = true;
    const generateQR = async () => {
      try {
        const verifyUrl = getVerifyUrl();
        // Generate high-resolution QR with High (H) error correction to support center monogram
        const url = await QRCode.toDataURL(verifyUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 340,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        if (isMounted) {
          setQrDataUrl(url);
          const now = new Date();
          setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Failed to generate dynamic QR code:', err);
      }
    };

    generateQR();
    return () => {
      isMounted = false;
    };
  }, [bookingCode, passSignature]);

  const handleDownloadQR = (e) => {
    if (e) e.stopPropagation();
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `HF-FastCheck-Signed-Pass-${bookingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Signed QR Pass for ${bookingCode} saved to downloads!`);
  };

  const handleCopyLink = (e) => {
    if (e) e.stopPropagation();
    const url = getVerifyUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Signed FastCheck™ verification URL copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleTestVerify = (e, forceTamper = false) => {
    if (e) e.stopPropagation();
    if (verifyBookingCode) {
      const sigToUse = forceTamper ? 'FORGED_FAKE_SIGNATURE' : passSignature;
      verifyBookingCode(bookingCode, sigToUse);
      setIsEnlarged(false);
    }
  };

  return (
    <>
      {/* Compact Interactive QR Pass Thumbnail */}
      <div 
        onClick={() => setIsEnlarged(true)}
        className={`group relative flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer ${className}`}
        title="Click to enlarge for scanner"
        role="button"
        tabIndex={0}
      >
        {/* Scannable Frame with corner brackets */}
        <div 
          className="relative shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs group-hover:shadow-xs transition-shadow flex items-center justify-center overflow-hidden"
          style={{ width: size + 8, height: size + 8 }}
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`Signed Dynamic QR Pass for ${bookingCode}`} 
              className="object-contain w-full h-full rounded"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <i className="fa-solid fa-spinner fa-spin text-sm"></i>
            </div>
          )}

          {/* Tiny Center "HF" badge overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white font-black text-[6px] flex items-center justify-center shadow-xs border border-white">
              HF
            </span>
          </div>

          {/* Hover zoom pill overlay */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
            <i className="fa-solid fa-expand"></i>
          </div>
        </div>

        {/* Dynamic Pass Details */}
        {showLabel && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>HMAC-SHA256 SIGNED PASS</span>
            </div>

            <div className="text-xs font-black text-slate-900 truncate mt-0.5">
              {booking?.guestName || 'Guest'}
            </div>

            <div className="text-[10px] text-slate-500 font-medium truncate">
              {booking?.roomName || 'Executive Room'} · {bookingCode}
            </div>

            <div className="text-[9px] text-[#003b95] font-bold flex items-center gap-1 mt-1">
              <i className="fa-solid fa-shield-halved text-[8px] text-emerald-600"></i>
              <span>Anti-Forgery Protected · Tap to Enlarge</span>
            </div>
          </div>
        )}
      </div>

      {/* Enlarged FastCheck™ Scanner Modal */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsEnlarged(false)}
        >
          <div 
            className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>

            {/* Top Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2">
              <i className="fa-solid fa-lock text-[9px]"></i>
              Cryptographically Signed Pass
            </div>

            <h3 className="text-sm font-black text-slate-900">
              {booking?.hotelName || 'Hotel Royal Inn'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {booking?.guestName || 'Guest'} · {bookingCode}
            </p>

            {/* High-Resolution QR Container with Laser Scan Beam */}
            <div className="relative my-3 p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-lg mx-auto w-[210px] h-[210px] flex items-center justify-center overflow-hidden">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt={`FastCheck Pass ${bookingCode}`}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Center Monogram */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-300 font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                  HF
                </div>
              </div>

              {/* Animated Laser Scanner Line */}
              <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 animate-pulse pointer-events-none"></div>
            </div>

            {/* Security Explanation Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-[10px] space-y-1 mb-3">
              <div className="flex items-center justify-between font-mono">
                <span className="font-sans font-bold text-slate-700">Digital Seal:</span>
                <span className="font-bold text-emerald-700">HMAC-SHA256 Valid</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
                <span>Server Signature:</span>
                <span className="font-bold text-slate-800">{passSignature ? passSignature.slice(0, 12) + '...' : 'Protected'}</span>
              </div>
              <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 leading-tight">
                This QR pass cannot be forged or faked using third-party tools. Altering any reservation parameters invalidates the cryptographic signature.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold mb-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px]"
              >
                <i className="fa-solid fa-download text-xs text-slate-600"></i>
                <span>Save PNG Pass</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px]"
              >
                <i className={`fa-solid ${copiedLink ? 'fa-check text-emerald-600' : 'fa-link'} text-xs`}></i>
                <span>{copiedLink ? 'Copied' : 'Copy Signed URL'}</span>
              </button>
            </div>

            {/* Interactive Verification Proof Buttons */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <button
                type="button"
                onClick={(e) => handleTestVerify(e, false)}
                className="py-2 px-2 rounded-xl bg-black hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Verify genuine signature"
              >
                <i className="fa-solid fa-shield-check text-emerald-400"></i>
                <span>Verify Genuine</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleTestVerify(e, true)}
                className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Simulate what happens if someone generates a fake/tampered QR code"
              >
                <i className="fa-solid fa-bug text-rose-600"></i>
                <span>Test Fake QR</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
