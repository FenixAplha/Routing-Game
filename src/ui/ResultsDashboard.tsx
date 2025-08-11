// ui/ResultsDashboard.tsx
// Executive-Level BI Analytics Dashboard for AI Cost Intelligence

import React, { useState, useMemo, useEffect } from 'react';
import { 
  AIModel, 
  TokenScenario,
  PROVIDER_COLORS,
  Provider,
  ModelUtils
} from '../models';
import { EnhancedCostCalculator, EnhancedCostRequest, EnhancedCostResult } from '../calc/enhanced-pricing';
import { CostTrendChart } from '../components/visualizations/CostTrendChart';
import { ProviderComparisonChart } from '../components/visualizations/ProviderComparisonChart';

interface ResultsDashboardProps {
  scenario: TokenScenario;
  models: AIModel[];
  results: EnhancedCostResult[];
  hardwareConfig?: any;
  onExport?: (format: 'pdf' | 'csv' | 'json') => void;
  onOptimize?: (optimizations: OptimizationRecommendation[]) => void;
}

interface OptimizationRecommendation {
  type: 'model-switch' | 'caching' | 'batching' | 'scaling';
  title: string;
  description: string;
  estimated_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  models?: string[];
}

interface MetricCard {
  title: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format: 'currency' | 'number' | 'percentage' | 'text';
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
  metadata?: any;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  scenario,
  models,
  results,
  hardwareConfig,
  onExport,
  onOptimize
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('monthly');
  const [selectedView, setSelectedView] = useState<'overview' | 'providers' | 'models' | 'optimization'>('overview');
  const [comparisonMode, setComparisonMode] = useState<'cost' | 'performance' | 'efficiency' | 'sustainability'>('cost');

  // Generate trend data for charts
  const chartData = useMemo(() => {
    if (results.length === 0) return { costTrend: [], providerComparison: [] };

    // Generate cost trend data (simulated - in production would use historical data)
    const costTrendData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const baseCost = results.reduce((sum, r) => sum + r.costs.total_cost, 0);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const cost = baseCost * (1 + variation);
      
      costTrendData.push({
        timestamp: date.toISOString(),
        date: date.toLocaleDateString(),
        cost: cost,
        volume: Math.floor(Math.random() * 1000 + 500),
        efficiency: Math.random() * 3 + 7,
        provider: 'mixed',
        confidence_upper: cost * 1.1,
        confidence_lower: cost * 0.9
      });
    }

    // Generate provider comparison data
    const providerMetrics = new Map();
    results.forEach(result => {
      const provider = result.model.provider;
      const existing = providerMetrics.get(provider) || {
        provider,
        cost: 0,
        performance: 0,
        efficiency: 0,
        volume: 0,
        market_share: 0,
        sustainability_score: 0,
        avg_latency: 0,
        model_count: 0
      };

      existing.cost += result.costs.total_cost;
      existing.performance += result.performance.efficiency_score;
      existing.efficiency += result.performance.efficiency_score;
      existing.volume += result.request.requests_count;
      existing.sustainability_score += result.sustainability.sustainability_score;
      existing.avg_latency += result.performance.estimated_latency_ms;
      existing.model_count++;
      providerMetrics.set(provider, existing);
    });

    const totalCost = results.reduce((sum, r) => sum + r.costs.total_cost, 0);
    const providerComparisonData = Array.from(providerMetrics.values()).map(metrics => {
      metrics.market_share = (metrics.cost / totalCost) * 100;
      metrics.performance = metrics.performance / metrics.model_count;
      metrics.efficiency = metrics.efficiency / metrics.model_count;
      metrics.sustainability_score = metrics.sustainability_score / metrics.model_count;
      metrics.avg_latency = metrics.avg_latency / metrics.model_count;
      return metrics;
    });

    return {
      costTrend: costTrendData,
      providerComparison: providerComparisonData
    };
  }, [results]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (results.length === 0) return null;

    const totalCost = results.reduce((sum, r) => sum + r.costs.total_cost, 0);
    const totalRequests = results.reduce((sum, r) => sum + r.request.requests_count, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.request.input_tokens + r.request.output_tokens, 0);
    const totalEnergy = results.reduce((sum, r) => sum + r.sustainability.energy_consumption_wh, 0);

    // Provider breakdown
    const providerMetrics = new Map<Provider, {
      cost: number;
      requests: number;
      efficiency: number;
      models: number;
      market_share: number;
    }>();

