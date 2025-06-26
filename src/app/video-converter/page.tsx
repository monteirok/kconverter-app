import React, { useState, useRef } from 'react';
import FileUploadArea from '../../components/FileUploadArea';
import SettingsPanel from '../../components/SettingsPanel';
import PreviewComponent from '../../components/PreviewComponent';
import ConversionProgress from '../../components/ConversionProgress';
import DownloadButton from '../../components/DownloadButton';
import { convertVideo } from '../../utils/videoUtils';

const SUPPORTED_FORMATS = [
  { label: 'MP4', value: 'mp4' },
  { label: 'AVI', value: 'avi' },
  { label: 'MOV', value: 'mov' },
  { label: 'WMV', value: 'wmv' },
  { label: 'MKV', value: 'mkv' },
  { label: 'WEBM', value: 'webm' },
];

const VideoConverterPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [progress, setProgress] = useState<number[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<Blob[]>([]);
  // Video settings
  const [speed, setSpeed] = useState(1);
  const [bitrate, setBitrate] = useState(2000); // kbps
  const [resolution, setResolution] = useState('original');
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (fileList: FileList) => {
    const fileArr = Array.from(fileList);
    // Validate file types and size (max 200MB)
    for (const file of fileArr) {
      if (!file.type.startsWith('video/')) {
        setError('One or more files are not valid videos.');
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setError('One or more files exceed the 200MB size limit.');
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
        const converted = await convertVideo(
          files[i],
          {
            format: selectedFormat,
            speed,
            bitrate,
            resolution,
            trim,
          },
          prog => setProgress(prev => prev.map((p, idx2) => (idx2 === i ? prog : p)))
        );
        setProgress(prev => prev.map((p, idx2) => (idx2 === i ? 100 : p)));
        results.push(converted);
      } catch (e) {
        setError(`Conversion failed for file: ${files[i].name}`);
        setProgress(prev => prev.map((p, idx2) => (idx2 === i ? 0 : p)));
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
      <h1 className="text-2xl font-bold mb-4">Video Converter & Editor</h1>
      <FileUploadArea
        accept="video/*"
        multiple
        onFilesSelected={handleFilesSelected}
        label="Upload videos to convert or edit"
      />
      {files.length > 0 && (
        <>
          <SettingsPanel
            formatOptions={SUPPORTED_FORMATS}
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
          >
            <div className="mb-4">
              <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
              <input
                id="speed"
                type="number"
                min={0.25}
                max={4}
                step={0.05}
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="bitrate" className="block text-sm font-medium text-gray-700 mb-1">Bitrate (kbps)</label>
              <input
                id="bitrate"
                type="number"
                min={500}
                max={10000}
                step={100}
                value={bitrate}
                onChange={e => setBitrate(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
              <select
                id="resolution"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="original">Original</option>
                <option value="1920x1080">1920x1080</option>
                <option value="1280x720">1280x720</option>
                <option value="854x480">854x480</option>
                <option value="640x360">640x360</option>
              </select>
            </div>
            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <label htmlFor="trim-start" className="block text-sm font-medium text-gray-700 mb-1">Trim Start (s)</label>
                <input
                  id="trim-start"
                  type="number"
                  min={0}
                  value={trim.start}
                  onChange={e => setTrim(t => ({ ...t, start: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="trim-end" className="block text-sm font-medium text-gray-700 mb-1">Trim End (s)</label>
                <input
                  id="trim-end"
                  type="number"
                  min={0}
                  value={trim.end}
                  onChange={e => setTrim(t => ({ ...t, end: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </SettingsPanel>
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
          {error && <div className="text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2 mb-2 flex items-center gap-2" role="alert"><span aria-hidden="true">❗</span>{error}</div>}
        </>
      )}
    </main>
  );
};

export default VideoConverterPage; 