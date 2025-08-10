// routes/admin/Advanced.tsx
import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { useRuntimeStore } from '../../store/runtimeStore';

export const Advanced: React.FC = () => {
  const { config, setSeed, randomizeSeed } = useConfigStore();
  const { simulationState } = useRuntimeStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Advanced Settings</h2>
        <p className="text-gray-400 mb-6">
          Fine-tune simulation parameters, debugging options, and performance settings.
        </p>
      </div>

      {/* Simulation Control */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Simulation Control</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Random Seed
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={config.seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={randomizeSeed}
                className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                🎲
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Controls random number generation for reproducible results
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Concurrent Signals
            </label>
            <input
              type="number"
              value={simulationState.maxConcurrent}
              min="1"
              max="200"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of animated signals (auto-tuned for performance)
            </p>
          </div>
        </div>
      </div>

      {/* Performance Monitoring */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Performance Monitoring</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-400">60</div>
            <div className="text-sm text-gray-300">Target FPS</div>
            <div className="text-xs text-gray-500 mt-1">Canvas rendering</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-400">{simulationState.maxConcurrent}</div>
            <div className="text-sm text-gray-300">Signal Limit</div>
            <div className="text-xs text-gray-500 mt-1">Current setting</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-400">
              {simulationState.phase === 'running' ? 'Active' : 'Idle'}
            </div>
            <div className="text-sm text-gray-300">Engine State</div>
            <div className="text-xs text-gray-500 mt-1">Current status</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-yellow-400">Local</div>
            <div className="text-sm text-gray-300">Data Storage</div>
            <div className="text-xs text-gray-500 mt-1">IndexedDB</div>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Debug Information</h3>
        
        <div className="space-y-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium text-gray-300 mb-2">Current Simulation State</h4>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify({
                phase: simulationState.phase,
                time: simulationState.t.toFixed(2),
                duration: simulationState.duration,
                forwards: simulationState.forwards,
                returns: simulationState.returns,
                tokensTotal: simulationState.tokensTotal,
                maxConcurrent: simulationState.maxConcurrent,
              }, null, 2)}
            </pre>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium text-gray-300 mb-2">Configuration Summary</h4>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify({
                seed: config.seed,
                totalUsers: config.totalUsers,
                routerLayers: config.routerLayers,
                routersCount: config.routers.length,
                modelsCount: config.models.length,
                profilesCount: config.profiles.length,
                captureSeconds: config.captureSeconds,
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Experimental Features */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Experimental Features</h3>
        <p className="text-gray-400 text-sm mb-4">
          Future enhancements and experimental functionality.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">Latency Modeling</div>
              <div className="text-xs text-gray-500">Simulate realistic request latency based on hop count</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">Weighted Routing</div>
              <div className="text-xs text-gray-500">Route selection based on router and model weights</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">Real-time Analytics</div>
              <div className="text-xs text-gray-500">Live performance dashboards during simulation</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">User Agent:</span>
              <span className="text-gray-300 text-right text-xs">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Screen Resolution:</span>
              <span className="text-gray-300">{screen.width} × {screen.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Viewport:</span>
              <span className="text-gray-300">{window.innerWidth} × {window.innerHeight}</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Local Storage:</span>
              <span className="text-gray-300">Available</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">IndexedDB:</span>
              <span className="text-gray-300">Available</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Canvas 2D:</span>
              <span className="text-gray-300">Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
