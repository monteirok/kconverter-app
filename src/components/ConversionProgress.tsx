import React from 'react';

interface ConversionProgressProps {
  progress: number; // 0-100
  label?: string;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ progress, label }) => (
  <div className="w-full my-2">
    {label && <div className="mb-1 text-sm text-gray-700">{label}</div>}
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-blue-500 h-3 rounded-full transition-all duration-200"
        style={{ width: `${progress}%` }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
    </div>
    <span className="sr-only">{progress}% complete</span>
  </div>
);

export default ConversionProgress; 