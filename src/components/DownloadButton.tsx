import React from 'react';

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, label = 'Download', disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
    aria-disabled={disabled}
  >
    {label}
  </button>
);

export default DownloadButton; 