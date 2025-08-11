// components/visualizations/ProviderComparisonChart.tsx
// Professional Provider Comparison using Recharts - Following PowerBI patterns

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { PROVIDER_COLORS } from '../../models';

interface ProviderMetric {
  provider: string;
  cost: number;
  performance: number;
  efficiency: number;
  volume: number;
  market_share: number;
  sustainability_score: number;
  avg_latency: number;
  model_count: number;
}

interface ProviderComparisonChartProps {
  data: ProviderMetric[];
  viewMode: 'cost' | 'performance' | 'efficiency' | 'quadrant';
  height?: number;
  className?: string;
}

export const ProviderComparisonChart: React.FC<ProviderComparisonChartProps> = ({
  data,
  viewMode,
  height = 400,
  className = ""
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Custom tooltip for detailed provider info
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PROVIDER_COLORS[data.provider as keyof typeof PROVIDER_COLORS] }}
            />
            <p className="text-white font-bold">{data.provider}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Cost per 1K tokens:</span>
              <span className="text-green-400 font-mono">${data.cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Performance Score:</span>
              <span className="text-blue-400 font-mono">{data.performance.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Efficiency:</span>
              <span className="text-yellow-400 font-mono">{data.efficiency.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Market Share:</span>
              <span className="text-purple-400 font-mono">{data.market_share.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Models Available:</span>
              <span className="text-orange-400 font-mono">{data.model_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Latency:</span>
              <span className="text-red-400 font-mono">{data.avg_latency}ms</span>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Sustainability:</span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.round(data.sustainability_score / 2)
                          ? 'bg-green-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-green-400 ml-1">{data.sustainability_score.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Quadrant Analysis View (Cost vs Performance)
  const renderQuadrantView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          type="number"
          dataKey="cost"
          name="Cost per 1K tokens"
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `$${value}`}
        />
        <YAxis
          type="number"
          dataKey="performance"
          name="Performance Score"
          stroke="#9CA3AF"
          fontSize={12}
        />
        <ZAxis type="number" dataKey="market_share" range={[50, 400]} />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Quadrant lines */}
        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#6B7280" strokeDasharray="2 2" />
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#6B7280" strokeDasharray="2 2" />
        
        {/* Quadrant labels */}
        <text x="25%" y="25%" textAnchor="middle" fill="#9CA3AF" fontSize="12">
          High Performance
          Low Cost
        </text>
        <text x="75%" y="25%" textAnchor="middle" fill="#9CA3AF" fontSize="12">
          High Performance
          High Cost
        </text>
        <text x="25%" y="75%" textAnchor="middle" fill="#9CA3AF" fontSize="12">
          Low Performance
          Low Cost
        </text>
        <text x="75%" y="75%" textAnchor="middle" fill="#9CA3AF" fontSize="12">
          Low Performance
          High Cost
        </text>
        
        <Scatter data={data} fill="#8884d8">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PROVIDER_COLORS[entry.provider as keyof typeof PROVIDER_COLORS]}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );

  // Bar Chart View
  const renderBarChart = () => {
    const getDataKey = () => {
      switch (viewMode) {
        case 'cost': return 'cost';
        case 'performance': return 'performance';
        case 'efficiency': return 'efficiency';
        default: return 'cost';
      }
    };

    const getColor = () => {
      switch (viewMode) {
        case 'cost': return '#10B981';
        case 'performance': return '#3B82F6';
        case 'efficiency': return '#F59E0B';
        default: return '#10B981';
      }
    };

    const formatYAxis = (value: number) => {
      if (viewMode === 'cost') return `$${value}`;
      return value.toString();
    };

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="provider"
            stroke="#9CA3AF"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={getDataKey()}
            radius={[4, 4, 0, 0]}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PROVIDER_COLORS[entry.provider as keyof typeof PROVIDER_COLORS]}
                opacity={selectedProvider === null || selectedProvider === entry.provider ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'cost': return 'Cost Comparison by Provider';
      case 'performance': return 'Performance Comparison by Provider';
      case 'efficiency': return 'Efficiency Comparison by Provider';
      case 'quadrant': return 'Cost vs Performance Quadrant Analysis';
      default: return 'Provider Comparison';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
        {viewMode !== 'quadrant' && (
          <div className="text-xs text-gray-400">
            Click on a provider to highlight
          </div>
        )}
      </div>
      
      {viewMode === 'quadrant' ? renderQuadrantView() : renderBarChart()}
      
      {/* Provider Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((provider) => (
          <button
            key={provider.provider}
            onClick={() => setSelectedProvider(
              selectedProvider === provider.provider ? null : provider.provider
            )}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all ${
              selectedProvider === null || selectedProvider === provider.provider
                ? 'bg-dark-surface border border-dark-border'
                : 'opacity-50'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PROVIDER_COLORS[provider.provider as keyof typeof PROVIDER_COLORS] }}
            />
            <span className="text-gray-300">{provider.provider}</span>
            <span className="text-gray-500">({provider.model_count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

