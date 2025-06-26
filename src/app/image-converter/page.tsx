import React, { useState, useRef } from 'react';
import FileUploadArea from '../../components/FileUploadArea';
import SettingsPanel from '../../components/SettingsPanel';
import PreviewComponent from '../../components/PreviewComponent';
import ConversionProgress from '../../components/ConversionProgress';
import DownloadButton from '../../components/DownloadButton';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (fileList: FileList) => {
    const fileArr = Array.from(fileList);
    // Validate file types and size (max 20MB)
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
      } catch (e) {
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
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Image Converter</h1>
      <FileUploadArea
        accept="image/*"
        multiple
        onFilesSelected={handleFilesSelected}
        label="Upload images to convert"
      />
      {files.length > 0 && (
        <>
          <SettingsPanel
            formatOptions={SUPPORTED_FORMATS}
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            quality={quality}
            onQualityChange={setQuality}
            qualityLabel="Quality (for lossy formats)"
            minQuality={1}
            maxQuality={100}
          />
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
          {error && <div className="text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2 mb-2 flex items-center gap-2" role="alert"><span aria-hidden="true">❗</span>{error}</div>}
          <div className="space-y-6">
            {files.map((file, idx) => (
              <div key={file.name} className="border rounded p-4 flex flex-col md:flex-row items-center gap-4">
                <PreviewComponent fileUrl={previews[idx]} fileType={file.type} />
                <div className="flex-1 w-full">
                  <div className="text-sm font-medium mb-2 flex items-center justify-between">
                    <span>{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{(file.size/1024/1024).toFixed(2)} MB • {file.type}</span>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                      onClick={() => handleRemoveFile(idx)}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </div>
                  <ConversionProgress progress={progress[idx] || 0} label="Progress" />
                  {convertedFiles[idx] && (
                    <DownloadButton onClick={() => handleDownload(idx)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default ImageConverterPage; 