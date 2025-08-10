// routes/admin/Commission.tsx
import React from 'react';
import { useRuntimeStore } from '../../store/runtimeStore';
import { formatCurrency } from '../../calc/pricing';

export const Commission: React.FC = () => {
  const { recentRecords } = useRuntimeStore();

  const totalCommission = recentRecords.reduce((sum, record) => sum + record.commissionUSD, 0);
  const totalRevenue = recentRecords.reduce((sum, record) => sum + record.modelCostUSD + record.commissionUSD, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Commission Revenue</h2>
        <p className="text-gray-400 mb-6">
          Track router commission fees and revenue breakdown. Commission data is hidden from Capture view.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-green-400">${formatCurrency(totalCommission)}</div>
          <div className="text-sm text-gray-300">Total Commission</div>
          <div className="text-xs text-gray-500 mt-1">Across all recorded runs</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-blue-400">${formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-300">Total Revenue</div>
          <div className="text-xs text-gray-500 mt-1">Model costs + commission</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-purple-400">
            {totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-sm text-gray-300">Commission Rate</div>
          <div className="text-xs text-gray-500 mt-1">Avg across all runs</div>
        </div>
        
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="text-2xl font-bold text-yellow-400">{recentRecords.length}</div>
          <div className="text-sm text-gray-300">Recorded Runs</div>
          <div className="text-xs text-gray-500 mt-1">With commission data</div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Commission History</h3>
        
        {recentRecords.length === 0 ? (
          <p className="text-gray-500 italic">No commission data available. Run some simulations to see revenue breakdown.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th>Run Date</th>
                  <th>Duration</th>
                  <th>Requests</th>
                  <th>Model Cost</th>
                  <th>Commission</th>
                  <th>Total Revenue</th>
                  <th>Commission %</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => {
                  const commissionRate = record.modelCostUSD > 0 
                    ? (record.commissionUSD / record.modelCostUSD) * 100 
                    : 0;
                  
                  return (
                    <tr key={record.id}>
                      <td>{new Date(record.startedAt).toLocaleDateString()}</td>
                      <td>{record.durationSeconds}s</td>
                      <td>{record.forwards.toLocaleString()}</td>
                      <td>${formatCurrency(record.modelCostUSD)}</td>
                      <td className="text-green-400">${formatCurrency(record.commissionUSD)}</td>
                      <td>${formatCurrency(record.modelCostUSD + record.commissionUSD)}</td>
                      <td>{commissionRate.toFixed(1)}%</td>
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
          Commission earnings by individual router (simulated data - actual implementation would track per-router metrics).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Router 1.1', 'Router 1.2', 'Router 2.1'].map((routerName, index) => (
            <div key={routerName} className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="font-medium text-gray-300 mb-2">{routerName}</div>
              <div className="text-lg font-bold text-green-400">
                ${formatCurrency(totalCommission * (0.3 + index * 0.1))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((0.3 + index * 0.1) * 100).toFixed(0)}% of total commission
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
