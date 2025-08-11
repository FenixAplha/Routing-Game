// routes/admin/PricingTokens.tsx
import React, { useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency, formatPercent, calculateRequestCost } from '../../calc/pricing';

type PricingPreset = {
  name: string;
  description: string;
  models: Array<{
    name: string;
    pricePer1kTokensUSD: number;
    energyPerTokenWh: number;
    weight: number;
  }>;
};

const PRICING_PRESETS: PricingPreset[] = [
  {
    name: 'Free Tier',
    description: 'Community models with minimal costs',
    models: [
      { name: 'Local 7B', pricePer1kTokensUSD: 0.0, energyPerTokenWh: 0.01, weight: 5 },
      { name: 'Gemini 1.5 Flash', pricePer1kTokensUSD: 0.075, energyPerTokenWh: 0.03, weight: 3 },
      { name: 'GPT-4o Mini', pricePer1kTokensUSD: 0.15, energyPerTokenWh: 0.05, weight: 2 },
    ],
  },
  {
    name: 'Standard',
    description: 'Balanced performance and cost',
    models: [
      { name: 'GPT-4o Mini', pricePer1kTokensUSD: 0.15, energyPerTokenWh: 0.05, weight: 3 },
      { name: 'Claude 3 Haiku', pricePer1kTokensUSD: 0.25, energyPerTokenWh: 0.08, weight: 3 },
      { name: 'GPT-4o', pricePer1kTokensUSD: 2.5, energyPerTokenWh: 0.2, weight: 2 },
      { name: 'Claude 3.5 Sonnet', pricePer1kTokensUSD: 3.0, energyPerTokenWh: 0.25, weight: 1 },
    ],
  },
  {
    name: 'Premium',
    description: 'High-performance frontier models',
    models: [
      { name: 'GPT-4o', pricePer1kTokensUSD: 2.5, energyPerTokenWh: 0.2, weight: 3 },
      { name: 'Claude 3.5 Sonnet', pricePer1kTokensUSD: 3.0, energyPerTokenWh: 0.25, weight: 3 },
      { name: 'GPT-o1 Preview', pricePer1kTokensUSD: 15.0, energyPerTokenWh: 0.5, weight: 1 },
      { name: 'Claude 3 Opus', pricePer1kTokensUSD: 15.0, energyPerTokenWh: 0.4, weight: 1 },
    ],
  },
];

