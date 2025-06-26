"use client";

import React, { useRef, useState } from 'react';
import { convertImage } from '../../utils/imageUtils';

const SUPPORTED_FORMATS = [
  { label: 'JPG', value: 'jpg' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WEBP', value: 'webp' },
  { label: 'GIF', value: 'gif' },
  { label: 'BMP', value: 'bmp' },
  { label: 'TIFF', value: 'tiff' },
];

const ImageConverterPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('jpg');
  const [quality, setQuality] = useState(80);
  const [progress, setProgress] = useState<number[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (fileList: FileList) => {
    const fileArr = Array.from(fileList);
    for (const file of fileArr) {
      if (!file.type.startsWith('image/')) {
        setError('One or more files are not valid images.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('One or more files exceed the 20MB size limit.');
        return;
      }
    }
    setFiles(fileArr);
    setPreviews(fileArr.map(file => URL.createObjectURL(file)));
    setProgress(new Array(fileArr.length).fill(0));
    setConvertedFiles([]);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (idx: number) => {
    const newFiles = files.slice();
    const newPreviews = previews.slice();
    newFiles.splice(idx, 1);
    newPreviews.splice(idx, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setProgress(prev => prev.filter((_, i) => i !== idx));
    setConvertedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConvert = async () => {
    setProgress(files.map(() => 0));
    setError(null);
    setIsConverting(true);
    const results: Blob[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        setProgress(prev => prev.map((p, idx) => (idx === i ? 10 : p)));
        const converted = await convertImage(files[i], {
          format: selectedFormat,
          quality,
        });
        setProgress(prev => prev.map((p, idx) => (idx === i ? 100 : p)));
        results.push(converted);
      } catch {
        setError(`Conversion failed for file: ${files[i].name}`);
        setProgress(prev => prev.map((p, idx) => (idx === i ? 0 : p)));
        results.push(files[i]);
      }
    }
    setConvertedFiles(results);
    setIsConverting(false);
  };

  const handleDownload = (idx: number) => {
    const url = URL.createObjectURL(convertedFiles[idx]);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${files[idx].name.split('.')[0]}.${selectedFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    convertedFiles.forEach((blob, idx) => handleDownload(idx));
  };

  return (
    <main className="max-w-2xl mx-auto py-8 px-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <h1 className="text-2xl font-bold mb-4">Image Converter</h1>
      <div
        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        tabIndex={0}
        role="button"
        aria-label="Upload images to convert"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFilesSelected(e.target.files)}
          tabIndex={-1}
        />
        <span className="text-gray-600 text-center">
          Drag and drop images here, or click to select
        </span>
      </div>
      {/* Only show settings and convert button if files are selected */}
      {files.length > 0 && (
        <>
          <div className="p-4 rounded-lg shadow mb-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <div className="mb-4">
              <label htmlFor="format-select" className="block text-sm font-medium mb-1">Format</label>
              <select
                id="format-select"
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ background: 'var(--background)', color: 'var(--foreground)' }}
              >
                {SUPPORTED_FORMATS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="quality-slider" className="block text-sm font-medium mb-1">Quality (for lossy formats)</label>
              <input
                id="quality-slider"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs mt-1">{quality}</div>
            </div>
          </div>
          <button
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 flex items-center gap-2"
            onClick={handleConvert}
            disabled={files.length === 0 || isConverting}
            aria-busy={isConverting}
          >
            {isConverting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
            Convert
          </button>
          {convertedFiles.length > 0 && (
            <button
              className="mb-4 ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={handleDownloadAll}
            >
              Download All
            </button>
          )}
        </>
      )}
      {error && <div className="text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2 mb-2 flex items-center gap-2" role="alert"><span aria-hidden="true">❗</span>{error}</div>}
      {files.length === 0 && (
        <div className="flex flex-col items-center mt-8" style={{ color: 'var(--foreground)' }}>
          <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
            <rect x="10" y="20" width="60" height="40" rx="8" fill="#e5e7eb" />
            <circle cx="30" cy="40" r="8" fill="#cbd5e1" />
            <rect x="44" y="32" width="18" height="12" rx="3" fill="#cbd5e1" />
          </svg>
          <div className="mt-4 text-lg font-medium">No images selected</div>
          <div className="text-sm">Upload or drag images to get started!</div>
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-6">
          {files.map((file, idx) => (
            <div key={file.name} className="border rounded p-4 flex flex-col md:flex-row items-center gap-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
              <img
                src={previews[idx]}
                alt="Preview"
                className="max-w-full max-h-64 rounded shadow mb-2"
              />
              <div className="flex-1 w-full">
                <div className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>{file.name}</span>
                  <span className="text-xs ml-2">{(file.size/1024/1024).toFixed(2)} MB • {file.type}</span>
                  <button
                    className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label={`Remove ${file.name}`}
                  >
                    Remove
                  </button>
                </div>
                <div className="w-full my-2">
                  <div className="mb-1 text-sm">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-200"
                      style={{ width: `${progress[idx] || 0}%` }}
                      aria-valuenow={progress[idx] || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role="progressbar"
                    />
                  </div>
                  <span className="sr-only">{progress[idx] || 0}% complete</span>
                </div>
                {convertedFiles[idx] && (
                  <button
                    type="button"
                    onClick={() => handleDownload(idx)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default ImageConverterPage; 