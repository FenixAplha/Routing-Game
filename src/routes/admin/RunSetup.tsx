// routes/admin/RunSetup.tsx
import React, { useState } from 'react';
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
    addModel,
    updateModel,
    deleteModel,
    addProfile,
    updateProfile,
    deleteProfile,
    updateGroup,
    isDirty,
    validateCommissionCap,
    getTotalCommissionRate,
  } = useConfigStore();

  const [userNameError, setUserNameError] = useState('');
  const [modelErrors, setModelErrors] = useState<Record<string, string>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const totalCommissionRate = getTotalCommissionRate();
  const isCommissionValid = validateCommissionCap();

  // Validation functions
  const validateUserName = (name: string) => {
    if (!name.trim()) {
      setUserNameError('User name is required');
      return false;
    }
    if (name.length > 50) {
      setUserNameError('User name must be 50 characters or less');
      return false;
    }
    setUserNameError('');
    return true;
  };

  const validateModel = (id: string, field: string, value: any) => {
    const errors = { ...modelErrors };
    const key = `${id}-${field}`;
    
    if (field === 'name' && !value.trim()) {
      errors[key] = 'Model name is required';
    } else if (field === 'pricePer1kTokensUSD' && (value <= 0 || isNaN(value))) {
      errors[key] = 'Price must be a positive number';
    } else if (field === 'energyPerTokenWh' && (value < 0 || isNaN(value))) {
      errors[key] = 'Energy must be a non-negative number';
    } else if (field === 'weight' && (value <= 0 || isNaN(value))) {
      errors[key] = 'Weight must be a positive number';
    } else {
      delete errors[key];
    }
    
    setModelErrors(errors);
    return !errors[key];
  };

  const validateProfile = (id: string, field: string, value: any) => {
    const errors = { ...profileErrors };
    const key = `${id}-${field}`;
    
    if (field === 'name' && !value.trim()) {
      errors[key] = 'Profile name is required';
    } else if (field === 'avgReqsPerUserPerSec' && (value <= 0 || isNaN(value))) {
      errors[key] = 'Request rate must be positive';
    } else if (field === 'promptTokenMean' && (value <= 0 || isNaN(value))) {
      errors[key] = 'Prompt tokens must be positive';
    } else if (field === 'completionTokenMean' && (value <= 0 || isNaN(value))) {
      errors[key] = 'Completion tokens must be positive';
    } else {
      delete errors[key];
    }
    
    setProfileErrors(errors);
    return !errors[key];
  };

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
              onChange={(e) => {
                const value = e.target.value;
                setUniversalUserName(value);
                validateUserName(value);
              }}
              className={`w-full px-3 py-2 bg-dark-bg border rounded-lg text-dark-text focus:ring-2 focus:border-transparent ${
                userNameError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-dark-border focus:ring-primary-500'
              }`}
              placeholder="e.g., Researchers"
            />
            {userNameError && (
              <p className="text-xs text-red-400 mt-1">{userNameError}</p>
            )}
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

      {/* Model Management */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Model Management</h3>
          <button
            onClick={addModel}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
          >
            Add Model
          </button>
        </div>
        
        <div className="space-y-4">
          {config.models.map((model) => (
            <div key={model.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={model.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateModel(model.id, { name: value });
                      validateModel(model.id, 'name', value);
                    }}
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      modelErrors[`${model.id}-name`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {modelErrors[`${model.id}-name`] && (
                    <p className="text-xs text-red-400 mt-1">{modelErrors[`${model.id}-name`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Price/1k Tokens ($)
                    <span className="text-yellow-400 ml-1" title="Required: Must be positive">*</span>
                  </label>
                  <input
                    type="number"
                    value={model.pricePer1kTokensUSD}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateModel(model.id, { pricePer1kTokensUSD: value });
                      validateModel(model.id, 'pricePer1kTokensUSD', value);
                    }}
                    step="0.01"
                    min="0"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      modelErrors[`${model.id}-pricePer1kTokensUSD`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {modelErrors[`${model.id}-pricePer1kTokensUSD`] && (
                    <p className="text-xs text-red-400 mt-1">{modelErrors[`${model.id}-pricePer1kTokensUSD`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Energy/Token (Wh)
                    <span className="text-gray-500 ml-1" title="Optional: Energy consumption per token">?</span>
                  </label>
                  <input
                    type="number"
                    value={model.energyPerTokenWh || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateModel(model.id, { energyPerTokenWh: value });
                      validateModel(model.id, 'energyPerTokenWh', value);
                    }}
                    step="0.001"
                    min="0"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      modelErrors[`${model.id}-energyPerTokenWh`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {modelErrors[`${model.id}-energyPerTokenWh`] && (
                    <p className="text-xs text-red-400 mt-1">{modelErrors[`${model.id}-energyPerTokenWh`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Weight
                    <span className="text-gray-500 ml-1" title="Selection probability weight">?</span>
                  </label>
                  <input
                    type="number"
                    value={model.weight || 1}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateModel(model.id, { weight: value });
                      validateModel(model.id, 'weight', value);
                    }}
                    step="0.1"
                    min="0.1"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      modelErrors[`${model.id}-weight`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {modelErrors[`${model.id}-weight`] && (
                    <p className="text-xs text-red-400 mt-1">{modelErrors[`${model.id}-weight`]}</p>
                  )}
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => deleteModel(model.id)}
                    disabled={config.models.length <= 1}
                    className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                    title={config.models.length <= 1 ? "Cannot delete last model" : "Delete model"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Management */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Profile Management</h3>
          <button
            onClick={addProfile}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
          >
            Add Profile
          </button>
        </div>
        
        <div className="space-y-4">
          {config.profiles.map((profile) => (
            <div key={profile.id} className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateProfile(profile.id, { name: value });
                      validateProfile(profile.id, 'name', value);
                    }}
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      profileErrors[`${profile.id}-name`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {profileErrors[`${profile.id}-name`] && (
                    <p className="text-xs text-red-400 mt-1">{profileErrors[`${profile.id}-name`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Req/User/Sec
                    <span className="text-yellow-400 ml-1" title="Average requests per user per second">*</span>
                  </label>
                  <input
                    type="number"
                    value={profile.avgReqsPerUserPerSec}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateProfile(profile.id, { avgReqsPerUserPerSec: value });
                      validateProfile(profile.id, 'avgReqsPerUserPerSec', value);
                    }}
                    step="0.01"
                    min="0"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      profileErrors[`${profile.id}-avgReqsPerUserPerSec`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {profileErrors[`${profile.id}-avgReqsPerUserPerSec`] && (
                    <p className="text-xs text-red-400 mt-1">{profileErrors[`${profile.id}-avgReqsPerUserPerSec`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Distribution</label>
                  <select
                    value={profile.distribution}
                    onChange={(e) => updateProfile(profile.id, { 
                      distribution: e.target.value as 'poisson' | 'bounded-normal' | 'fixed' | 'custom'
                    })}
                    className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm"
                  >
                    <option value="poisson">Poisson</option>
                    <option value="bounded-normal">Bounded Normal</option>
                    <option value="fixed">Fixed</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Prompt Tokens
                    <span className="text-yellow-400 ml-1" title="Average tokens in prompts">*</span>
                  </label>
                  <input
                    type="number"
                    value={profile.promptTokenMean}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      updateProfile(profile.id, { promptTokenMean: value });
                      validateProfile(profile.id, 'promptTokenMean', value);
                    }}
                    min="1"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      profileErrors[`${profile.id}-promptTokenMean`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {profileErrors[`${profile.id}-promptTokenMean`] && (
                    <p className="text-xs text-red-400 mt-1">{profileErrors[`${profile.id}-promptTokenMean`]}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Completion Tokens
                    <span className="text-yellow-400 ml-1" title="Average tokens in completions">*</span>
                  </label>
                  <input
                    type="number"
                    value={profile.completionTokenMean}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      updateProfile(profile.id, { completionTokenMean: value });
                      validateProfile(profile.id, 'completionTokenMean', value);
                    }}
                    min="1"
                    className={`w-full px-2 py-1 bg-dark-surface border rounded text-sm ${
                      profileErrors[`${profile.id}-completionTokenMean`] 
                        ? 'border-red-500' 
                        : 'border-dark-border'
                    }`}
                  />
                  {profileErrors[`${profile.id}-completionTokenMean`] && (
                    <p className="text-xs text-red-400 mt-1">{profileErrors[`${profile.id}-completionTokenMean`]}</p>
                  )}
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    disabled={config.profiles.length <= 1}
                    className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                    title={config.profiles.length <= 1 ? "Cannot delete last profile" : "Delete profile"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
