// components/visualizations/TrafficSimulationControls.tsx
import React, { useState, useCallback } from 'react';

export interface TimeSimulationSettings {
  simSpeedMultiplier: number;
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  realTimeDuration: number; // in seconds
  paused: boolean;
  looping: boolean;
  currentProgress: number; // 0-100%
}

interface TrafficSimulationControlsProps {
  settings: TimeSimulationSettings;
  onSettingsChange: (settings: TimeSimulationSettings) => void;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const TrafficSimulationControls: React.FC<TrafficSimulationControlsProps> = ({
  settings,
  onSettingsChange,
  isRunning,
  onStart,
  onPause,
  onStop,
  onReset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const timeRangeOptions = [
    { value: 'hour', label: '1 Hour', duration: 1 },
    { value: 'day', label: '24 Hours', duration: 24 },
    { value: 'week', label: '1 Week', duration: 168 },
    { value: 'month', label: '1 Month', duration: 720 },
    { value: 'quarter', label: '3 Months', duration: 2160 },
    { value: 'year', label: '1 Year', duration: 8760 }
  ];

  const speedPresets = [
    { multiplier: 0.5, label: '0.5x', description: 'Slow Motion' },
    { multiplier: 1, label: '1x', description: 'Real Time' },
    { multiplier: 2, label: '2x', description: 'Double Speed' },
    { multiplier: 5, label: '5x', description: 'Fast Forward' },
    { multiplier: 10, label: '10x', description: 'Very Fast' },
    { multiplier: 60, label: '60x', description: '1 Min = 1 Hour' },
    { multiplier: 1440, label: '1440x', description: '1 Min = 1 Day' },
    { multiplier: 10080, label: '10080x', description: '1 Min = 1 Week' },
    { multiplier: 525600, label: '525600x', description: '1 Min = 1 Year' }
  ];

  const handleTimeRangeChange = useCallback((timeRange: TimeSimulationSettings['timeRange']) => {
    const selectedOption = timeRangeOptions.find(option => option.value === timeRange);
    if (selectedOption) {
      // Auto-adjust speed for year simulation to fit in 1 minute
      let newSpeed = settings.simSpeedMultiplier;
      if (timeRange === 'year' && settings.realTimeDuration === 60) {
        newSpeed = 525600; // 1 minute = 1 year
      }
      
      onSettingsChange({
        ...settings,
        timeRange,
        simSpeedMultiplier: newSpeed
      });
    }
  }, [settings, onSettingsChange]);

  const handleSpeedChange = useCallback((multiplier: number) => {
    onSettingsChange({
      ...settings,
      simSpeedMultiplier: multiplier
    });
  }, [settings, onSettingsChange]);

  const formatTime = (hours: number): string => {
    if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 168) {
      return `${Math.round(hours / 24)}d`;
    } else if (hours < 720) {
      return `${Math.round(hours / 168)}w`;
    } else if (hours < 8760) {
      return `${Math.round(hours / 720)}m`;
    } else {
      return `${Math.round(hours / 8760)}y`;
    }
  };

  const getCurrentTimeRange = () => {
    return timeRangeOptions.find(option => option.value === settings.timeRange)?.duration || 24;
  };

  const getSimulationDuration = () => {
    const hours = getCurrentTimeRange();
    const durationSeconds = (hours * 3600) / settings.simSpeedMultiplier;
    
    if (durationSeconds < 60) {
      return `${Math.round(durationSeconds)}s`;
    } else if (durationSeconds < 3600) {
      return `${Math.round(durationSeconds / 60)}m ${Math.round(durationSeconds % 60)}s`;
    } else {
      return `${Math.round(durationSeconds / 3600)}h ${Math.round((durationSeconds % 3600) / 60)}m`;
    }
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-bold">Unified Simulation Controls</span>
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Time Range Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Simulation Time Range
        </label>
        <div className="grid grid-cols-3 gap-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value as TimeSimulationSettings['timeRange'])}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                settings.timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Control */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Simulation Speed
        </label>
        
        {!showAdvanced ? (
          /* Simple Speed Slider */
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 w-12">Slow</span>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={speedPresets.findIndex(p => p.multiplier === settings.simSpeedMultiplier)}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  handleSpeedChange(speedPresets[index].multiplier);
                }}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-400 w-12">Fast</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {speedPresets.find(p => p.multiplier === settings.simSpeedMultiplier)?.label}
              </div>
              <div className="text-xs text-gray-400">
                {speedPresets.find(p => p.multiplier === settings.simSpeedMultiplier)?.description}
              </div>
            </div>
          </div>
        ) : (
          /* Advanced Speed Grid */
          <div className="grid grid-cols-3 gap-2">
            {speedPresets.map(preset => (
              <button
                key={preset.multiplier}
                onClick={() => handleSpeedChange(preset.multiplier)}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  settings.simSpeedMultiplier === preset.multiplier
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Simulation Info */}
      <div className="bg-gray-800 rounded-md p-3 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Time Range:</span>
            <div className="font-medium text-white">
              {formatTime(getCurrentTimeRange())} of traffic
            </div>
          </div>
          <div>
            <span className="text-gray-400">Real Duration:</span>
            <div className="font-medium text-white">
              {getSimulationDuration()}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{Math.round(settings.currentProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${settings.currentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>▶️</span>
            Start Simulation
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>⏸️</span>
            Pause
          </button>
        )}
        
        <button
          onClick={onStop}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          title="Stop"
        >
          ⏹️
        </button>
        
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          title="Reset"
        >
          🔄
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.looping}
                onChange={(e) => onSettingsChange({ ...settings, looping: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-300">Loop simulation</span>
            </label>
            
            <div className="space-y-1">
              <label className="block text-xs text-gray-400">Real-time Duration (sec)</label>
              <input
                type="number"
                value={settings.realTimeDuration}
                onChange={(e) => onSettingsChange({ ...settings, realTimeDuration: parseInt(e.target.value) || 60 })}
                min="10"
                max="3600"
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #1e40af;
          }
          
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #1e40af;
            box-sizing: border-box;
          }
        `
      }} />
    </div>
  );
};