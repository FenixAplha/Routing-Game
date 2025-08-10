// routes/admin/RunSetup.tsx
import React from 'react';
import { useConfigStore } from '../../store/configStore';

export const RunSetup: React.FC = () => {
  const {
    config,
    setUniversalUserName,
    setTotalUsers,
    setRouterLayers,
    setCaptureSeconds,
    addRouter,
    updateRouter,
    deleteRouter,
    updateGroup,
    addProfile,
    isDirty,
    validateCommissionCap,
    getTotalCommissionRate,
  } = useConfigStore();

  const totalCommissionRate = getTotalCommissionRate();
  const isCommissionValid = validateCommissionCap();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Run Setup</h2>
        <p className="text-gray-400 mb-6">
          Configure the basic parameters for your routing simulation.
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Global Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Universal User Name
            </label>
            <input
              type="text"
              value={config.universalUserName}
              onChange={(e) => setUniversalUserName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Researchers"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used throughout the interface to refer to all users
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Users
            </label>
            <input
              type="number"
              value={config.totalUsers}
              onChange={(e) => setTotalUsers(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="1000"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically grouped into batches of ≤10 users each
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Router Layers
            </label>
            <input
              type="number"
              value={config.routerLayers}
              onChange={(e) => setRouterLayers(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              max="5"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = direct user-to-model connections
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capture Duration (seconds)
            </label>
            <input
              type="number"
              value={config.captureSeconds}
              onChange={(e) => setCaptureSeconds(Math.max(1, parseInt(e.target.value) || 10))}
              min="1"
              max="300"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              How long to run the simulation
            </p>
          </div>
        </div>
      </div>

      {/* Router Configuration */}
      {config.routerLayers > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Router Configuration</h3>
            <div className={`text-sm px-2 py-1 rounded ${
              isCommissionValid ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              Total Commission: {(totalCommissionRate * 100).toFixed(1)}%
              {!isCommissionValid && ' (Exceeds 95% cap!)'}
            </div>
          </div>

          {Array.from({ length: config.routerLayers }, (_, layer) => {
            const layerRouters = config.routers.filter(r => r.layer === layer);
            
            return (
              <div key={layer} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-300">Layer {layer + 1}</h4>
                  <button
                    onClick={() => addRouter(layer)}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
                  >
                    Add Router
                  </button>
                </div>
                
                {layerRouters.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No routers in this layer</p>
                ) : (
                  <div className="space-y-3">
                    {layerRouters.map((router) => (
                      <div key={router.id} className="flex items-center gap-3 p-3 bg-dark-bg rounded border border-dark-border">
                        <input
                          type="checkbox"
                          checked={router.enabled}
                          onChange={(e) => updateRouter(router.id, { enabled: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        
                        <input
                          type="text"
                          value={router.name}
                          onChange={(e) => updateRouter(router.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 bg-transparent border-none text-dark-text focus:ring-0"
                          placeholder="Router name"
                        />
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={(router.feePct * 100).toFixed(1)}
                            onChange={(e) => updateRouter(router.id, { feePct: parseFloat(e.target.value) / 100 || 0 })}
                            min="0"
                            max="50"
                            step="0.1"
                            className="w-16 px-2 py-1 bg-dark-bg border border-dark-border rounded text-center text-sm"
                          />
                          <span className="text-sm text-gray-400">%</span>
                        </div>
                        
                        <button
                          onClick={() => deleteRouter(router.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          title="Delete router"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* User Groups */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">User Groups</h3>
        <p className="text-gray-400 text-sm mb-4">
          Users are automatically grouped into batches of ≤10. Assign profiles to control behavior.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.groups.map((group) => {
            const profile = config.profiles.find(p => p.id === group.profileId);
            
            return (
              <div key={group.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={group.label}
                    onChange={(e) => updateGroup(group.id, { label: e.target.value })}
                    className="font-medium bg-transparent border-none text-dark-text focus:ring-0 flex-1"
                  />
                  <span className="text-sm text-gray-400">{group.size} users</span>
                </div>
                
                <select
                  value={group.profileId}
                  onChange={(e) => updateGroup(group.id, { profileId: e.target.value })}
                  className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                >
                  {config.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                
                {profile && (
                  <div className="mt-2 text-xs text-gray-500">
                    {profile.avgReqsPerUserPerSec} req/user/sec • {profile.distribution}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      {isDirty && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <p className="text-yellow-200">
            ⚠️ Configuration has unsaved changes. Changes will take effect when you rebuild the graph.
          </p>
        </div>
      )}
    </div>
  );
};
