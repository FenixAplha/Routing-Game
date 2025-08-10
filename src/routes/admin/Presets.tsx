// routes/admin/Presets.tsx
import React, { useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { BUILTIN_PRESETS, getPresetSummaries } from '../../presets/builtin';

export const Presets: React.FC = () => {
  const { applyBuiltinPreset, config } = useConfigStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleApplyPreset = (presetId: string) => {
    applyBuiltinPreset(presetId);
    setSelectedPreset(presetId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Presets</h2>
        <p className="text-gray-400 mb-6">
          Quick-start configurations for different use cases. Apply a preset to instantly configure users, profiles, routers, and models.
        </p>
      </div>

      {/* Built-in Presets */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Built-in Presets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILTIN_PRESETS.map((preset) => (
            <div key={preset.id} className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-primary-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{preset.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-gray-500 mb-4">
                {(() => {
                  const presetConfig = preset.config();
                  return (
                    <>
                      <div>👥 {presetConfig.totalUsers} users • {presetConfig.routerLayers} router layers</div>
                      <div>🚀 {presetConfig.models.length} models • {presetConfig.profiles.length} profiles</div>
                    </>
                  );
                })()}
              </div>
              
              <button
                onClick={() => handleApplyPreset(preset.id)}
                className={`w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedPreset === preset.id
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {selectedPreset === preset.id ? 'Applied ✓' : 'Apply Preset'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Presets */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Custom Presets</h3>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            Save Current Config
          </button>
        </div>
        
        <p className="text-gray-500 italic text-center py-8">
          Custom preset functionality coming soon. You'll be able to save and share your configurations.
        </p>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Current Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-blue-400">{config.totalUsers}</div>
            <div className="text-sm text-gray-300">Total Users</div>
            <div className="text-xs text-gray-500">{config.groups.length} groups</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-purple-400">{config.routerLayers}</div>
            <div className="text-sm text-gray-300">Router Layers</div>
            <div className="text-xs text-gray-500">{config.routers.length} routers total</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-green-400">{config.models.length}</div>
            <div className="text-sm text-gray-300">Models</div>
            <div className="text-xs text-gray-500">Available for routing</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-yellow-400">{config.profiles.length}</div>
            <div className="text-sm text-gray-300">Profiles</div>
            <div className="text-xs text-gray-500">Behavior patterns</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
          <div className="text-sm text-gray-300 mb-2">Configuration Details:</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Universal User Name: {config.universalUserName}</div>
            <div>Capture Duration: {config.captureSeconds} seconds</div>
            <div>Seed: {config.seed}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
