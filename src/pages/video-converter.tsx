import React, { useRef, useState } from 'react';

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
  const [speed, setSpeed] = useState(1);
  const [bitrate, setBitrate] = useState(2000);
  const [resolution, setResolution] = useState('original');
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (fileList: FileList) => {
    const fileArr = Array.from(fileList);
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
        // Dynamic import for ffmpeg
        const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
        const ffmpeg = createFFmpeg({ log: false });
        if (!ffmpeg.isLoaded()) await ffmpeg.load();
        const inputName = 'input.' + files[i].name.split('.').pop();
        const outputName = 'output.' + selectedFormat;
        ffmpeg.FS('writeFile', inputName, await fetchFile(files[i]));
        let args = ['-i', inputName];
        if (typeof trim?.start === 'number' && trim.start > 0) args.push('-ss', String(trim.start));
        if (typeof trim?.end === 'number' && trim.end > 0) args.push('-to', String(trim.end));
        if (speed && speed !== 1) args.push('-filter:v', `setpts=${1/speed}*PTS`);
        if (bitrate) args.push('-b:v', `${bitrate}k`);
        if (resolution && resolution !== 'original') args.push('-s', resolution);
        args.push('-y', outputName);
        ffmpeg.setProgress(({ ratio }: { ratio: number }) => setProgress(prev => prev.map((p, idx2) => (idx2 === i ? Math.round(ratio * 100) : p))));
        await ffmpeg.run(...args);
        const data = ffmpeg.FS('readFile', outputName);
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);
        setProgress(prev => prev.map((p, idx2) => (idx2 === i ? 100 : p)));
        results.push(new Blob([data.buffer], { type: `video/${selectedFormat}` }));
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
      <div
        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        tabIndex={0}
        role="button"
        aria-label="Upload videos to convert or edit"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFilesSelected(e.target.files)}
          tabIndex={-1}
        />
        <span className="text-gray-600 text-center">
          Drag and drop videos here, or click to select
        </span>
      </div>
      {files.length > 0 && (
        <>
          <div className="p-4 bg-gray-50 rounded-lg shadow mb-4">
            <div className="mb-4">
              <label htmlFor="format-select" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                id="format-select"
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {SUPPORTED_FORMATS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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
          {error && <div className="text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2 mb-2 flex items-center gap-2" role="alert"><span aria-hidden="true">❗</span>{error}</div>}
          <div className="space-y-6">
            {files.map((file, idx) => (
              <div key={file.name} className="border rounded p-4 flex flex-col md:flex-row items-center gap-4">
                <video
                  src={previews[idx]}
                  controls
                  className="max-w-full max-h-64 rounded shadow mb-2"
                  aria-label="Video preview"
                />
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
                  <div className="w-full my-2">
                    <div className="mb-1 text-sm text-gray-700">Progress</div>
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
        </>
      )}
    </main>
  );
};

export default VideoConverterPage; 