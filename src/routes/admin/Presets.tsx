// routes/admin/Presets.tsx
import React, { useState, useMemo } from 'react';
import { useConfigStore } from '../../store/configStore';
import { BUILTIN_PRESETS, createCustomPreset } from '../../presets/builtin';
import { formatCurrency, formatPercent } from '../../calc/pricing';
import { calculateEquivalents } from '../../calc/sustainability';

// AI Cost Calculator Scenario Presets
const AI_COST_SCENARIOS = [
  {
    id: 'customer-support',
    name: 'Customer Support Chatbot',
    description: 'AI-powered customer service with escalation to premium models for complex queries',
    category: 'Business Operations',
    dailyRequests: 1000,
    peakConcurrency: 50,
    inputTokens: { mean: 150, variance: 50, min: 50, max: 500 },
    outputTokens: { mean: 100, variance: 30, min: 20, max: 300 },
    modelMix: [
      { model: 'GPT-4o Mini', weight: 0.7, cost: 0.00015 },
      { model: 'GPT-4o', weight: 0.3, cost: 0.0025 }
    ],
    estimatedMonthlyCost: 142.50
  },
  {
    id: 'content-generation',
    name: 'Content Generation Pipeline',
    description: 'High-quality content creation for marketing teams and creative workflows',
    category: 'Content Creation',
    dailyRequests: 200,
    peakConcurrency: 10,
    inputTokens: { mean: 300, variance: 100, min: 100, max: 1000 },
    outputTokens: { mean: 800, variance: 200, min: 200, max: 2000 },
    modelMix: [
      { model: 'Claude 3.5 Sonnet', weight: 0.6, cost: 0.003 },
      { model: 'GPT-4o', weight: 0.4, cost: 0.0025 }
    ],
    estimatedMonthlyCost: 890.40
  },
  {
    id: 'code-assistant',
    name: 'Developer Code Assistant',
    description: 'Code generation, debugging, and development productivity tool',
    category: 'Development',
    dailyRequests: 500,
    peakConcurrency: 25,
    inputTokens: { mean: 200, variance: 80, min: 50, max: 800 },
    outputTokens: { mean: 400, variance: 150, min: 50, max: 1500 },
    modelMix: [
      { model: 'GPT-4o', weight: 0.5, cost: 0.0025 },
      { model: 'Claude 3.5 Sonnet', weight: 0.3, cost: 0.003 },
      { model: 'GPT-4o Mini', weight: 0.2, cost: 0.00015 }
    ],
    estimatedMonthlyCost: 567.75
  },
  {
    id: 'document-analysis',
    name: 'Document Analysis & Summarization',
    description: 'Large document processing, analysis, and intelligent summarization',
    category: 'Document Processing',
    dailyRequests: 100,
    peakConcurrency: 8,
    inputTokens: { mean: 4000, variance: 1000, min: 1000, max: 10000 },
    outputTokens: { mean: 500, variance: 150, min: 100, max: 1000 },
    modelMix: [
      { model: 'Gemini 1.5 Pro', weight: 0.7, cost: 0.0035 },
      { model: 'Claude 3.5 Sonnet', weight: 0.3, cost: 0.003 }
    ],
    estimatedMonthlyCost: 1245.60
  },
  {
    id: 'research-assistant',
    name: 'Research & Analysis Assistant',
    description: 'Academic and business research support with comprehensive analysis',
    category: 'Research',
    dailyRequests: 150,
    peakConcurrency: 12,
    inputTokens: { mean: 600, variance: 200, min: 200, max: 2000 },
    outputTokens: { mean: 800, variance: 250, min: 300, max: 2500 },
    modelMix: [
      { model: 'Claude 3.5 Sonnet', weight: 0.8, cost: 0.003 },
      { model: 'GPT-4o', weight: 0.2, cost: 0.0025 }
    ],
    estimatedMonthlyCost: 456.90
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing Assistant',
    description: 'Creative content generation for stories, scripts, and artistic writing',
    category: 'Creative',
    dailyRequests: 80,
    peakConcurrency: 6,
    inputTokens: { mean: 250, variance: 100, min: 100, max: 800 },
    outputTokens: { mean: 1200, variance: 400, min: 300, max: 3000 },
    modelMix: [
      { model: 'Claude 3.5 Sonnet', weight: 0.7, cost: 0.003 },
      { model: 'GPT-4o', weight: 0.3, cost: 0.0025 }
    ],
    estimatedMonthlyCost: 623.52
  }
];

