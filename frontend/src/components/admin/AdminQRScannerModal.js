'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant futuristic two-tone chime
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // AudioContext blocked or unsupported, safe ignore
  }
}

export default function AdminQRScannerModal({ isOpen, onClose, onScan }) {
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'permission' | 'in-use' | 'not-found' | 'insecure' | 'other'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [imageFileLoading, setImageFileLoading] = useState(false);

  const qrRegionId = 'admin-qr-reader-region';
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const startingRef = useRef(false);
  const fileInputRef = useRef(null);
  const isHandlingScanRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState?.();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        // Safe to ignore
      }
      isScanningRef.current = false;
      setIsScanningActive(false);
      setTorchOn(false);
      setHasTorch(false);
    }
  }, []);

  const handleDecoded = useCallback((decodedText) => {
    if (isHandlingScanRef.current || !decodedText) return;
    isHandlingScanRef.current = true;

    const cleaned = String(decodedText).replace(/^["']|["']$/g, '').trim();
    setDetectedBadge('QR Code Detected!');
    playSuccessBeep();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([50, 60, 50]);
      } catch {}
    }

    // Stop scanner camera then trigger verification callback
    stopScanner().finally(() => {
      onScan(cleaned);
    });
  }, [onScan, stopScanner]);

  // Robust Camera Starter with Adaptive Fallback & Full-Frame Scanning
  const startScanner = useCallback(async (cameraIdToUse) => {
    if (!isOpen || mode !== 'camera') return;
    if (startingRef.current) return;
    startingRef.current = true;

    setCameraError('');
    setErrorType('');
    setDetectedBadge('');
    setIsStarting(true);
    setIsScanningActive(false);

    // 1. Check Secure Context (HTTPS or Localhost)
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocal) {
        setIsStarting(false);
        startingRef.current = false;
        setErrorType('insecure');
        setCameraError(
          'Camera access requires a secure connection (HTTPS). Browsers block video capture over unencrypted HTTP. Please use the secure Cloudflare HTTPS URL.'
        );
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setIsStarting(false);
        startingRef.current = false;
        setErrorType('not-found');
        setCameraError('Camera API (getUserMedia) is not supported by your browser.');
        return;
      }
    }

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Stop any existing instance
      await stopScanner();

      const elem = document.getElementById(qrRegionId);
      if (!elem) {
        setIsStarting(false);
        startingRef.current = false;
        return;
      }

      // Initialize scanner with explicit QR_CODE format filter & native BarcodeDetector acceleration
      const scanner = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      html5QrCodeRef.current = scanner;

      // Query available video devices
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras yet:', camErr);
      }

      // Scan full camera frame at 20fps without restrictive qrbox crop
      // This ensures QR codes are detected anywhere in the camera feed regardless of distance or angle
      const config = {
        fps: 20,
        disableFlip: false
      };

      let started = false;

      // ATTEMPT 1: If specific camera selected/passed, use it directly
      const targetId = cameraIdToUse || selectedCameraId;
      if (targetId) {
        try {
          await scanner.start(targetId, config, handleDecoded, () => {});
          started = true;
        } catch (idErr) {
          console.warn(`Attempt with camera ID ${targetId} failed, trying facingMode...`, idErr);
        }
      }

      // ATTEMPT 2: Try environment (rear) camera - preferred on mobile phones
      if (!started) {
        try {
          await scanner.start({ facingMode: 'environment' }, config, handleDecoded, () => {});
          started = true;
        } catch (envErr) {
          console.warn('Environment facingMode failed (typical on laptops/desktops without rear lens), falling back to front camera...', envErr);
        }
      }

      // ATTEMPT 3: Try user (front) camera - standard on laptops & webcams
      if (!started) {
        try {
          await scanner.start({ facingMode: 'user' }, config, handleDecoded, () => {});
          started = true;
        } catch (userErr) {
          console.warn('User facingMode failed, trying device list fallback...', userErr);
        }
      }

      // ATTEMPT 4: Query cameras and try first available device ID
      if (!started) {
        try {
          const freshDevices = await Html5Qrcode.getCameras();
          if (freshDevices && freshDevices.length > 0) {
            setCameras(freshDevices);
            await scanner.start(freshDevices[0].id, config, handleDecoded, () => {});
            started = true;
          }
        } catch (enumErr) {
          console.warn('Direct device enumeration attempt failed:', enumErr);
        }
      }

      if (!started) {
        throw new Error('Could not initialize video feed on any available camera hardware.');
      }

      isScanningRef.current = true;
      setIsScanningActive(true);
      setIsStarting(false);
      startingRef.current = false;

      // Re-populate cameras list now that permission is active so labels are visible
      try {
        const activeDevices = await Html5Qrcode.getCameras();
        if (activeDevices && activeDevices.length > 0) {
          setCameras(activeDevices);
          if (!selectedCameraId) {
            setSelectedCameraId(activeDevices[0].id);
          }
        }
      } catch {}

      // Check if camera supports torch
      try {
        const track = scanner.getRunningTrack();
        const capabilities = track?.getCapabilities?.();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      setIsStarting(false);
      setIsScanningActive(false);
      startingRef.current = false;

      const msg = err?.message || String(err);
      if (/permission|notallowed|denied/i.test(msg)) {
        setErrorType('permission');
        setCameraError('Camera access was blocked by the browser. Please tap the camera/lock icon in your browser URL bar and allow Camera permission.');
      } else if (/notreadable|trackstart|in use/i.test(msg)) {
        setErrorType('in-use');
        setCameraError('Your camera is currently in use by another application (e.g., Zoom, Teams, or another browser tab). Please close it and retry.');
      } else if (/notfound|overconstrained|no camera/i.test(msg)) {
        setErrorType('not-found');
        setCameraError('No active camera hardware was found on this device. You can upload an image of the QR pass instead.');
      } else {
        setErrorType('other');
        setCameraError(msg || 'Unable to start camera. Please verify device camera permissions or upload an image.');
      }
    }
  }, [isOpen, mode, selectedCameraId, stopScanner, handleDecoded]);

  // Handle camera switch
  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    stopScanner().then(() => {
      startScanner(newId);
    });
  };

  // Toggle torch / flashlight
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanningRef.current) return;
    try {
      const track = html5QrCodeRef.current.getRunningTrack();
      if (track?.applyConstraints) {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      }
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Handle clipboard paste directly into scanner
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        handleDecoded(text.trim());
      } else {
        setMode('manual');
      }
    } catch {
      setMode('manual');
    }
  };

  // Handle static image upload for QR decode
  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileLoading(true);
    setCameraError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('admin-qr-file-dummy');
      const decodedText = await scanner.scanFile(file, true);
      await scanner.clear();
      setImageFileLoading(false);
      handleDecoded(decodedText);
    } catch {
      setImageFileLoading(false);
      setErrorType('other');
      setCameraError('No valid QR code could be found in the uploaded image. Please try another photo or enter the code manually.');
    }
  };

  // Effect to manage scanner lifecycle
  useEffect(() => {
    isHandlingScanRef.current = false;
    if (isOpen && mode === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, mode, startScanner, stopScanner]);

  // Clean up completely on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Dark frosted backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          stopScanner();
          onClose();
        }}
      />

      {/* Modal Shell */}
      <div className="relative w-full max-w-xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-200">
              <i className="fa-solid fa-camera text-sm" aria-hidden="true" />
            </span>
            <div>
              <h2 id="qr-scanner-title" className="font-heading text-sm font-bold text-slate-900 sm:text-base">
                Scan Guest QR Pass
              </h2>
              <p className="text-xs text-slate-500">
                Front desk express pass & cryptographic voucher verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close scanner"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setCameraError('');
              setMode('camera');
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'camera'
                ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-camera text-xs" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              setCameraError('');
              setMode('upload');
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'upload'
                ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-image text-xs" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              setCameraError('');
              setMode('manual');
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'manual'
                ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-keyboard text-xs" />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          {mode === 'camera' && (
            <div className="space-y-4">
              {/* Controls bar: Camera select, Torch, & Paste */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {cameras.length > 1 ? (
                  <div className="relative flex-1 min-w-[160px]">
                    <select
                      value={selectedCameraId}
                      onChange={handleCameraChange}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
                      aria-label="Select Camera Device"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Camera lens (${c.id.slice(0, 8)})`}
                        </option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    {isScanningActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                    <i className="fa-solid fa-video text-slate-400" />
                    Lens: {cameras[0]?.label || 'Active Camera (Full Frame)'}
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    title="Paste pass code or link from clipboard"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    <i className="fa-regular fa-paste text-xs text-slate-500" />
                    <span className="hidden xs:inline">Paste</span>
                  </button>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        torchOn
                          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <i className="fa-solid fa-lightbulb text-xs" />
                      <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Area — square on phones for maximum scan pixels,
                  4:3 on larger screens to match the browser camera feed. */}
              <div className="relative aspect-square sm:aspect-[4/3] w-full max-w-[480px] mx-auto overflow-hidden rounded-xl bg-slate-950 shadow-inner flex items-center justify-center">
                {/* HTML5 QR reader DOM container */}
                <div
                  id={qrRegionId}
                  className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                />

                {/* Laser scan animation & reticle overlay */}
                {!isStarting && !cameraError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {/* Visual Targeting Reticle */}
                    <div className="relative w-[72%] max-w-[320px] aspect-square rounded-lg">
                      {/* 4 Corner Markers */}
                      <span className="absolute -top-1 -left-1 h-6 w-6 border-t-3 border-l-3 border-sky-400 rounded-tl-md" />
                      <span className="absolute -top-1 -right-1 h-6 w-6 border-t-3 border-r-3 border-sky-400 rounded-tr-md" />
                      <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-3 border-l-3 border-sky-400 rounded-bl-md" />
                      <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-3 border-r-3 border-sky-400 rounded-br-md" />

                      {/* Animated Laser Sweep */}
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400/20 via-sky-300 to-sky-400/20 shadow-[0_0_12px_#38bdf8]"
                        style={{
                          animation: 'qrLaser 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Detected confirmation badge */}
                {detectedBadge && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 text-white z-20 animate-fade-in">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
                      <i className="fa-solid fa-check text-xl" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-emerald-200">{detectedBadge}</p>
                    <p className="mt-1 text-xs text-emerald-300/80">Decrypting & Verifying Folio…</p>
                  </div>
                )}

                {/* Loading state */}
                {isStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl text-sky-400" />
                    <p className="mt-2.5 text-xs font-medium text-slate-300">Connecting to camera…</p>
                  </div>
                )}

                {/* Error overlay */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
                      <i className={`fa-solid ${errorType === 'permission' ? 'fa-lock' : errorType === 'insecure' ? 'fa-shield-halved' : 'fa-video-slash'} text-lg`} />
                    </span>
                    <p className="mt-2.5 text-xs font-bold text-amber-300">
                      {errorType === 'permission'
                        ? 'Camera Permission Required'
                        : errorType === 'insecure'
                        ? 'HTTPS Required for Camera'
                        : errorType === 'in-use'
                        ? 'Camera In Use Elsewhere'
                        : 'Camera Feed Unavailable'}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300 max-w-xs">{cameraError}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startScanner()}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500 transition"
                      >
                        <i className="fa-solid fa-rotate-right mr-1.5" />
                        Retry Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <i className="fa-solid fa-image mr-1.5" />
                        Upload Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-qrcode text-slate-400" />
                  Fill the frame with the guest&apos;s QR pass
                </span>
                <span className="text-[11px] text-slate-400">
                  Full Frame Auto-Detect
                </span>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 group-hover:text-sky-600 group-hover:ring-sky-300 transition">
                  {imageFileLoading ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-base text-sky-600" />
                  ) : (
                    <i className="fa-solid fa-cloud-arrow-up text-base" />
                  )}
                </span>
                <p className="mt-3 text-xs font-bold text-slate-800">
                  {imageFileLoading ? 'Analyzing Pass Image…' : 'Click to select or drop QR code photo'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  PNG, JPG, WebP, or Screenshot from guest smartphone
                </p>
              </div>

              {cameraError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <i className="fa-solid fa-triangle-exclamation mr-1.5" />
                  {cameraError}
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
                <i className="fa-solid fa-shield-halved mr-1.5 text-sky-600" />
                Paste the encrypted vault pass token (<code className="font-mono font-bold">HF1.iv.cipher.authTag</code>), reservation code (<code className="font-mono font-bold">HF-2026-ABC123</code>), or scanned verification URL.
              </div>

              <div>
                <label htmlFor="manual-qr-text" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Code, Vault Token or Scanned URL
                </label>
                <textarea
                  id="manual-qr-text"
                  rows={3}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. HF1.ey... or HF-2026-ABC123 or https://hotelfactories.com/?vault=HF1..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setManualInput(text.trim());
                    } catch {}
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <i className="fa-regular fa-paste text-xs" />
                  <span>Paste Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!manualInput.trim()) return;
                    handleDecoded(manualInput.trim());
                  }}
                  disabled={!manualInput.trim()}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-50"
                >
                  <i className="fa-solid fa-key text-xs" />
                  <span>Verify Pass</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dummy hidden element for static file scanning */}
        <div id="admin-qr-file-dummy" className="hidden" />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-lock text-slate-400 text-[10px]" />
            AES-256-GCM Military Grade Verification
          </span>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes qrLaser {
          0% {
            top: 5%;
            opacity: 0.3;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
