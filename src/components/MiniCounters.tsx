// components/MiniCounters.tsx
import React from 'react';
import { useRuntimeStore } from '../store/runtimeStore';
import { formatCurrency } from '../calc/pricing';
import { getDisplayUnit } from '../calc/sustainability';

interface MiniCountersProps {
  className?: string;
}

export const MiniCounters: React.FC<MiniCountersProps> = ({ className = '' }) => {
  const { simulationState, getCurrentMetrics } = useRuntimeStore();
  const metrics = getCurrentMetrics();
  
  // Format values for display
  const formattedCost = formatCurrency(metrics.modelCostUSD);
  const formattedTokens = metrics.tokensTotal.toLocaleString();
  const formattedRPS = metrics.avgRPS.toFixed(1);
  
  // Energy display with appropriate units
  const energyDisplay = getDisplayUnit(metrics.energyWh, 'Wh');
  const formattedEnergy = `${energyDisplay.value.toFixed(1)} ${energyDisplay.unit}`;
  
  // Phase indicator
  const phaseDisplay = {
    building: 'Building',
    idle: 'Ready',
    running: 'Running',
    drain: 'Draining',
    done: 'Complete',
  }[simulationState.phase];

  const phaseColor = {
    building: 'text-yellow-400',
    idle: 'text-green-400',
    running: 'text-blue-400',
    drain: 'text-orange-400',
    done: 'text-green-500',
  }[simulationState.phase];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {/* Forwards/Returns */}
      <div className="bg-dark-surface/75 border border-dark-border rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-1">Forwards / Returns</div>
        <div className="text-lg font-bold text-dark-text">
          {metrics.forwards.toLocaleString()} / {metrics.returns.toLocaleString()}
        </div>
      </div>

      {/* Tokens */}
      <div className="bg-dark-surface/75 border border-dark-border rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-1">Tokens</div>
        <div className="text-lg font-bold text-dark-text">
          {formattedTokens}
        </div>
      </div>

      {/* Cost (Model only, no commission) */}
      <div className="bg-dark-surface/75 border border-dark-border rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-1">Cost (USD)</div>
        <div className="text-lg font-bold text-dark-text">
          ${formattedCost}
        </div>
      </div>

      {/* Average RPS */}
      <div className="bg-dark-surface/75 border border-dark-border rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-1">Avg RPS</div>
        <div className="text-lg font-bold text-dark-text">
          {formattedRPS}
        </div>
      </div>

      {/* Sustainability Badge */}
      <div className="col-span-2 lg:col-span-4 bg-dark-surface/75 border border-dark-border rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">Energy & Status</div>
            <div className="text-sm text-dark-text">
              {formattedEnergy} • <span className={phaseColor}>{phaseDisplay}</span>
            </div>
          </div>
          {simulationState.phase === 'running' && (
            <div className="text-xs text-gray-400">
              {simulationState.t.toFixed(1)}s / {simulationState.duration}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
