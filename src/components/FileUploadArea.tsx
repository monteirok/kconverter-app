import React, { useRef } from 'react';

interface FileUploadAreaProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: FileList) => void;
  label?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ accept, multiple = false, onFilesSelected, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
      tabIndex={0}
      role="button"
      aria-label={label || 'Upload files'}
      onClick={handleClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
        tabIndex={-1}
      />
      <span className="text-gray-600 text-center">
        {label || 'Drag and drop files here, or click to select'}
      </span>
    </div>
  );
};

export default FileUploadArea; 