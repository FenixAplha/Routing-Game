// routes/admin/Records.tsx
import React, { useState, useMemo } from 'react';
import { useRuntimeStore } from '../../store/runtimeStore';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency, formatPercent } from '../../calc/pricing';
import { calculateEquivalents, getDisplayUnit } from '../../calc/sustainability';

type ExportFormat = 'json' | 'csv' | 'pdf';
type DateFilter = 'all' | 'today' | 'week' | 'month';

export const Records: React.FC = () => {
  const { 
    recentRecords, 
    clearRecords, 
    exportRecordsJSON, 
    exportRecordsCSV,
    loadRecentRecords 
  } = useRuntimeStore();
  const { config } = useConfigStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);

  // Filtered records based on date filter
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoffDates = {
      all: new Date(0),
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    
    return recentRecords.filter(record => 
      new Date(record.startedAt) >= cutoffDates[dateFilter]
    );
  }, [recentRecords, dateFilter]);

  // Comprehensive analytics for filtered records
  const analytics = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalCost: 0,
        totalCommission: 0,
        totalRequests: 0,
        totalTokens: 0,
        totalEnergy: 0,
        totalCO2: 0,
        avgCostPerRequest: 0,
        avgCostPerToken: 0,
        mostExpensiveModel: null,
        topModels: [],
        efficiencyScore: 0,
        costTrend: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    const totalCost = filteredRecords.reduce((sum, r) => sum + r.modelCostUSD, 0);
    const totalCommission = filteredRecords.reduce((sum, r) => sum + r.commissionUSD, 0);
    const totalRequests = filteredRecords.reduce((sum, r) => sum + r.forwards, 0);
    const totalTokens = filteredRecords.reduce((sum, r) => sum + r.tokensTotal, 0);
    const totalEnergy = filteredRecords.reduce((sum, r) => sum + r.energyWh, 0);
    const totalCO2 = filteredRecords.reduce((sum, r) => sum + r.co2eKg, 0);

    // Model usage analysis
    const modelUsage = new Map<string, { requests: number, cost: number, tokens: number }>();
    filteredRecords.forEach(record => {
      if (record.byModel) {
        Object.entries(record.byModel).forEach(([modelId, stats]) => {
          if (stats) {
            const existing = modelUsage.get(modelId) || { requests: 0, cost: 0, tokens: 0 };
            existing.requests += stats.forwards || 0;
            existing.cost += stats.modelCostUSD || 0;
            existing.tokens += stats.tokensTotal || 0;
            modelUsage.set(modelId, existing);
          }
        });
      }
    });

    const topModels = Array.from(modelUsage.entries())
      .map(([modelId, stats]) => {
        const model = config.models.find(m => m.id === modelId);
        return {
          modelId,
          modelName: model?.name || modelId,
          ...stats,
          efficiency: stats.tokens > 0 ? stats.cost / stats.tokens * 1000 : 0
        };
      })
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Cost trend analysis (comparing first half vs second half)
    const midpoint = Math.floor(filteredRecords.length / 2);
    const firstHalfAvg = midpoint > 0 ? 
      filteredRecords.slice(0, midpoint).reduce((sum, r) => sum + r.modelCostUSD, 0) / midpoint : 0;
    const secondHalfAvg = midpoint > 0 ? 
      filteredRecords.slice(midpoint).reduce((sum, r) => sum + r.modelCostUSD, 0) / (filteredRecords.length - midpoint) : 0;
    
    let costTrend: 'up' | 'down' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) costTrend = 'up';
    else if (secondHalfAvg < firstHalfAvg * 0.9) costTrend = 'down';

    return {
      totalCost,
      totalCommission,
      totalRequests,
      totalTokens,
      totalEnergy,
      totalCO2,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgCostPerToken: totalTokens > 0 ? totalCost / totalTokens * 1000 : 0,
      mostExpensiveModel: topModels[0]?.modelName || null,
      topModels,
      efficiencyScore: totalTokens > 0 ? (totalTokens / totalEnergy) : 0,
      costTrend
    };
  }, [filteredRecords, config.models]);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          dateFilter,
          recordCount: filteredRecords.length,
          analytics
        },
        records: filteredRecords,
        configuration: config
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-cost-analysis-${dateFilter}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Enhanced CSV with AI cost analysis
      const csvHeaders = [
        'Date', 'Time', 'Duration (s)', 'Requests', 'Tokens Total', 
        'Model Cost ($)', 'Commission ($)', 'Total Revenue ($)', 'Cost per Request ($)', 
        'Cost per 1K Tokens ($)', 'Energy (Wh)', 'CO2e (kg)', 'Phone Charges Equivalent',
        'Top Model Used', 'Efficiency Score'
      ];

      const csvRows = filteredRecords.map(record => {
        const date = new Date(record.startedAt);
        const costPerRequest = record.forwards > 0 ? record.modelCostUSD / record.forwards : 0;
        const costPer1kTokens = record.tokensTotal > 0 ? (record.modelCostUSD / record.tokensTotal) * 1000 : 0;
        const phoneCharges = calculateEquivalents(record.energyWh, config.sustain).phoneCharges;
        const efficiencyScore = record.energyWh > 0 ? record.tokensTotal / record.energyWh : 0;

        // Find top model for this record
        let topModel = 'Unknown';
        if (record.byModel) {
          let maxCost = 0;
          Object.entries(record.byModel).forEach(([modelId, stats]) => {
            if (stats && (stats.modelCostUSD || 0) > maxCost) {
              maxCost = stats.modelCostUSD || 0;
              const model = config.models.find(m => m.id === modelId);
              topModel = model?.name || modelId;
            }
          });
        }

        return [
          date.toISOString().split('T')[0],
          date.toISOString().split('T')[1].split('.')[0],
          record.durationSeconds,
          record.forwards,
          record.tokensTotal,
          record.modelCostUSD.toFixed(4),
          record.commissionUSD.toFixed(4),
          (record.modelCostUSD + record.commissionUSD).toFixed(4),
          costPerRequest.toFixed(6),
          costPer1kTokens.toFixed(4),
          record.energyWh.toFixed(2),
          record.co2eKg.toFixed(6),
          phoneCharges.toFixed(2),
          topModel,
          efficiencyScore.toFixed(1)
        ];
      });

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-cost-analysis-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Create comprehensive PDF report content
      const reportContent = `
# AI Cost Analysis Report

**Generated:** ${new Date().toLocaleString()}  
**Period:** ${dateFilter === 'all' ? 'All time' : dateFilter}  
**Records:** ${filteredRecords.length}

## Executive Summary

- **Total Model Cost:** $${analytics.totalCost.toFixed(2)}
- **Total Commission:** $${analytics.totalCommission.toFixed(2)}
- **Total Requests:** ${analytics.totalRequests.toLocaleString()}
- **Total Tokens:** ${analytics.totalTokens.toLocaleString()}
- **Average Cost per Request:** $${analytics.avgCostPerRequest.toFixed(4)}
- **Average Cost per 1K Tokens:** $${analytics.avgCostPerToken.toFixed(4)}

## Environmental Impact

- **Total Energy Consumed:** ${analytics.totalEnergy.toFixed(1)} Wh
- **CO₂ Emissions:** ${analytics.totalCO2.toFixed(3)} kg
- **Phone Charge Equivalent:** ${calculateEquivalents(analytics.totalEnergy, config.sustain).phoneCharges.toFixed(1)} charges
- **Efficiency Score:** ${analytics.efficiencyScore.toFixed(1)} tokens/Wh

## Model Usage Analysis

**Top Models by Cost:**
${analytics.topModels.slice(0, 5).map((model, i) => 
  `${i + 1}. ${model.modelName}: $${model.cost.toFixed(2)} (${model.requests.toLocaleString()} requests)`
).join('\n')}

## Cost Trend

**Trend:** ${analytics.costTrend === 'up' ? '↗️ Increasing' : analytics.costTrend === 'down' ? '↘️ Decreasing' : '➡️ Stable'}

## Recommendations

${analytics.costTrend === 'up' ? 
  '- Consider optimizing model selection for cost efficiency\n- Review high-cost models and their usage patterns\n- Explore using smaller models for simpler tasks' :
  analytics.costTrend === 'down' ? 
  '- Good cost optimization trend detected\n- Current model selection strategy appears effective\n- Continue monitoring for sustained improvements' :
  '- Costs are stable, consider testing optimization strategies\n- Monitor for opportunities to improve efficiency\n- Review model mix for potential cost savings'
}

---
*Report generated by AI Cost Calculator*
      `;

      // Simple PDF generation using HTML conversion
      const htmlContent = `
        <html>
          <head>
            <title>AI Cost Analysis Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #2563eb; }
              h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
              .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .metric { margin: 5px 0; }
              .trend-up { color: #dc2626; }
              .trend-down { color: #16a34a; }
              .trend-stable { color: #6b7280; }
            </style>
          </head>
          <body>${reportContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/# (.*?)(<br>|$)/g, '<h1>$1</h1>').replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>')}</body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-cost-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearRecords = async () => {
    try {
      await clearRecords();
      setShowClearConfirm(false);
      await loadRecentRecords();
    } catch (error) {
      console.error('Clear failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">AI Cost Analysis & Records</h2>
          <div className="flex items-center gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-3 py-1 bg-dark-surface border border-dark-border rounded text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
        <p className="text-gray-400 mb-6">
          Comprehensive AI cost analysis with detailed breakdowns, trends, and export capabilities.
        </p>
      </div>

      {/* Analytics Dashboard */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">${analytics.totalCost.toFixed(2)}</div>
            <div className="text-sm text-gray-300">Total Model Cost</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: ${analytics.avgCostPerRequest.toFixed(4)}/req
            </div>
          </div>
          
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">{analytics.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Requests</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.totalTokens.toLocaleString()} tokens
            </div>
          </div>
          
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {getDisplayUnit(analytics.totalEnergy, 'Wh').value.toFixed(1)}
            </div>
            <div className="text-sm text-gray-300">
              {getDisplayUnit(analytics.totalEnergy, 'Wh').unit} Energy
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calculateEquivalents(analytics.totalEnergy, config.sustain).phoneCharges.toFixed(1)} phone charges
            </div>
          </div>
          
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className={`text-2xl font-bold ${
              analytics.costTrend === 'up' ? 'text-red-400' : 
              analytics.costTrend === 'down' ? 'text-green-400' : 'text-gray-400'
            }`}>
              {analytics.costTrend === 'up' ? '↗️' : analytics.costTrend === 'down' ? '↘️' : '➡️'}
            </div>
            <div className="text-sm text-gray-300">Cost Trend</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.costTrend === 'up' ? 'Increasing' : 
               analytics.costTrend === 'down' ? 'Decreasing' : 'Stable'}
            </div>
          </div>
        </div>
      )}

      {/* Top Models Analysis */}
      {analytics.topModels.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Top Models by Cost</h3>
          <div className="space-y-3">
            {analytics.topModels.slice(0, 5).map((model, index) => {
              const maxCost = analytics.topModels[0]?.cost || 1;
              const percentage = (model.cost / maxCost) * 100;
              
              return (
                <div key={model.modelId} className="flex items-center gap-3">
                  <div className="w-6 text-sm text-gray-400">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{model.modelName}</span>
                      <span className="text-gray-400">${model.cost.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {model.requests.toLocaleString()} requests • ${(model.cost/model.requests).toFixed(4)}/req • {model.efficiency.toFixed(2)}¢/1k tokens
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Actions */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Export & Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Export Data</h4>
            <div className="space-y-2">
              <button
                onClick={handleExportJSON}
                disabled={isExporting || filteredRecords.length === 0}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                {isExporting ? 'Exporting...' : 'Export Enhanced JSON'}
              </button>
              
              <button
                onClick={handleExportCSV}
                disabled={isExporting || filteredRecords.length === 0}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                {isExporting ? 'Exporting...' : 'Export Detailed CSV'}
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={isExporting || filteredRecords.length === 0}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                {isExporting ? 'Exporting...' : 'Export Analysis Report'}
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              Exporting {filteredRecords.length} of {recentRecords.length} records
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Data Management</h4>
            <div className="space-y-2">
              <button
                onClick={loadRecentRecords}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                🔄 Refresh Data
              </button>
              
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={recentRecords.length === 0}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                🗑️ Clear All Records
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              {recentRecords.length}/50 records stored locally
            </div>
          </div>
        </div>

        {filteredRecords.length > 0 && (
          <div className="mt-6 p-4 bg-dark-bg border border-dark-border rounded-lg">
            <div className="text-sm font-medium text-gray-300 mb-2">Export Includes:</div>
            <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-4">
              <div>✓ Detailed cost breakdowns</div>
              <div>✓ Model performance metrics</div>
              <div>✓ Environmental impact data</div>
              <div>✓ Efficiency analysis</div>
              <div>✓ Cost trend indicators</div>
              <div>✓ Configuration snapshots</div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold mb-4">Clear All Records?</h3>
            <p className="text-gray-400 mb-6">
              This will permanently delete all {recentRecords.length} recorded runs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearRecords}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Records Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Detailed Run History</h3>
        
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {recentRecords.length === 0 ? 'No records found' : `No records for ${dateFilter === 'all' ? 'selected period' : dateFilter}`}
            </div>
            <p className="text-gray-400 text-sm">
              {recentRecords.length === 0 
                ? 'Run some AI cost simulations to see data here.' 
                : `Try selecting a different time period. ${recentRecords.length} records available in total.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Showing {filteredRecords.length} of {recentRecords.length} records 
              {dateFilter !== 'all' && ` for ${dateFilter}`}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-dark-border">
                    <th className="pb-3 font-medium">Date & Time</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Requests</th>
                    <th className="pb-3 font-medium">Tokens</th>
                    <th className="pb-3 font-medium">Model Cost</th>
                    <th className="pb-3 font-medium">Cost/Req</th>
                    <th className="pb-3 font-medium">Cost/1K Tokens</th>
                    <th className="pb-3 font-medium">Energy</th>
                    <th className="pb-3 font-medium">Efficiency</th>
                    <th className="pb-3 font-medium">Top Model</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const costPerRequest = record.forwards > 0 ? record.modelCostUSD / record.forwards : 0;
                    const costPer1kTokens = record.tokensTotal > 0 ? (record.modelCostUSD / record.tokensTotal) * 1000 : 0;
                    const efficiencyScore = record.energyWh > 0 ? record.tokensTotal / record.energyWh : 0;
                    
                    // Find top model for this record
                    let topModel = 'Unknown';
                    if (record.byModel) {
                      let maxCost = 0;
                      Object.entries(record.byModel).forEach(([modelId, stats]) => {
                        if (stats && (stats.modelCostUSD || 0) > maxCost) {
                          maxCost = stats.modelCostUSD || 0;
                          const model = config.models.find(m => m.id === modelId);
                          topModel = model?.name || modelId;
                        }
                      });
                    }

                    const date = new Date(record.startedAt);
                    
                    return (
                      <tr key={record.id} className="hover:bg-dark-bg border-b border-dark-border/30">
                        <td className="py-3">
                          <div>{date.toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
                        </td>
                        <td className="py-3">{record.durationSeconds}s</td>
                        <td className="py-3">{record.forwards.toLocaleString()}</td>
                        <td className="py-3">
                          <div>{record.tokensTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round(record.tokensTotal / record.forwards)} avg/req
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-green-400">${formatCurrency(record.modelCostUSD)}</div>
                          {record.commissionUSD > 0 && (
                            <div className="text-xs text-gray-500">+${formatCurrency(record.commissionUSD)} comm</div>
                          )}
                        </td>
                        <td className="py-3">${costPerRequest.toFixed(4)}</td>
                        <td className="py-3">${costPer1kTokens.toFixed(4)}</td>
                        <td className="py-3">
                          <div>{record.energyWh.toFixed(1)} Wh</div>
                          <div className="text-xs text-gray-500">
                            {(record.co2eKg * 1000).toFixed(1)}g CO₂e
                          </div>
                        </td>
                        <td className="py-3">
                          <div>{efficiencyScore.toFixed(1)} t/Wh</div>
                          <div className="text-xs text-gray-500">
                            {calculateEquivalents(record.energyWh, config.sustain).phoneCharges.toFixed(2)} charges
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs">{topModel}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Storage Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-blue-400">{recentRecords.length}</div>
            <div className="text-sm text-gray-300">Records Stored</div>
            <div className="text-xs text-gray-500 mt-1">Maximum 50 records</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-green-400">Local</div>
            <div className="text-sm text-gray-300">Storage Type</div>
            <div className="text-xs text-gray-500 mt-1">IndexedDB in browser</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <div className="text-lg font-bold text-purple-400">Auto-pruned</div>
            <div className="text-sm text-gray-300">Retention</div>
            <div className="text-xs text-gray-500 mt-1">Oldest records removed automatically</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
          <div className="text-sm text-gray-300 mb-2">Data Privacy:</div>
          <div className="text-xs text-gray-500">
            All data is stored locally in your browser. No information is sent to external servers. 
            Records persist between sessions but are tied to this browser and domain.
          </div>
        </div>
      </div>
    </div>
  );
};