    results.forEach(result => {
      const provider = result.model.provider;
      const existing = providerMetrics.get(provider) || {
        cost: 0, requests: 0, efficiency: 0, models: 0, market_share: 0
      };

      existing.cost += result.costs.total_cost;
      existing.requests += result.request.requests_count;
      existing.efficiency += result.performance.efficiency_score;
      existing.models++;
      providerMetrics.set(provider, existing);
    });

    // Calculate market share and average efficiency
    providerMetrics.forEach(metrics => {
      metrics.market_share = (metrics.cost / totalCost) * 100;
      metrics.efficiency = metrics.efficiency / metrics.models;
    });

    // Cost trend analysis (simulated - in real app would use historical data)
    const costTrend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable';
    const costChange = costTrend === 'up' ? Math.random() * 15 + 5 : 
                      costTrend === 'down' ? -(Math.random() * 10 + 2) : Math.random() * 4 - 2;

    return {
      totals: {
        cost: totalCost,
        requests: totalRequests,
        tokens: totalTokens,
        energy: totalEnergy,
        co2e: results.reduce((sum, r) => sum + r.sustainability.co2e_kg, 0),
        avg_cost_per_request: totalCost / totalRequests,
        avg_cost_per_token: totalCost / totalTokens * 1000
      },
      trends: {
        cost_trend: costTrend as 'up' | 'down' | 'stable',
        cost_change: costChange,
        efficiency_trend: 'stable' as const,
        volume_trend: 'up' as const
      },
      providers: Array.from(providerMetrics.entries()).map(([provider, metrics]) => ({
        provider,
        ...metrics,
        color: PROVIDER_COLORS[provider]
      })).sort((a, b) => b.cost - a.cost),
      models: results.map(r => ({
        id: r.model.id,
        name: r.model.name,
        provider: r.model.provider,
        cost: r.costs.total_cost,
        efficiency: r.performance.efficiency_score,
        quality: r.model.performance.quality_score || 5,
        sustainability: r.sustainability.sustainability_score,
        tier: r.insights.cost_tier
      })).sort((a, b) => b.cost - a.cost)
    };
  }, [results]);

  // Generate optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    if (!analytics) return [];

    const recommendations: OptimizationRecommendation[] = [];

    // Model optimization recommendations
    const mostExpensiveModel = analytics.models[0];
    const alternatives = ModelUtils.getCostEffectiveAlternatives(mostExpensiveModel.id, 2);
    
    if (alternatives.length > 0) {
      const potentialSavings = mostExpensiveModel.cost * 0.3; // Estimate 30% savings
      recommendations.push({
        type: 'model-switch',
        title: 'Switch to Cost-Effective Alternative',
        description: `Consider ${alternatives[0].name} as an alternative to ${mostExpensiveModel.name} for 30-40% cost savings`,
        estimated_savings: potentialSavings,
        implementation_effort: 'low',
        models: [alternatives[0].id]
      });
    }

    // Caching recommendation
    if (scenario.cache_hit_rate && scenario.cache_hit_rate < 0.3) {
      recommendations.push({
        type: 'caching',
        title: 'Implement Advanced Caching',
        description: 'Increase cache hit rate from 20% to 50% to reduce redundant processing costs',
        estimated_savings: analytics.totals.cost * 0.25,
        implementation_effort: 'medium'
      });
    }

    // Batching recommendation for high-volume scenarios
    if (scenario.requests_per_day > 1000) {
      recommendations.push({
        type: 'batching',
        title: 'Enable Batch Processing',
        description: 'Process requests in batches to leverage volume discounts',
        estimated_savings: analytics.totals.cost * 0.15,
        implementation_effort: 'medium'
      });
    }

    // Scaling optimization
    if (analytics.totals.cost > 1000) {
      recommendations.push({
        type: 'scaling',
        title: 'Implement Smart Load Balancing',
        description: 'Route simple queries to smaller models automatically',
        estimated_savings: analytics.totals.cost * 0.2,
        implementation_effort: 'high'
      });
    }

    return recommendations.sort((a, b) => b.estimated_savings - a.estimated_savings);
  }, [analytics, scenario]);

  // Key metric cards for executive overview
  const metricCards: MetricCard[] = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Cost',
        value: `$${analytics.totals.cost.toFixed(2)}`,
        change: analytics.trends.cost_change,
        trend: analytics.trends.cost_trend,
        format: 'currency',
        color: analytics.trends.cost_trend === 'up' ? 'red' : 'green'
      },
      {
        title: 'Cost per Request',
        value: `$${analytics.totals.avg_cost_per_request.toFixed(4)}`,
        format: 'currency',
        color: 'blue'
      },
      {
        title: 'Total Requests',
        value: analytics.totals.requests.toLocaleString(),
        format: 'number',
        color: 'purple'
      },
      {
        title: 'Efficiency Score',
        value: `${(analytics.totals.tokens / Math.max(analytics.totals.cost, 0.001)).toFixed(0)}`,
        format: 'text',
        color: 'green'
      },
      {
        title: 'Energy Consumption',
        value: `${analytics.totals.energy.toFixed(1)} Wh`,
        format: 'text',
        color: 'yellow'
      },
      {
        title: 'Carbon Footprint',
        value: `${(analytics.totals.co2e * 1000).toFixed(1)}g CO₂e`,
        format: 'text',
        color: 'red'
      }
    ];
  }, [analytics]);

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No Results Available</div>
        <p className="text-gray-400">Run a scenario analysis to see detailed cost insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Cost Analytics Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Comprehensive analysis for "{scenario.name}" • {scenario.requests_per_day.toLocaleString()} requests/day
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>

          <div className="flex rounded-lg bg-dark-surface border border-dark-border p-1">
            {['overview', 'providers', 'models', 'optimization'].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view as any)}
                className={`px-3 py-1 rounded text-sm transition-colors capitalize ${
                  selectedView === view
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {onExport && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('pdf')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                📄 PDF
              </button>
              <button
                onClick={() => onExport('csv')}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                📊 CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricCards.map((metric, index) => (
              <div key={index} className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">{metric.title}</h3>
                  {metric.trend && (
                    <span className={`text-xs ${
                      metric.trend === 'up' ? 'text-red-400' : 
                      metric.trend === 'down' ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '→'}
                    </span>
                  )}
                </div>
                <div className={`text-xl font-bold mb-1 ${
                  metric.color === 'green' ? 'text-green-400' :
                  metric.color === 'red' ? 'text-red-400' :
                  metric.color === 'blue' ? 'text-blue-400' :
                  metric.color === 'purple' ? 'text-purple-400' :
                  metric.color === 'yellow' ? 'text-yellow-400' : 'text-white'
                }`}>
                  {metric.value}
                </div>
                {metric.change && (
                  <div className={`text-xs ${
                    metric.change > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs last period
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Professional Charts Section */}
          <div className="space-y-6">
            {/* Cost Trend Chart */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <CostTrendChart
                data={chartData.costTrend}
                timeRange="30d"
                showConfidenceInterval={true}
                showVolume={false}
                height={350}
                className=""
              />
            </div>

            {/* Provider Comparison Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                <ProviderComparisonChart
                  data={chartData.providerComparison}
                  viewMode="cost"
                  height={350}
                  className=""
                />
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                <ProviderComparisonChart
                  data={chartData.providerComparison}
                  viewMode="quadrant"
                  height={350}
                  className=""
                />
              </div>
            </div>
          </div>

          {/* Legacy Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Cost Distribution */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Cost by Provider</h3>
              <div className="space-y-3">
                {analytics.providers.map((provider, index) => {
                  const percentage = (provider.cost / analytics.totals.cost) * 100;
                  return (
                    <div key={provider.provider} className="flex items-center gap-3">
                      <div className="w-6 text-sm text-gray-400">#{index + 1}</div>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: provider.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{provider.provider}</span>
                          <span className="text-gray-400">${provider.cost.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: provider.color 
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(1)}% • {provider.models} models • {provider.requests.toLocaleString()} requests
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Performance Comparison */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Model Performance</h3>
                <select
                  value={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.value as any)}
                  className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-white"
                >
                  <option value="cost">Cost</option>
                  <option value="performance">Performance</option>
                  <option value="efficiency">Efficiency</option>
                  <option value="sustainability">Sustainability</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {analytics.models.slice(0, 5).map((model, index) => {
                  const getValue = () => {
                    switch (comparisonMode) {
                      case 'cost': return model.cost;
                      case 'performance': return model.quality;
                      case 'efficiency': return model.efficiency;
                      case 'sustainability': return model.sustainability;
                      default: return model.cost;
                    }
                  };
                  
                  const maxValue = Math.max(...analytics.models.map(getValue));
                  const percentage = (getValue() / maxValue) * 100;
                  
                  return (
                    <div key={model.id} className="flex items-center gap-3">
                      <div className="w-6 text-sm text-gray-400">#{index + 1}</div>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PROVIDER_COLORS[model.provider as keyof typeof PROVIDER_COLORS] || '#6366f1' }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{model.name}</span>
                          <span className="text-gray-400">
                            {comparisonMode === 'cost' ? `$${getValue().toFixed(2)}` : getValue().toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded ${
                            model.tier === 'budget' ? 'bg-green-900 text-green-300' :
                            model.tier === 'mid-tier' ? 'bg-yellow-900 text-yellow-300' :
                            model.tier === 'premium' ? 'bg-orange-900 text-orange-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {model.tier}
                          </span>
                          <span>{model.provider}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hardware Configuration Display */}
          {hardwareConfig && (
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Hardware Configuration Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-bg rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Deployment Type</div>
                  <div className="text-lg font-bold text-white capitalize">{hardwareConfig.deployment_type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {hardwareConfig.deployment_type === 'cloud' ? 'Managed infrastructure' : 'On-premise setup'}
                  </div>
                </div>
                
                {hardwareConfig.deployment_type === 'cloud' && hardwareConfig.cloud_config && (
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Cloud Instance</div>
                    <div className="text-lg font-bold text-blue-400">{hardwareConfig.cloud_config.instance_type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {hardwareConfig.cloud_config.provider} • {hardwareConfig.cloud_config.region}
                    </div>
                  </div>
                )}
                
                {hardwareConfig.deployment_type === 'on_premise' && hardwareConfig.on_premise_config && (
                  <div className="bg-dark-bg rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">GPU Configuration</div>
                    <div className="text-lg font-bold text-purple-400">{hardwareConfig.on_premise_config.gpu_count}x GPU</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Power: ${hardwareConfig.on_premise_config.power_cost_per_kwh}/kWh
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Infrastructure Cost</div>
                  <div className="text-lg font-bold text-green-400">+15-25%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Estimated overhead on AI costs
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Projections */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h3 className="font-semibold text-white mb-4">Cost Projections</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Daily', value: analytics.totals.cost, multiplier: 1 },
                { label: 'Weekly', value: analytics.totals.cost, multiplier: 7 },
                { label: 'Monthly', value: analytics.totals.cost, multiplier: 30 },
                { label: 'Annual', value: analytics.totals.cost, multiplier: 365 }
              ].map((projection, index) => (
                <div key={projection.label} className={`text-center p-4 rounded-lg ${
                  selectedTimeframe === projection.label.toLowerCase() ? 'bg-primary-900/30 border border-primary-500' : 'bg-dark-bg'
                }`}>
                  <div className="text-lg font-bold text-white">
                    ${(projection.value * projection.multiplier).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">{projection.label}</div>
                  {index > 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      {((projection.value * projection.multiplier) / (analytics.totals.requests * projection.multiplier) * 1000).toFixed(2)} per 1k requests
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Providers Tab */}
      {selectedView === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analytics.providers.map(provider => (
              <div key={provider.provider} className="bg-dark-surface border border-dark-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: provider.color }}
                  />
                  <h3 className="font-semibold text-white">{provider.provider}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white font-medium">${provider.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Share:</span>
                    <span className="text-white">{provider.market_share.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Models:</span>
                    <span className="text-white">{provider.models}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Efficiency:</span>
                    <span className="text-white">{provider.efficiency.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requests:</span>
                    <span className="text-white">{provider.requests.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Cost per Request</div>
                    <div className="text-lg font-bold text-green-400">
                      ${(provider.cost / provider.requests).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tab */}
      {selectedView === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-2">💡 Optimization Opportunities</h3>
            <p className="text-gray-300 mb-4">
              Identified {optimizationRecommendations.length} opportunities to optimize your AI costs and performance.
            </p>
            <div className="text-2xl font-bold text-green-400">
              Potential Savings: ${optimizationRecommendations.reduce((sum, rec) => sum + rec.estimated_savings, 0).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {optimizationRecommendations.map((recommendation, index) => (
              <div key={index} className="bg-dark-surface border border-dark-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      recommendation.type === 'model-switch' ? 'bg-blue-400' :
                      recommendation.type === 'caching' ? 'bg-green-400' :
                      recommendation.type === 'batching' ? 'bg-yellow-400' :
                      'bg-purple-400'
                    }`} />
                    <h4 className="font-semibold text-white">{recommendation.title}</h4>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    recommendation.implementation_effort === 'low' ? 'bg-green-900 text-green-300' :
                    recommendation.implementation_effort === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {recommendation.implementation_effort} effort
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{recommendation.description}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-400 font-bold">
                      ${recommendation.estimated_savings.toFixed(2)} saved
                    </div>
                    <div className="text-xs text-gray-500">
                      {((recommendation.estimated_savings / analytics.totals.cost) * 100).toFixed(1)}% reduction
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {onOptimize && (
            <div className="text-center">
              <button
                onClick={() => onOptimize(optimizationRecommendations)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply All Optimizations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};