'use client';

import React, { useState, useRef } from 'react';
import { uploadAPI } from '../../services/api';

export default function CloudinaryImageUpload({
  label = 'Image',
  value = '',
  onChange,
  folder = 'hotel_factories/hotels',
  presets = [],
  placeholder = 'Select image or paste URL…',
  hint = '',
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const isCloudinary = Boolean(value && (value.includes('cloudinary.com') || value.includes('res.cloudinary')));

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress('Uploading to Cloudinary…');

    try {
      const res = await uploadAPI.uploadImage(file, folder);
      const uploadedUrl = res.data?.secure_url || res.data?.url || res.url;
      if (uploadedUrl) {
        onChange?.(uploadedUrl);
        setUploadProgress('Uploaded successfully!');
        setTimeout(() => setUploadProgress(''), 2500);
      } else {
        throw new Error('No URL returned from upload server');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image to Cloudinary.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // Simulate synthetic event for handleFileChange
      handleFileChange({ target: { files: [file] } });
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`font-semibold px-2 py-0.5 rounded transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ☁️ Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`font-semibold px-2 py-0.5 rounded transition ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔗 URL / Presets
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {value ? (
            /* Uploaded Preview State */
            <div className="relative group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-36 h-28 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 shadow-sm">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {isCloudinary && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow">
                      ☁️ Cloudinary
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {value}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {isCloudinary ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Hosted on Cloudinary CDN with automatic responsive optimization.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      External image link configured.
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading…' : 'Replace Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange?.('')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
                isUploading
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-slate-800/40'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {uploadProgress || 'Uploading to Cloudinary…'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mb-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xl">
                    ☁️
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="text-blue-600 dark:text-blue-400 underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cloudinary CDN • PNG, JPG, WebP up to 15MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual URL / Presets Tab */
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          {presets && presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Presets:</span>
              {presets.slice(0, 8).map(([key, url]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange?.(url)}
                  className={`h-8 w-11 overflow-hidden rounded-md border-2 transition ${
                    value === url ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-slate-300'
                  }`}
                  title={`Use preset: ${key}`}
                >
                  <img src={url} alt={key} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