export const PricingTokens: React.FC = () => {
  const {
    config,
    addModel,
    updateModel,
    deleteModel,
    updateRouter,
    updateProfile,
    getTotalCommissionRate,
    validateCommissionCap,
  } = useConfigStore();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const totalCommissionRate = getTotalCommissionRate();
  const isCommissionValid = validateCommissionCap();

  // Quick preset application
  const applyPricingPreset = (preset: PricingPreset) => {
    // Clear existing models and add preset models
    config.models.forEach(model => deleteModel(model.id));
    
    preset.models.forEach((modelData, index) => {
      addModel();
      // Get the newly added model (it will be the last one)
      setTimeout(() => {
        const newModel = config.models[config.models.length - 1];
        if (newModel) {
          updateModel(newModel.id, modelData);
        }
      }, 10 * index); // Small delay to ensure models are added in sequence
    });
  };

  // Validate input
  const validateInput = (field: string, value: any, rules: any) => {
    const errors = { ...validationErrors };
    
    if (rules.required && (!value || value === '')) {
      errors[field] = `${field} is required`;
    } else if (rules.min !== undefined && value < rules.min) {
      errors[field] = `${field} must be at least ${rules.min}`;
    } else if (rules.max !== undefined && value > rules.max) {
      errors[field] = `${field} must be no more than ${rules.max}`;
    } else if (rules.positive && value <= 0) {
      errors[field] = `${field} must be positive`;
    } else {
      delete errors[field];
    }
    
    setValidationErrors(errors);
    return !errors[field];
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Pricing & Tokens</h2>
        <p className="text-gray-400 mb-6">
          Configure model pricing, tokenization rules, and router commission fees.
        </p>
      </div>

      {/* Quick Preset Buttons */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Quick Pricing Presets</h3>
        <p className="text-gray-400 text-sm mb-4">
          Apply pre-configured model sets with realistic pricing. This will replace your current models.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING_PRESETS.map((preset) => (
            <div 
              key={preset.name}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPreset === preset.name
                  ? 'border-primary-500 bg-primary-900/20'
                  : 'border-dark-border bg-dark-bg hover:border-gray-400'
              }`}
              onClick={() => setSelectedPreset(preset.name)}
            >
              <div className="font-medium mb-2">{preset.name}</div>
              <div className="text-sm text-gray-400 mb-3">{preset.description}</div>
              <div className="text-xs text-gray-500 mb-3">
                {preset.models.length} models: {preset.models.map(m => m.name).join(', ')}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  applyPricingPreset(preset);
                  setSelectedPreset(null);
                }}
                className="w-full px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
              >
                Apply Preset
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Models</h3>
          <button
            onClick={addModel}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Add Model
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Price per 1K Tokens (USD)</th>
                <th>Min Billable Tokens</th>
                <th>Energy per Token (Wh)</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {config.models.map((model) => (
                <tr key={model.id}>
                  <td>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => updateModel(model.id, { name: e.target.value })}
                      className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.pricePer1kTokensUSD}
                      onChange={(e) => updateModel(model.id, { pricePer1kTokensUSD: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.minBillableTokens || ''}
                      onChange={(e) => updateModel(model.id, { minBillableTokens: parseInt(e.target.value) || undefined })}
                      min="0"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                      placeholder="None"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.energyPerTokenWh || ''}
                      onChange={(e) => updateModel(model.id, { energyPerTokenWh: parseFloat(e.target.value) || undefined })}
                      min="0"
                      step="0.001"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                      placeholder="0.1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.weight || 1}
                      onChange={(e) => updateModel(model.id, { weight: parseFloat(e.target.value) || 1 })}
                      min="0"
                      step="0.1"
                      className="w-16 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => deleteModel(model.id)}
                      disabled={config.models.length <= 1}
                      className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Router Commission */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Router Commission Fees</h3>
          <div className={`text-sm px-3 py-1 rounded-lg ${
            isCommissionValid ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            Total: {formatPercent(totalCommissionRate)}
            {!isCommissionValid && ' (Exceeds 95% cap!)'}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Router fees are additive on top of model costs. Each router in the path adds its fee percentage.
        </p>

        {config.routers.length === 0 ? (
          <p className="text-gray-500 italic">No routers configured. Add router layers in Run Setup.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.routers.map((router) => (
              <div key={router.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{router.name}</span>
                  <span className="text-sm text-gray-400">Layer {router.layer + 1}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={(router.feePct * 100).toFixed(1)}
                    onChange={(e) => updateRouter(router.id, { feePct: parseFloat(e.target.value) / 100 || 0 })}
                    min="0"
                    max="50"
                    step="0.1"
                    className="flex-1 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {router.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isCommissionValid && (
          <div className="mt-4 bg-red-900 border border-red-600 rounded-lg p-4">
            <p className="text-red-200 text-sm">
              ⚠️ Total commission rate exceeds the 95% cap. Please reduce router fees.
            </p>
          </div>
        )}
      </div>

      {/* Token Distribution Settings */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Token Distribution per Profile</h3>
        <p className="text-gray-400 text-sm mb-4">
          Configure how tokens are distributed for each user profile.
        </p>
        
        <div className="space-y-4">
          {config.profiles.map((profile) => (
            <div key={profile.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{profile.name}</h4>
                <span className="text-sm text-gray-400">{profile.distribution}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Prompt Tokens (mean)
                  </label>
                  <input
                    type="number"
                    value={profile.promptTokenMean}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateProfile(profile.id, { promptTokenMean: value });
                      validateInput(`${profile.id}-prompt`, value, { positive: true });
                    }}
                    min="1"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      validationErrors[`${profile.id}-prompt`] ? 'border-red-500' : 'border-dark-border'
                    }`}
                  />
                  {validationErrors[`${profile.id}-prompt`] && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors[`${profile.id}-prompt`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Completion Tokens (mean)
                  </label>
                  <input
                    type="number"
                    value={profile.completionTokenMean}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateProfile(profile.id, { completionTokenMean: value });
                      validateInput(`${profile.id}-completion`, value, { positive: true });
                    }}
                    min="1"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      validationErrors[`${profile.id}-completion`] ? 'border-red-500' : 'border-dark-border'
                    }`}
                  />
                  {validationErrors[`${profile.id}-completion`] && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors[`${profile.id}-completion`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Total Tokens (avg)
                  </label>
                  <div className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-400">
                    {(profile.promptTokenMean + profile.completionTokenMean).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {profile.distribution === 'bounded-normal' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Prompt Std Dev
                    </label>
                    <input
                      type="number"
                      value={profile.distributionParams?.promptStd || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateProfile(profile.id, { 
                          distributionParams: { 
                            ...profile.distributionParams, 
                            promptStd: value 
                          }
                        });
                      }}
                      min="0"
                      step="1"
                      className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Completion Std Dev
                    </label>
                    <input
                      type="number"
                      value={profile.distributionParams?.completionStd || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateProfile(profile.id, { 
                          distributionParams: { 
                            ...profile.distributionParams, 
                            completionStd: value 
                          }
                        });
                      }}
                      min="0"
                      step="1"
                      className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Commission Calculator */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Commission Calculator</h3>
        <p className="text-gray-400 text-sm mb-4">
          Real-time calculation showing how router fees affect total costs.
        </p>
        
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-400">
                {formatPercent(totalCommissionRate)}
              </div>
              <div className="text-sm text-gray-400">Total Commission Rate</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-400">
                {config.routers.filter(r => r.enabled).length}
              </div>
              <div className="text-sm text-gray-400">Active Routers</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(config.models.reduce((sum, m) => sum + (m.weight || 1), 0))}
              </div>
              <div className="text-sm text-gray-400">Total Model Weight</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round((100 - totalCommissionRate * 100) * 10) / 10}%
              </div>
              <div className="text-sm text-gray-400">Remaining Capacity</div>
            </div>
          </div>
        </div>
        
        {totalCommissionRate > 0.9 && (
          <div className="mt-4 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              ⚠️ Commission rate is very high ({formatPercent(totalCommissionRate)}). Consider reducing router fees for better economics.
            </p>
          </div>
        )}
      </div>

      {/* Energy Cost Estimation */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Energy Cost Estimation</h3>
        <p className="text-gray-400 text-sm mb-4">
          Environmental impact preview based on current model configuration.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1000, 10000, 100000].map((requestCount) => {
            const avgTokens = config.profiles.reduce((sum, p) => 
              sum + p.promptTokenMean + p.completionTokenMean, 0) / config.profiles.length;
            const avgEnergyPerToken = config.models.reduce((sum, m) => 
              sum + (m.energyPerTokenWh || 0.1) * (m.weight || 1), 0) / 
              config.models.reduce((sum, m) => sum + (m.weight || 1), 0);
            
            const totalTokens = requestCount * avgTokens;
            const totalEnergyWh = totalTokens * avgEnergyPerToken;
            const phoneCharges = totalEnergyWh / 12; // 12Wh per phone charge
            
            return (
              <div key={requestCount} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="font-medium mb-2">{requestCount.toLocaleString()} requests</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total tokens:</span>
                    <span>{Math.round(totalTokens).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Energy:</span>
                    <span>{totalEnergyWh.toFixed(1)} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone charges:</span>
                    <span>{phoneCharges.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Pricing Examples */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Pricing Examples</h3>
        <p className="text-gray-400 text-sm mb-4">
          Sample costs for different token amounts with current configuration.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border border-dark-border rounded-lg">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-center">100 tokens</th>
                <th className="px-4 py-2 text-center">1,000 tokens</th>
                <th className="px-4 py-2 text-center">5,000 tokens</th>
                <th className="px-4 py-2 text-center">Weight</th>
                <th className="px-4 py-2 text-center">Energy/1k</th>
              </tr>
            </thead>
            <tbody>
              {config.models.map((model, index) => (
                <tr key={model.id} className={index % 2 === 0 ? 'bg-dark-surface' : ''}>
                  <td className="px-4 py-2 font-medium">{model.name}</td>
                  {[100, 1000, 5000].map((tokens) => {
                    const result = calculateRequestCost(tokens, model, config.routers);
                    return (
                      <td key={tokens} className="px-4 py-2 text-center text-sm">
                        <div className="text-gray-300">${formatCurrency(result.baseCost)}</div>
                        {result.commission > 0 && (
                          <div className="text-orange-400">+${formatCurrency(result.commission)}</div>
                        )}
                        <div className="font-medium text-primary-400">
                          ${formatCurrency(result.totalCost)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center text-sm text-gray-400">
                    {model.weight || 1}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-400">
                    {((model.energyPerTokenWh || 0.1) * 1000).toFixed(1)}Wh
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick cost comparison */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium mb-2">Cheapest Option (1k tokens)</h4>
            {(() => {
              const cheapest = config.models.reduce((min, model) => {
                const result = calculateRequestCost(1000, model, config.routers);
                const minResult = calculateRequestCost(1000, min, config.routers);
                return result.totalCost < minResult.totalCost ? model : min;
              });
              const result = calculateRequestCost(1000, cheapest, config.routers);
              
              return (
                <div className="text-sm">
                  <div className="text-green-400 font-medium">{cheapest.name}</div>
                  <div className="text-gray-400">Total: ${formatCurrency(result.totalCost)}</div>
                  <div className="text-xs text-gray-500">
                    Base: ${formatCurrency(result.baseCost)} 
                    {result.commission > 0 && ` + Commission: ${formatPercent(result.commissionRate)}`}
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium mb-2">Most Expensive (1k tokens)</h4>
            {(() => {
              const expensive = config.models.reduce((max, model) => {
                const result = calculateRequestCost(1000, model, config.routers);
                const maxResult = calculateRequestCost(1000, max, config.routers);
                return result.totalCost > maxResult.totalCost ? model : max;
              });
              const result = calculateRequestCost(1000, expensive, config.routers);
              
              return (
                <div className="text-sm">
                  <div className="text-red-400 font-medium">{expensive.name}</div>
                  <div className="text-gray-400">Total: ${formatCurrency(result.totalCost)}</div>
                  <div className="text-xs text-gray-500">
                    Base: ${formatCurrency(result.baseCost)} 
                    {result.commission > 0 && ` + Commission: ${formatPercent(result.commissionRate)}`}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
