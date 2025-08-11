// components/visualizations/CostTrendChart.tsx
// Professional Cost Trend Visualization using Recharts

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';

interface CostDataPoint {
  timestamp: string;
  date: string;
  cost: number;
  volume: number;
  efficiency: number;
  provider: string;
  confidence_upper: number;
  confidence_lower: number;
}

interface CostTrendChartProps {
  data: CostDataPoint[];
  timeRange: '24h' | '7d' | '30d' | '90d';
  showConfidenceInterval?: boolean;
  showVolume?: boolean;
  height?: number;
  className?: string;
}

export const CostTrendChart: React.FC<CostTrendChartProps> = ({
  data,
  timeRange,
  showConfidenceInterval = true,
  showVolume = false,
  height = 400,
  className = ""
}) => {
  // Custom tooltip for professional appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold text-sm">{data.date}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Cost:</span>
              <span className="text-green-400 font-mono">${data.cost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Volume:</span>
              <span className="text-blue-400 font-mono">{data.volume.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Efficiency:</span>
              <span className="text-yellow-400 font-mono">{data.efficiency.toFixed(1)}</span>
            </div>
            {showConfidenceInterval && (
              <div className="pt-1 border-t border-gray-600">
                <div className="text-xs text-gray-400">
                  Range: ${data.confidence_lower.toFixed(2)} - ${data.confidence_upper.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Format time axis based on range
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeRange) {
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { weekday: 'short' });
      case '30d':
      case '90d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return tickItem;
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Cost Trend Analysis</h3>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Cost</span>
          </div>
          {showConfidenceInterval && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400/30 rounded-full"></div>
              <span className="text-gray-400">95% Confidence</span>
            </div>
          )}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Confidence interval area */}
          {showConfidenceInterval && (
            <>
              <Line
                type="monotone"
                dataKey="confidence_upper"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth={1}
                dot={false}
                connectNulls
                strokeDasharray="2 2"
              />
              <Line
                type="monotone"
                dataKey="confidence_lower"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth={1}
                dot={false}
                connectNulls
                strokeDasharray="2 2"
              />
            </>
          )}
          
          {/* Main cost line */}
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#1F2937' }}
          />
          
          {/* Volume line (optional) */}
          {showVolume && (
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              yAxisId="right"
            />
          )}
          
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#6366F1"
            fill="rgba(99, 102, 241, 0.1)"
            tickFormatter={formatXAxis}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