export const Presets: React.FC = () => {
  const { applyBuiltinPreset, config, getTotalCommissionRate } = useConfigStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'scenarios' | 'legacy'>('scenarios');

  const handleApplyPreset = (presetId: string) => {
    applyBuiltinPreset(presetId);
    setSelectedPreset(presetId);
    setTimeout(() => setSelectedPreset(null), 2000);
  };

  const handleApplyScenario = (scenarioId: string) => {
    const scenario = AI_COST_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedScenario(scenarioId);
      setTimeout(() => setSelectedScenario(null), 2000);
    }
  };

  const handleSaveCustomPreset = () => {
    if (!presetName.trim()) return;
    
    const customPreset = createCustomPreset(
      presetName.trim(),
      presetDescription.trim() || 'Custom configuration',
      config
    );
    
    setCustomPresets([...customPresets, customPreset]);
    setShowSaveDialog(false);
    setPresetName('');
    setPresetDescription('');
  };

  // Group scenarios by category
  const scenariosByCategory = useMemo(() => {
    const categories = new Map();
    AI_COST_SCENARIOS.forEach(scenario => {
      if (!categories.has(scenario.category)) {
        categories.set(scenario.category, []);
      }
      categories.get(scenario.category).push(scenario);
    });
    return Array.from(categories.entries());
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">AI Cost Scenarios</h2>
          <div className="flex rounded-lg bg-dark-surface border border-dark-border p-1">
            <button
              onClick={() => setViewMode('scenarios')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'scenarios'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              AI Scenarios
            </button>
            <button
              onClick={() => setViewMode('legacy')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'legacy'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Legacy Routing
            </button>
          </div>
        </div>
        <p className="text-gray-400 mb-6">
          {viewMode === 'scenarios' 
            ? 'Realistic AI cost scenarios for common use cases. Each scenario provides detailed cost modeling and analysis.'
            : 'Legacy routing configurations for the original routing visualization system.'
          }
        </p>
      </div>

      {viewMode === 'scenarios' ? (
        <div className="space-y-6">
          {/* AI Cost Scenarios */}
          {scenariosByCategory.map(([category, scenarios]) => (
            <div key={category} className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-lg">{category}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((scenario: any) => {
                  const totalTokens = scenario.inputTokens.mean + scenario.outputTokens.mean;
                  const avgCostPerRequest = scenario.modelMix.reduce((sum: number, mix: any) => 
                    sum + (mix.weight * mix.cost * totalTokens), 0);
                  const dailyCost = scenario.dailyRequests * avgCostPerRequest;
                  
                  return (
                    <div key={scenario.id} className={`bg-dark-bg border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedScenario === scenario.id 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-dark-border hover:border-primary-500'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{scenario.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
                        </div>
                        {selectedScenario === scenario.id && (
                          <div className="text-green-400">✓</div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-dark-surface rounded p-2">
                          <div className="text-xs text-gray-500">Daily Requests</div>
                          <div className="font-medium">{scenario.dailyRequests.toLocaleString()}</div>
                        </div>
                        <div className="bg-dark-surface rounded p-2">
                          <div className="text-xs text-gray-500">Peak Concurrency</div>
                          <div className="font-medium">{scenario.peakConcurrency}</div>
                        </div>
                        <div className="bg-dark-surface rounded p-2">
                          <div className="text-xs text-gray-500">Avg Input Tokens</div>
                          <div className="font-medium">{scenario.inputTokens.mean}</div>
                        </div>
                        <div className="bg-dark-surface rounded p-2">
                          <div className="text-xs text-gray-500">Avg Output Tokens</div>
                          <div className="font-medium">{scenario.outputTokens.mean}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Models in Mix:</span>
                          <span>{scenario.modelMix.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Daily Cost:</span>
                          <span className="text-green-400">${dailyCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Monthly Est.:</span>
                          <span className="text-yellow-400">${scenario.estimatedMonthlyCost.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Model Mix:</div>
                        <div className="space-y-1">
                          {scenario.modelMix.map((mix: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-400">{mix.model}</span>
                              <span>{(mix.weight * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleApplyScenario(scenario.id)}
                        className={`w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                          selectedScenario === scenario.id
                            ? 'bg-green-600 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {selectedScenario === scenario.id ? 'Applied ✓' : 'Load Scenario'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Scenarios */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Custom Cost Scenarios</h3>
              <button 
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Save Current as Scenario
              </button>
            </div>
            
            {customPresets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No custom scenarios saved yet</p>
                <p className="text-sm text-gray-600">
                  Save your current AI cost configuration as a custom scenario for easy reuse.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customPresets.map((preset, index) => (
                  <div key={preset.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{preset.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          const newPresets = customPresets.filter((_, i) => i !== index);
                          setCustomPresets(newPresets);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Delete scenario"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      Saved: {new Date(preset.config.createdAt).toLocaleDateString()}
                    </div>
                    
                    <button
                      onClick={() => {
                        console.log('Applying custom scenario:', preset);
                      }}
                      className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Load Scenario
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Legacy routing presets */
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Legacy Routing Presets</h3>
          <p className="text-gray-400 text-sm mb-6">
            These are the original routing visualization presets from the legacy system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUILTIN_PRESETS.map((preset) => {
              const presetConfig = preset.config();
              const totalCommissionRate = presetConfig.routers
                .filter(r => r.enabled)
                .reduce((sum, r) => sum + r.feePct, 0);
              
              return (
                <div key={preset.id} className={`bg-dark-bg border rounded-lg p-4 transition-all cursor-pointer ${
                  selectedPreset === preset.id 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-dark-border hover:border-primary-500'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{preset.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                    </div>
                    {selectedPreset === preset.id && (
                      <div className="text-green-400">✓</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-dark-surface rounded p-2">
                      <div className="text-xs text-gray-500">Users</div>
                      <div className="font-medium">{presetConfig.totalUsers}</div>
                    </div>
                    <div className="bg-dark-surface rounded p-2">
                      <div className="text-xs text-gray-500">Router Layers</div>
                      <div className="font-medium">{presetConfig.routerLayers}</div>
                    </div>
                    <div className="bg-dark-surface rounded p-2">
                      <div className="text-xs text-gray-500">Models</div>
                      <div className="font-medium">{presetConfig.models.length}</div>
                    </div>
                    <div className="bg-dark-surface rounded p-2">
                      <div className="text-xs text-gray-500">Profiles</div>
                      <div className="font-medium">{presetConfig.profiles.length}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission Rate:</span>
                      <span className="text-yellow-400">{formatPercent(totalCommissionRate)}</span>
                    </div>
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
              );
            })}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Save Current Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., My Custom AI Scenario"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Describe this scenario..."
                  rows={3}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomPreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};