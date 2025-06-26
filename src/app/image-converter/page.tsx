import React, { useState } from 'react';
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

  const handleFilesSelected = (fileList: FileList) => {
    const fileArr = Array.from(fileList);
    setFiles(fileArr);
    setPreviews(fileArr.map(file => URL.createObjectURL(file)));
    setProgress(new Array(fileArr.length).fill(0));
    setConvertedFiles([]);
  };

  const handleConvert = async () => {
    setProgress(files.map(() => 0));
    setError(null);
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
        setError('Conversion failed for one or more files.');
        setProgress(prev => prev.map((p, idx) => (idx === i ? 0 : p)));
        results.push(files[i]);
      }
    }
    setConvertedFiles(results);
  };

  const handleDownload = (idx: number) => {
    const url = URL.createObjectURL(convertedFiles[idx]);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${files[idx].name.split('.')[0]}.${selectedFormat}`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleConvert}
            disabled={files.length === 0}
          >
            Convert
          </button>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="space-y-6">
            {files.map((file, idx) => (
              <div key={file.name} className="border rounded p-4 flex flex-col md:flex-row items-center gap-4">
                <PreviewComponent fileUrl={previews[idx]} fileType={file.type} />
                <div className="flex-1 w-full">
                  <div className="text-sm font-medium mb-2">{file.name}</div>
                  <ConversionProgress progress={progress[idx] || 0} />
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