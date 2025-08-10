// routes/admin/Sustainability.tsx
import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { useRuntimeStore } from '../../store/runtimeStore';
import { calculateEquivalents, formatSustainability, getDisplayUnit } from '../../calc/sustainability';
import { calculateCumulativeMetrics } from '../../calc/aggregator';

export const Sustainability: React.FC = () => {
  const { config } = useConfigStore();
  const { recentRecords } = useRuntimeStore();
  
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

      {/* Assumptions */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Conversion Assumptions</h3>
        <p className="text-gray-400 text-sm mb-4">
          These baseline values are used to convert energy consumption into relatable equivalents.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-green-400">{config.sustain.phoneChargeWh} Wh</div>
            <div className="text-sm text-gray-300">Phone Charge</div>
            <div className="text-xs text-gray-500 mt-1">
              Energy needed to fully charge a smartphone
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-blue-400">{config.sustain.householdKWhPerDay} kWh/day</div>
            <div className="text-sm text-gray-300">Household Consumption</div>
            <div className="text-xs text-gray-500 mt-1">
              Average daily energy consumption per household
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-orange-400">{config.sustain.gridKgCO2ePerKWh} kg CO₂e/kWh</div>
            <div className="text-sm text-gray-300">Grid Carbon Intensity</div>
            <div className="text-xs text-gray-500 mt-1">
              Carbon emissions per kWh of electricity
            </div>
          </div>
        </div>
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
    </div>
  );
};
