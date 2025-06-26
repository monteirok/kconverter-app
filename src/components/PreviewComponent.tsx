import React from 'react';

interface PreviewComponentProps {
  fileUrl: string;
  fileType: string;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({ fileUrl, fileType }) => {
  if (fileType.startsWith('image/')) {
    return (
      <img
        src={fileUrl}
        alt="Preview"
        className="max-w-full max-h-64 rounded shadow mb-2"
      />
    );
  }
  if (fileType.startsWith('video/')) {
    return (
      <video
        src={fileUrl}
        controls
        className="max-w-full max-h-64 rounded shadow mb-2"
        aria-label="Video preview"
      />
    );
  }
  return <div className="text-gray-500">No preview available</div>;
};

export default PreviewComponent; 