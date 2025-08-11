// routes/admin/Commission.tsx
import React, { useState, useMemo } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useRuntimeStore } from '../../store/runtimeStore';
import { formatCurrency, formatPercent } from '../../calc/pricing';

export const Commission: React.FC = () => {
  const { config } = useConfigStore();
  const { recentRecords, exportRecordsCSV } = useRuntimeStore();
  const [timePeriod, setTimePeriod] = useState<'all' | 'last30' | 'last7' | 'lastRun'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filter records by time period
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoffDates = {
      all: new Date(0),
      last30: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      last7: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastRun: recentRecords.length > 0 ? new Date(recentRecords[0].startedAt) : new Date(0),
    };
    
    return recentRecords.filter(record => 
      new Date(record.startedAt) >= cutoffDates[timePeriod]
    );
  }, [recentRecords, timePeriod]);

  // Calculate metrics for filtered records
  const metrics = useMemo(() => {
    const totalCommission = filteredRecords.reduce((sum, record) => sum + record.commissionUSD, 0);
    const totalModelCost = filteredRecords.reduce((sum, record) => sum + record.modelCostUSD, 0);
    const totalRevenue = totalModelCost + totalCommission;
    const avgCommissionRate = totalModelCost > 0 ? (totalCommission / totalModelCost) * 100 : 0;
    const totalRequests = filteredRecords.reduce((sum, record) => sum + record.forwards, 0);
    
    return {
      totalCommission,
      totalModelCost,
      totalRevenue,
      avgCommissionRate,
      totalRequests,
      recordCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Router performance analysis
  const routerAnalysis = useMemo(() => {
    const routerData = new Map();
    
    filteredRecords.forEach(record => {
      if (record.byRouter) {
        Object.entries(record.byRouter).forEach(([routerId, stats]) => {
          const router = config.routers.find(r => r.id === routerId);
          if (router && stats) {
            const key = router.name;
            const existing = routerData.get(key) || { 
              traversals: 0, 
              commissionUSD: 0, 
              router 
            };
            
            existing.traversals += stats.traversals || 0;
            existing.commissionUSD += stats.commissionUSD || 0;
            routerData.set(key, existing);
          }
        });
      }
    });

    return Array.from(routerData.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.commissionUSD - a.commissionUSD);
  }, [filteredRecords, config.routers]);

  // Export commission data
  const handleExport = async () => {
    if (!filteredRecords.length) return;
    
    setIsExporting(true);
    try {
      // Create commission-focused CSV data
      const commissionData = filteredRecords.map(record => ({
        date: new Date(record.startedAt).toISOString(),
        duration: record.durationSeconds,
        requests: record.forwards,
        modelCostUSD: record.modelCostUSD.toFixed(4),
        commissionUSD: record.commissionUSD.toFixed(4),
        totalRevenue: (record.modelCostUSD + record.commissionUSD).toFixed(4),
        commissionRate: record.modelCostUSD > 0 
          ? ((record.commissionUSD / record.modelCostUSD) * 100).toFixed(2)
          : '0.00',
        tokensTotal: record.tokensTotal,
        co2eKg: record.co2eKg.toFixed(6),
      }));

      const csvContent = [
        Object.keys(commissionData[0]).join(','),
        ...commissionData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-data-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Commission Revenue</h2>
          <div className="flex items-center gap-4">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-3 py-1 bg-dark-surface border border-dark-border rounded text-sm"
            >
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="last7">Last 7 Days</option>
              <option value="lastRun">Last Run Only</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredRecords.length === 0}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
        <p className="text-gray-400 mb-6">
          Track router commission fees and revenue breakdown. Commission data is hidden from Capture view.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-green-400">${formatCurrency(metrics.totalCommission)}</div>
          <div className="text-sm text-gray-300">Total Commission</div>
          <div className="text-xs text-gray-500 mt-1">{timePeriod === 'all' ? 'All time' : 'Selected period'}</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-blue-400">${formatCurrency(metrics.totalRevenue)}</div>
          <div className="text-sm text-gray-300">Total Revenue</div>
          <div className="text-xs text-gray-500 mt-1">Model costs + commission</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-purple-400">
            {metrics.avgCommissionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-300">Commission Rate</div>
          <div className="text-xs text-gray-500 mt-1">Avg across runs</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-yellow-400">{metrics.recordCount.toLocaleString()}</div>
          <div className="text-sm text-gray-300">Runs</div>
          <div className="text-xs text-gray-500 mt-1">In selected period</div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-orange-400">{metrics.totalRequests.toLocaleString()}</div>
          <div className="text-sm text-gray-300">Requests</div>
          <div className="text-xs text-gray-500 mt-1">Total processed</div>
        </div>
      </div>

      {/* Commission Rate Effectiveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Commission Rate Effectiveness</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Configuration Rate:</span>
              <span className="font-medium">{formatPercent(config.routers.filter(r => r.enabled).reduce((sum, r) => sum + r.feePct, 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Actual Average Rate:</span>
              <span className="font-medium">{metrics.avgCommissionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Commission per Request:</span>
              <span className="font-medium">
                ${metrics.totalRequests > 0 ? formatCurrency(metrics.totalCommission / metrics.totalRequests) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Revenue per Request:</span>
              <span className="font-medium">
                ${metrics.totalRequests > 0 ? formatCurrency(metrics.totalRevenue / metrics.totalRequests) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Performance Indicators</h3>
          <div className="space-y-3">
            {metrics.recordCount > 1 && (() => {
              const latest = filteredRecords[0];
              const previous = filteredRecords[1];
              const commissionGrowth = previous?.commissionUSD > 0 
                ? ((latest?.commissionUSD - previous.commissionUSD) / previous.commissionUSD) * 100
                : 0;
              const requestGrowth = previous?.forwards > 0
                ? ((latest?.forwards - previous.forwards) / previous.forwards) * 100
                : 0;

              return (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Commission Growth:</span>
                    <span className={`font-medium ${commissionGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {commissionGrowth >= 0 ? '+' : ''}{commissionGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Request Volume Growth:</span>
                    <span className={`font-medium ${requestGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {requestGrowth >= 0 ? '+' : ''}{requestGrowth.toFixed(1)}%
                    </span>
                  </div>
                </>
              );
            })()}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Routers:</span>
              <span className="font-medium">{config.routers.filter(r => r.enabled).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Run Duration:</span>
              <span className="font-medium">
                {metrics.recordCount > 0 
                  ? (filteredRecords.reduce((sum, r) => sum + r.durationSeconds, 0) / metrics.recordCount).toFixed(1)
                  : '0.0'}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Commission History</h3>
        
        {filteredRecords.length === 0 ? (
          <p className="text-gray-500 italic">
            No commission data available for {timePeriod === 'all' ? 'any time period' : 'the selected time period'}. 
            Run some simulations to see revenue breakdown.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-2">Run Date</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Model Cost</th>
                  <th className="pb-2">Commission</th>
                  <th className="pb-2">Total Revenue</th>
                  <th className="pb-2">Commission %</th>
                  <th className="pb-2">RPS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const commissionRate = record.modelCostUSD > 0 
                    ? (record.commissionUSD / record.modelCostUSD) * 100 
                    : 0;
                  const rps = record.durationSeconds > 0 ? record.forwards / record.durationSeconds : 0;
                  
                  return (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-dark-bg' : ''}>
                      <td className="py-2 text-sm">
                        {new Date(record.startedAt).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(record.startedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-2 text-sm">{record.durationSeconds}s</td>
                      <td className="py-2 text-sm">{record.forwards.toLocaleString()}</td>
                      <td className="py-2 text-sm">${formatCurrency(record.modelCostUSD)}</td>
                      <td className="py-2 text-sm text-green-400">${formatCurrency(record.commissionUSD)}</td>
                      <td className="py-2 text-sm font-medium">${formatCurrency(record.modelCostUSD + record.commissionUSD)}</td>
                      <td className="py-2 text-sm">{commissionRate.toFixed(1)}%</td>
                      <td className="py-2 text-sm text-gray-400">{rps.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Router Performance */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Router Commission Breakdown</h3>
        <p className="text-gray-400 text-sm mb-4">
          Commission earnings and traffic distribution by individual router.
        </p>
        
        {routerAnalysis.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No router data available</p>
            <p className="text-sm text-gray-600">
              Router-specific metrics will appear here after running simulations with router layers enabled.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {routerAnalysis.map((routerData) => {
                const percentage = metrics.totalCommission > 0 
                  ? (routerData.commissionUSD / metrics.totalCommission) * 100 
                  : 0;
                const avgCommissionPerTraversal = routerData.traversals > 0
                  ? routerData.commissionUSD / routerData.traversals
                  : 0;

                return (
                  <div key={routerData.name} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-300">{routerData.name}</div>
                      <div className={`w-2 h-2 rounded-full ${
                        routerData.router.enabled ? 'bg-green-400' : 'bg-red-400'
                      }`} title={routerData.router.enabled ? 'Enabled' : 'Disabled'} />
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          ${formatCurrency(routerData.commissionUSD)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of total commission
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Traversals:</span>
                          <span>{routerData.traversals.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Fee rate:</span>
                          <span>{formatPercent(routerData.router.feePct)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Avg/traversal:</span>
                          <span>${formatCurrency(avgCommissionPerTraversal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Router comparison chart */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Router Performance Comparison</h4>
              <div className="space-y-3">
                {routerAnalysis.map((routerData) => {
                  const maxCommission = Math.max(...routerAnalysis.map(r => r.commissionUSD));
                  const percentage = maxCommission > 0 ? (routerData.commissionUSD / maxCommission) * 100 : 0;
                  
                  return (
                    <div key={routerData.name} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-300 flex-shrink-0">
                        {routerData.name}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-400 text-right flex-shrink-0">
                        ${formatCurrency(routerData.commissionUSD)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
