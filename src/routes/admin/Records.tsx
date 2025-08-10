// routes/admin/Records.tsx
import React, { useState } from 'react';
import { useRuntimeStore } from '../../store/runtimeStore';
import { formatCurrency } from '../../calc/pricing';

export const Records: React.FC = () => {
  const { 
    recentRecords, 
    clearRecords, 
    exportRecordsJSON, 
    exportRecordsCSV,
    loadRecentRecords 
  } = useRuntimeStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportRecordsJSON();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routing-viz-records-${new Date().toISOString().split('T')[0]}.json`;
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
      const data = await exportRecordsCSV();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routing-viz-records-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
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
        <h2 className="text-xl font-bold mb-4">Records</h2>
        <p className="text-gray-400 mb-6">
          View, export, and manage captured run records. Data is stored locally in your browser.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportJSON}
          disabled={isExporting || recentRecords.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export JSON'}
        </button>
        
        <button
          onClick={handleExportCSV}
          disabled={isExporting || recentRecords.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
        
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={recentRecords.length === 0}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Clear All Records
        </button>
        
        <button
          onClick={loadRecentRecords}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
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

      {/* Records Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Run History</h3>
        
        {recentRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No records found</div>
            <p className="text-gray-400 text-sm">
              Run some simulations in the Capture interface to see data here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Forwards</th>
                  <th>Returns</th>
                  <th>Tokens</th>
                  <th>Model Cost</th>
                  <th>Commission</th>
                  <th>Energy (Wh)</th>
                  <th>CO₂e (kg)</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-dark-bg">
                    <td>{new Date(record.startedAt).toLocaleDateString()}</td>
                    <td>{record.durationSeconds}s</td>
                    <td>{record.forwards.toLocaleString()}</td>
                    <td>{record.returns.toLocaleString()}</td>
                    <td>{record.tokensTotal.toLocaleString()}</td>
                    <td>${formatCurrency(record.modelCostUSD)}</td>
                    <td className="text-green-400">${formatCurrency(record.commissionUSD)}</td>
                    <td>{record.energyWh.toFixed(1)}</td>
                    <td>{record.co2eKg.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
