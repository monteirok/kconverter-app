import React from 'react';

interface Option {
  label: string;
  value: string | number;
}

interface SettingsPanelProps {
  formatOptions: Option[];
  selectedFormat: string;
  onFormatChange: (value: string) => void;
  quality?: number;
  onQualityChange?: (value: number) => void;
  qualityLabel?: string;
  minQuality?: number;
  maxQuality?: number;
  children?: React.ReactNode;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  formatOptions,
  selectedFormat,
  onFormatChange,
  quality,
  onQualityChange,
  qualityLabel = 'Quality',
  minQuality = 1,
  maxQuality = 100,
  children,
}) => (
  <div className="p-4 bg-gray-50 rounded-lg shadow mb-4">
    <div className="mb-4">
      <label htmlFor="format-select" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
      <select
        id="format-select"
        value={selectedFormat}
        onChange={e => onFormatChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {formatOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
    {typeof quality === 'number' && onQualityChange && (
      <div className="mb-4">
        <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-700 mb-1">{qualityLabel}</label>
        <input
          id="quality-slider"
          type="range"
          min={minQuality}
          max={maxQuality}
          value={quality}
          onChange={e => onQualityChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500 mt-1">{quality}</div>
      </div>
    )}
    {children}
  </div>
);

export default SettingsPanel; 