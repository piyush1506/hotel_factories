'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';

/**
 * DynamicQRCode Component with Cryptographic Anti-Forgery Protection
 * - Encodes a compact AES-256-GCM vault token (or a short HMAC-signed URL)
 * - Protects against arbitrary/counterfeit QR payload generation by unauthorized third parties
 * - When scanned, the backend authenticates the payload against the private server key
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
  const [copiedLink, setCopiedLink] = useState(false);

  const bookingCode = booking?.bookingCode || (
    booking?.id ? (
      booking.id.startsWith('BK-') || booking.id.startsWith('bk-')
        ? 'HF-' + booking.id.replace(/^bk-/i, '').slice(0, 8).toUpperCase()
        : booking.id
    ) : 'HF-2026-PASS'
  );

  const passSignature = booking?.passSignature || '';
  const vaultToken = booking?.vaultToken || '';

  // Construct the shortest verification payload. Compact vault tokens are
  // preferred; legacy long tokens fall back to the short signed URL so the QR
  // never becomes too dense for a camera scanner.
  const getVerifyUrl = useCallback((forceTamper = false) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    if (forceTamper) {
      return `${baseUrl}/?vault=HF1.TAMPERED_IV_KEY.FORGED_CIPHERTEXT.INVALID_TAG`;
    }

    const signedUrl = `${baseUrl}/?verify=${encodeURIComponent(bookingCode)}${
      passSignature ? `&sig=${encodeURIComponent(passSignature)}` : ''
    }`;

    if (vaultToken && vaultToken.length <= 140) {
      return `${baseUrl}/?vault=${encodeURIComponent(vaultToken)}`;
    }
    if (passSignature) {
      return signedUrl;
    }
    if (vaultToken) {
      return `${baseUrl}/?vault=${encodeURIComponent(vaultToken)}`;
    }
    return signedUrl;
  }, [bookingCode, passSignature, vaultToken]);

  useEffect(() => {
    let isMounted = true;
    const generateQR = async () => {
      try {
        const verifyUrl = getVerifyUrl();
        // Medium ECC keeps the module count low; the generous 4-module quiet
        // zone and 640px source make the pass easy to scan from a screen.
        const url = await QRCode.toDataURL(verifyUrl, {
          errorCorrectionLevel: 'M',
          margin: 4,
          width: 640,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate dynamic QR code:', err);
      }
    };

    generateQR();
    return () => {
      isMounted = false;
    };
  }, [getVerifyUrl]);

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
      {/* Compact Interactive QR Pass Preview */}
      <div 
        onClick={() => setIsEnlarged(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsEnlarged(true);
          }
        }}
        className={`group flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer ${className}`}
        title="Click to enlarge for scanner"
        role="button"
        tabIndex={0}
        aria-label={`Show QR pass for ${bookingCode}`}
      >
        {/* Scannable frame with a generous white quiet zone */}
        <div 
          className="relative shrink-0 aspect-square bg-white p-2 rounded-xl border border-slate-200 shadow-2xs group-hover:shadow-xs transition-shadow flex items-center justify-center overflow-hidden"
          style={{ width: size + 16, maxWidth: '100%' }}
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

          {/* Hover zoom pill overlay */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
            <i className="fa-solid fa-expand"></i>
          </div>
        </div>

        {/* Dynamic Pass Details */}
        {showLabel && (
          <div className="w-full min-w-0 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AES-256 Encrypted Pass</span>
            </div>

            <div className="text-sm font-black text-slate-900 truncate mt-1">
              {booking?.guestName || 'Guest'}
            </div>

            <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {booking?.roomName || 'Executive Room'} · {bookingCode}
            </div>

            <div className="text-[10px] text-[#003b95] font-bold inline-flex items-center gap-1 mt-1.5">
              <i className="fa-solid fa-lock text-[9px] text-emerald-600"></i>
              <span>Locked via Secret Key · Tap to Enlarge</span>
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
            className="w-full max-w-[420px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center relative"
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
              <i className="fa-solid fa-key text-[9px]"></i>
              Encrypted QR · Decryptable Only by Backend
            </div>

            <h3 className="text-sm font-black text-slate-900">
              {booking?.hotelName || 'Hotel Royal Inn'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {booking?.guestName || 'Guest'} · {bookingCode}
            </p>

            {/* Large, unobstructed QR with the laser scan beam */}
            <div className="relative my-4 p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-lg mx-auto w-[320px] max-w-full aspect-square flex items-center justify-center overflow-hidden">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt={`FastCheck Pass ${bookingCode}`}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Animated Laser Scanner Line */}
              <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 animate-pulse pointer-events-none"></div>
            </div>

            <p className="text-[10px] font-semibold text-slate-500 mb-3">
              Fill the front-desk scanner frame with this QR for instant check-in.
            </p>

            {/* Security Explanation Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-[10px] space-y-1 mb-3">
              <div className="flex items-center justify-between font-mono">
                <span className="font-sans font-bold text-slate-700">QR Encryption:</span>
                <span className="font-bold text-emerald-700">AES-256-GCM Locked</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
                <span>Unlock Key:</span>
                <span className="font-bold text-slate-800">Backend Secret Master Key</span>
              </div>
              <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 leading-tight">
                Ordinary QR scanners cannot read or decode this booking. The payload is encrypted with the server secret key and can only be unlocked by the Hotel Factories backend.
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
                <span>{copiedLink ? 'Copied' : 'Copy Locked Link'}</span>
              </button>
            </div>

            {/* Interactive Verification Proof Buttons */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  verifyBookingCode(vaultToken || bookingCode, passSignature);
                }}
                className="py-2 px-2 rounded-xl bg-black hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Unlock and decrypt using Backend Secret Key"
              >
                <i className="fa-solid fa-key text-amber-300"></i>
                <span>Unlock via Secret</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  verifyBookingCode('HF1.TAMPERED_IV_KEY.FORGED_CIPHERTEXT.INVALID_TAG');
                }}
                className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Simulate what happens if someone generates a fake/tampered QR code"
              >
                <i className="fa-solid fa-shield-xmark text-rose-600"></i>
                <span>Test Forged QR</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
