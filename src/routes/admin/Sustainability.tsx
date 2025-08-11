// routes/admin/Sustainability.tsx
import React, { useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useRuntimeStore } from '../../store/runtimeStore';
import { calculateEquivalents, formatSustainability, getDisplayUnit } from '../../calc/sustainability';
import { calculateCumulativeMetrics } from '../../calc/aggregator';

export const Sustainability: React.FC = () => {
  const { config, updateSustainAssumptions } = useConfigStore();
  const { recentRecords } = useRuntimeStore();
  const [editingAssumptions, setEditingAssumptions] = useState(false);
  const [tempAssumptions, setTempAssumptions] = useState(config.sustain);

  // Update temp assumptions when config changes
  React.useEffect(() => {
    setTempAssumptions(config.sustain);
  }, [config.sustain]);

  const handleSaveAssumptions = () => {
    updateSustainAssumptions(tempAssumptions);
    setEditingAssumptions(false);
  };

  const handleCancelEdit = () => {
    setTempAssumptions(config.sustain);
    setEditingAssumptions(false);
  };
  
  // Calculate cumulative metrics
  const cumulative = calculateCumulativeMetrics(recentRecords);
  const equivalents = calculateEquivalents(cumulative.energyWh, config.sustain);
  const formatted = formatSustainability(equivalents);
  
  // Latest run metrics
  const latestRun = recentRecords[0];
  const latestEquivalents = latestRun ? calculateEquivalents(latestRun.energyWh, config.sustain) : null;
  const latestFormatted = latestEquivalents ? formatSustainability(latestEquivalents) : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Sustainability</h2>
        <p className="text-gray-400 mb-6">
          Track energy consumption and environmental impact of your routing operations.
        </p>
      </div>

      {/* Editable Assumptions */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Conversion Assumptions</h3>
          {!editingAssumptions ? (
            <button
              onClick={() => setEditingAssumptions(true)}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
            >
              Edit Assumptions
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveAssumptions}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          These baseline values are used to convert energy consumption into relatable equivalents.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            {editingAssumptions ? (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Phone Charge (Wh)
                </label>
                <input
                  type="number"
                  value={tempAssumptions.phoneChargeWh}
                  onChange={(e) => setTempAssumptions({
                    ...tempAssumptions,
                    phoneChargeWh: parseFloat(e.target.value) || 0
                  })}
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                />
              </div>
            ) : (
              <div className="text-lg font-bold text-green-400">{config.sustain.phoneChargeWh} Wh</div>
            )}
            <div className="text-sm text-gray-300">Phone Charge</div>
            <div className="text-xs text-gray-500 mt-1">
              Energy needed to fully charge a smartphone
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            {editingAssumptions ? (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Household Consumption (kWh/day)
                </label>
                <input
                  type="number"
                  value={tempAssumptions.householdKWhPerDay}
                  onChange={(e) => setTempAssumptions({
                    ...tempAssumptions,
                    householdKWhPerDay: parseFloat(e.target.value) || 0
                  })}
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                />
              </div>
            ) : (
              <div className="text-lg font-bold text-blue-400">{config.sustain.householdKWhPerDay} kWh/day</div>
            )}
            <div className="text-sm text-gray-300">Household Consumption</div>
            <div className="text-xs text-gray-500 mt-1">
              Average daily energy consumption per household
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            {editingAssumptions ? (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Grid Carbon Intensity (kg CO₂e/kWh)
                </label>
                <input
                  type="number"
                  value={tempAssumptions.gridKgCO2ePerKWh}
                  onChange={(e) => setTempAssumptions({
                    ...tempAssumptions,
                    gridKgCO2ePerKWh: parseFloat(e.target.value) || 0
                  })}
                  step="0.01"
                  min="0"
                  className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                />
              </div>
            ) : (
              <div className="text-lg font-bold text-orange-400">{config.sustain.gridKgCO2ePerKWh} kg CO₂e/kWh</div>
            )}
            <div className="text-sm text-gray-300">Grid Carbon Intensity</div>
            <div className="text-xs text-gray-500 mt-1">
              Carbon emissions per kWh of electricity
            </div>
          </div>
        </div>
        
        {editingAssumptions && (
          <div className="mt-4 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              💡 Common values: Phone charge 10-15 Wh, Household 8-12 kWh/day, Grid CO₂ 0.2-0.6 kg/kWh depending on region.
            </p>
          </div>
        )}
      </div>

      {/* Latest Run Results */}
      {latestRun && latestFormatted && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Latest Run Impact</h3>
          <p className="text-gray-400 text-sm mb-4">
            Environmental impact from your most recent {latestRun.durationSeconds}s simulation.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {getDisplayUnit(latestRun.energyWh, 'Wh').value.toFixed(1)}
              </div>
              <div className="text-sm text-gray-300">{getDisplayUnit(latestRun.energyWh, 'Wh').unit}</div>
              <div className="text-xs text-gray-500 mt-1">Total Energy</div>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{latestFormatted.phoneCharges}</div>
              <div className="text-sm text-gray-300">phone charges</div>
              <div className="text-xs text-gray-500 mt-1">Equivalent</div>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{latestFormatted.householdHours}</div>
              <div className="text-sm text-gray-300">household hours</div>
              <div className="text-xs text-gray-500 mt-1">Equivalent</div>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{latestFormatted.co2eKg}</div>
              <div className="text-sm text-gray-300">kg CO₂e</div>
              <div className="text-xs text-gray-500 mt-1">Emissions</div>
            </div>
          </div>
        </div>
      )}

      {/* Cumulative Results */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Cumulative Impact</h3>
        <p className="text-gray-400 text-sm mb-4">
          Total environmental impact across {cumulative.runs} recorded runs.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {getDisplayUnit(cumulative.energyWh, 'Wh').value.toFixed(1)}
            </div>
            <div className="text-sm text-gray-300">{getDisplayUnit(cumulative.energyWh, 'Wh').unit}</div>
            <div className="text-xs text-gray-500 mt-1">Total Energy</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatted.phoneCharges}</div>
            <div className="text-sm text-gray-300">phone charges</div>
            <div className="text-xs text-gray-500 mt-1">Equivalent</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{formatted.householdHours}</div>
            <div className="text-sm text-gray-300">household hours</div>
            <div className="text-xs text-gray-500 mt-1">Equivalent</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{formatted.co2eKg}</div>
            <div className="text-sm text-gray-300">kg CO₂e</div>
            <div className="text-xs text-gray-500 mt-1">Emissions</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <div className="font-medium text-gray-300">Total Runs</div>
            <div className="text-2xl font-bold">{cumulative.runs.toLocaleString()}</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <div className="font-medium text-gray-300">Total Requests</div>
            <div className="text-2xl font-bold">{cumulative.forwards.toLocaleString()}</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <div className="font-medium text-gray-300">Total Tokens</div>
            <div className="text-2xl font-bold">{cumulative.tokensTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Energy Efficiency */}
      {cumulative.tokensTotal > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Energy Efficiency</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                {(cumulative.energyWh / cumulative.tokensTotal * 1000).toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">mWh per token</div>
              <div className="text-xs text-gray-500 mt-1">Average efficiency</div>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                {(cumulative.energyWh / cumulative.forwards).toFixed(1)}
              </div>
              <div className="text-sm text-gray-300">Wh per request</div>
              <div className="text-xs text-gray-500 mt-1">Average per request</div>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                {(cumulative.co2eKg / cumulative.forwards * 1000000).toFixed(0)}
              </div>
              <div className="text-sm text-gray-300">mg CO₂e per request</div>
              <div className="text-xs text-gray-500 mt-1">Carbon footprint</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Energy Breakdown Charts */}
      {recentRecords.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Energy Breakdown</h3>
          <p className="text-gray-400 text-sm mb-4">
            Visualize energy consumption by model and router across recent runs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Energy by Model */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Energy by Model</h4>
              <div className="space-y-2">
                {config.models.map((model) => {
                  const modelEnergy = recentRecords.reduce((sum, record) => {
                    const modelStats = record.byModel?.[model.id];
                    if (modelStats) {
                      const avgEnergyPerToken = model.energyPerTokenWh || 0.1;
                      return sum + (modelStats.tokensTotal * avgEnergyPerToken);
                    }
                    return sum;
                  }, 0);
                  
                  const percentage = cumulative.energyWh > 0 ? (modelEnergy / cumulative.energyWh) * 100 : 0;
                  
                  return (
                    <div key={model.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300">{model.name}</span>
                          <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {modelEnergy.toFixed(1)} Wh total
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Energy by Router Layer */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Router Overhead Impact</h4>
              <div className="space-y-2">
                {Array.from({ length: Math.max(1, config.routerLayers) }, (_, layer) => {
                  const layerRouters = config.routers.filter(r => r.layer === layer);
                  const layerTraffic = recentRecords.reduce((sum, record) => {
                    return sum + layerRouters.reduce((layerSum, router) => {
                      const routerStats = record.byRouter?.[router.id];
                      return layerSum + (routerStats?.traversals || 0);
                    }, 0);
                  }, 0);
                  
                  const totalTraffic = cumulative.forwards || 1;
                  const percentage = (layerTraffic / totalTraffic) * 100;
                  
                  return (
                    <div key={layer} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300">
                            {config.routerLayers > 0 ? `Layer ${layer + 1}` : 'Direct'}
                          </span>
                          <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {layerTraffic.toLocaleString()} traversals
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Configuration Analysis */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Configuration Impact Analysis</h3>
        <p className="text-gray-400 text-sm mb-4">
          Projected environmental impact based on your current configuration.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium mb-3">Model Efficiency Ranking</h4>
            <div className="space-y-2">
              {config.models
                .map(model => ({
                  ...model,
                  efficiency: (model.energyPerTokenWh || 0.1) / model.pricePer1kTokensUSD
                }))
                .sort((a, b) => a.efficiency - b.efficiency)
                .map((model, index) => (
                  <div key={model.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-400' : 
                        index === 1 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="text-gray-300">{model.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400">
                        {((model.energyPerTokenWh || 0.1) * 1000).toFixed(1)} mWh/token
                      </div>
                      <div className="text-xs text-gray-500">
                        ${model.pricePer1kTokensUSD}/1k tokens
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium mb-3">Projected 10-Second Run</h4>
            {(() => {
              const avgTokensPerProfile = config.profiles.reduce((sum, p) => 
                sum + p.promptTokenMean + p.completionTokenMean, 0) / config.profiles.length;
              const totalUsers = config.totalUsers;
              const avgRPS = config.profiles.reduce((sum, p) => sum + p.avgReqsPerUserPerSec, 0) / config.profiles.length;
              
              const estimatedRequests = totalUsers * avgRPS * 10;
              const estimatedTokens = estimatedRequests * avgTokensPerProfile;
              
              const avgEnergyPerToken = config.models.reduce((sum, m) => 
                sum + (m.energyPerTokenWh || 0.1) * (m.weight || 1), 0) / 
                config.models.reduce((sum, m) => sum + (m.weight || 1), 0);
              
              const estimatedEnergyWh = estimatedTokens * avgEnergyPerToken;
              const projectedEquivalents = calculateEquivalents(estimatedEnergyWh, config.sustain);
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. requests:</span>
                    <span>{Math.round(estimatedRequests).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. tokens:</span>
                    <span>{Math.round(estimatedTokens).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. energy:</span>
                    <span>{estimatedEnergyWh.toFixed(1)} Wh</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phone charges:</span>
                      <span className="text-green-400">{projectedEquivalents.phoneCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">CO₂e:</span>
                      <span className="text-orange-400">{(projectedEquivalents.co2eKg * 1000).toFixed(1)}g</span>
                    </div>
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
