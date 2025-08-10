// routes/admin/PricingTokens.tsx
import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency, formatPercent } from '../../calc/pricing';

export const PricingTokens: React.FC = () => {
  const {
    config,
    addModel,
    updateModel,
    deleteModel,
    updateRouter,
    getTotalCommissionRate,
    validateCommissionCap,
  } = useConfigStore();

  const totalCommissionRate = getTotalCommissionRate();
  const isCommissionValid = validateCommissionCap();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Pricing & Tokens</h2>
        <p className="text-gray-400 mb-6">
          Configure model pricing, tokenization rules, and router commission fees.
        </p>
      </div>

      {/* Models Table */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Models</h3>
          <button
            onClick={addModel}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Add Model
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Price per 1K Tokens (USD)</th>
                <th>Min Billable Tokens</th>
                <th>Energy per Token (Wh)</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {config.models.map((model) => (
                <tr key={model.id}>
                  <td>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => updateModel(model.id, { name: e.target.value })}
                      className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.pricePer1kTokensUSD}
                      onChange={(e) => updateModel(model.id, { pricePer1kTokensUSD: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.minBillableTokens || ''}
                      onChange={(e) => updateModel(model.id, { minBillableTokens: parseInt(e.target.value) || undefined })}
                      min="0"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                      placeholder="None"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.energyPerTokenWh || ''}
                      onChange={(e) => updateModel(model.id, { energyPerTokenWh: parseFloat(e.target.value) || undefined })}
                      min="0"
                      step="0.001"
                      className="w-20 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                      placeholder="0.1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={model.weight || 1}
                      onChange={(e) => updateModel(model.id, { weight: parseFloat(e.target.value) || 1 })}
                      min="0"
                      step="0.1"
                      className="w-16 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => deleteModel(model.id)}
                      disabled={config.models.length <= 1}
                      className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Router Commission */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Router Commission Fees</h3>
          <div className={`text-sm px-3 py-1 rounded-lg ${
            isCommissionValid ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            Total: {formatPercent(totalCommissionRate)}
            {!isCommissionValid && ' (Exceeds 95% cap!)'}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Router fees are additive on top of model costs. Each router in the path adds its fee percentage.
        </p>

        {config.routers.length === 0 ? (
          <p className="text-gray-500 italic">No routers configured. Add router layers in Run Setup.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.routers.map((router) => (
              <div key={router.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{router.name}</span>
                  <span className="text-sm text-gray-400">Layer {router.layer + 1}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={(router.feePct * 100).toFixed(1)}
                    onChange={(e) => updateRouter(router.id, { feePct: parseFloat(e.target.value) / 100 || 0 })}
                    min="0"
                    max="50"
                    step="0.1"
                    className="flex-1 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {router.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isCommissionValid && (
          <div className="mt-4 bg-red-900 border border-red-600 rounded-lg p-4">
            <p className="text-red-200 text-sm">
              ⚠️ Total commission rate exceeds the 95% cap. Please reduce router fees.
            </p>
          </div>
        )}
      </div>

      {/* Pricing Examples */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Pricing Examples</h3>
        <p className="text-gray-400 text-sm mb-4">
          Sample costs for different token amounts with current configuration.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[100, 1000, 5000].map((tokens) => (
            <div key={tokens} className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="font-medium mb-2">{tokens.toLocaleString()} tokens</div>
              
              {config.models.map((model) => {
                const baseCost = tokens * (model.pricePer1kTokensUSD / 1000);
                const commission = baseCost * totalCommissionRate;
                const total = baseCost + commission;
                
                return (
                  <div key={model.id} className="text-sm mb-2 last:mb-0">
                    <div className="text-gray-300">{model.name}:</div>
                    <div className="text-gray-400">
                      Base: ${formatCurrency(baseCost)}
                      {commission > 0 && (
                        <span> + Commission: ${formatCurrency(commission)}</span>
                      )}
                    </div>
                    <div className="font-medium">Total: ${formatCurrency(total)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
