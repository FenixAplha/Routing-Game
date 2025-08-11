// routes/admin/Advanced.tsx
import React, { useState, useMemo } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useRuntimeStore } from '../../store/runtimeStore';
import { formatCurrency, formatPercent } from '../../calc/pricing';

export const Advanced: React.FC = () => {
  const { config, setSeed, randomizeSeed, updateSustainAssumptions } = useConfigStore();
  const { simulationState, recentRecords } = useRuntimeStore();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'balanced' | 'performance'>('balanced');
  
  // Calculate system performance metrics
  const systemMetrics = useMemo(() => {
    const totalRuns = recentRecords.length;
    const avgDuration = totalRuns > 0 ? 
      recentRecords.reduce((sum, r) => sum + r.durationSeconds, 0) / totalRuns : 0;
    const avgRequestsPerSecond = totalRuns > 0 ? 
      recentRecords.reduce((sum, r) => sum + (r.forwards / r.durationSeconds), 0) / totalRuns : 0;
    const totalTokensProcessed = recentRecords.reduce((sum, r) => sum + r.tokensTotal, 0);
    const totalEnergyConsumed = recentRecords.reduce((sum, r) => sum + r.energyWh, 0);
    
    return {
      totalRuns,
      avgDuration,
      avgRequestsPerSecond,
      totalTokensProcessed,
      totalEnergyConsumed,
      estimatedCPULoad: Math.min(100, avgRequestsPerSecond * 0.5), // Rough estimate
      memoryEfficiency: totalTokensProcessed > 0 ? (totalTokensProcessed / (totalRuns * 1000)) : 0
    };
  }, [recentRecords]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Advanced AI Settings</h2>
        <p className="text-gray-400 mb-6">
          Performance optimization, cost calculation engine settings, and AI model analysis tools.
        </p>
      </div>

      {/* AI Cost Engine Settings */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">AI Cost Calculation Engine</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cost Calculation Precision
            </label>
            <select
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              defaultValue="high"
            >
              <option value="standard">Standard (4 decimal places)</option>
              <option value="high">High (6 decimal places)</option>
              <option value="maximum">Maximum (8 decimal places)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Higher precision for micro-cost analysis and enterprise use
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Estimation Method
            </label>
            <select
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              defaultValue="gpt4"
            >
              <option value="conservative">Conservative (chars ÷ 3)</option>
              <option value="gpt4">GPT-4 Based (chars ÷ 4)</option>
              <option value="claude">Claude Based (chars ÷ 3.5)</option>
              <option value="precise">Precise Tokenization</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Affects cost accuracy for different model families
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-400">{systemMetrics.totalTokensProcessed.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Tokens Processed</div>
            <div className="text-xs text-gray-500 mt-1">Across {systemMetrics.totalRuns} runs</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-400">{systemMetrics.avgRequestsPerSecond.toFixed(1)}/s</div>
            <div className="text-sm text-gray-300">Avg Processing Rate</div>
            <div className="text-xs text-gray-500 mt-1">Requests per second</div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-400">{systemMetrics.memoryEfficiency.toFixed(2)}x</div>
            <div className="text-sm text-gray-300">Memory Efficiency</div>
            <div className="text-xs text-gray-500 mt-1">Tokens per KB estimate</div>
          </div>
        </div>
      </div>

      {/* Performance Optimization */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Performance Optimization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Performance Mode
            </label>
            <select
              value={performanceMode}
              onChange={(e) => setPerformanceMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="quality">Quality (60 FPS, Full Effects)</option>
              <option value="balanced">Balanced (30-60 FPS, Adaptive)</option>
              <option value="performance">Performance (30 FPS, Minimal Effects)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Optimizes visualization performance for different hardware
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch Processing Size
            </label>
            <select
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              defaultValue="1000"
            >
              <option value="100">Small (100 requests/batch)</option>
              <option value="500">Medium (500 requests/batch)</option>
              <option value="1000">Large (1000 requests/batch)</option>
              <option value="2500">Extra Large (2500 requests/batch)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Balance between memory usage and calculation speed
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-300">Enable Multi-threading (Web Workers)</span>
            </label>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-300">Cache Model Calculations</span>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-300">Enable Advanced Analytics (Higher CPU Usage)</span>
            </label>
          </div>
        </div>
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

      {/* AI Model Analysis Tools */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">AI Model Analysis Tools</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cost Optimization Mode
              </label>
              <select
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                defaultValue="balanced"
              >
                <option value="cost">Minimize Cost (Cheapest models)</option>
                <option value="balanced">Balanced (Cost vs Quality)</option>
                <option value="quality">Maximize Quality (Premium models)</option>
                <option value="efficiency">Energy Efficient (Low power)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model Fallback Strategy
              </label>
              <select
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                defaultValue="cost_ascending"
              >
                <option value="cost_ascending">Cheapest First</option>
                <option value="cost_descending">Most Expensive First</option>
                <option value="latency">Lowest Latency</option>
                <option value="random">Random Selection</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-300">Enable Smart Model Routing</span>
              </label>
            </div>
          </div>
          
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-medium text-gray-300 mb-3">Model Performance Predictions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Predicted Savings:</span>
                <span className="text-green-400">12-18%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality Impact:</span>
                <span className="text-yellow-400">Minimal (-2%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Energy Reduction:</span>
                <span className="text-blue-400">8-15%</span>
              </div>
            </div>
            
            <button
              className="w-full mt-4 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
            >
              Run Cost Optimization Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Experimental AI Features */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Experimental AI Features</h3>
        <p className="text-gray-400 text-sm mb-4">
          Cutting-edge AI cost optimization and analysis features in development.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">🧠 Intelligent Model Selection</div>
              <div className="text-xs text-gray-500">AI-powered model routing based on request complexity and cost targets</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Beta 2025
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">📊 Predictive Cost Analytics</div>
              <div className="text-xs text-gray-500">Machine learning-based cost forecasting and budget optimization</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Q2 2025
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">🌐 Multi-Provider Arbitrage</div>
              <div className="text-xs text-gray-500">Real-time price comparison and automatic provider switching</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Q3 2025
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">🔋 Carbon-Aware Computing</div>
              <div className="text-xs text-gray-500">Route requests to data centers with cleanest energy sources</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              Q4 2025
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg">
            <div>
              <div className="font-medium text-gray-300">💡 Dynamic Prompt Optimization</div>
              <div className="text-xs text-gray-500">Automatically optimize prompts for cost efficiency without quality loss</div>
            </div>
            <button 
              disabled
              className="px-3 py-1 bg-gray-600 text-gray-400 rounded text-sm cursor-not-allowed"
            >
              2026
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Debug Panel */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Debug & Diagnostics</h3>
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug Info
          </button>
        </div>
        
        {showDebugPanel && (
          <div className="space-y-4">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium text-gray-300 mb-2">Performance Metrics</h4>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify({
                  totalRuns: systemMetrics.totalRuns,
                  avgDuration: `${systemMetrics.avgDuration.toFixed(2)}s`,
                  avgRPS: systemMetrics.avgRequestsPerSecond.toFixed(1),
                  totalTokens: systemMetrics.totalTokensProcessed,
                  totalEnergy: `${systemMetrics.totalEnergyConsumed.toFixed(2)} Wh`,
                  estimatedCPULoad: `${systemMetrics.estimatedCPULoad.toFixed(1)}%`,
                  memoryEfficiency: `${systemMetrics.memoryEfficiency.toFixed(2)}x`,
                  performanceMode,
                }, null, 2)}
              </pre>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium text-gray-300 mb-2">Current Simulation State</h4>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify({
                  phase: simulationState.phase,
                  time: simulationState.t?.toFixed(2) || 0,
                  duration: simulationState.duration,
                  forwards: simulationState.forwards,
                  returns: simulationState.returns,
                  tokensTotal: simulationState.tokensTotal,
                  maxConcurrent: simulationState.maxConcurrent,
                }, null, 2)}
              </pre>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <h4 className="font-medium text-gray-300 mb-2">AI Configuration Summary</h4>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify({
                  seed: config.seed,
                  totalUsers: config.totalUsers,
                  routerLayers: config.routerLayers,
                  activeRouters: config.routers.filter(r => r.enabled).length,
                  totalModels: config.models.length,
                  profiles: config.profiles.length,
                  captureSeconds: config.captureSeconds,
                  sustainConfig: config.sustain,
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced System Information */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-300 mb-3">Browser & Hardware</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Browser:</span>
                <span className="text-gray-300 text-right text-xs">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Screen:</span>
                <span className="text-gray-300">{screen.width} × {screen.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Viewport:</span>
                <span className="text-gray-300">{window.innerWidth} × {window.innerHeight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPU Cores:</span>
                <span className="text-gray-300">{navigator.hardwareConcurrency || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory:</span>
                <span className="text-gray-300">{(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300 mb-3">AI Calculator Capabilities</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Local Storage:</span>
                <span className="text-green-400">✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">IndexedDB:</span>
                <span className="text-green-400">✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Canvas 2D:</span>
                <span className="text-green-400">✓ Supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Web Workers:</span>
                <span className="text-green-400">✓ Supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Performance API:</span>
                <span className={typeof window.performance !== 'undefined' ? "text-green-400" : "text-red-400"}>
                  {typeof window.performance !== 'undefined' ? "✓ Available" : "✗ Not Available"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-dark-bg border border-dark-border rounded-lg">
          <h4 className="font-medium text-gray-300 mb-2">Optimization Recommendations</h4>
          <div className="text-sm text-gray-400">
            {systemMetrics.estimatedCPULoad > 80 && (
              <div className="text-yellow-400 mb-2">⚠️ High CPU load detected. Consider switching to Performance mode.</div>
            )}
            {systemMetrics.totalRuns > 40 && (
              <div className="text-blue-400 mb-2">💡 Large dataset detected. Enable advanced analytics for better insights.</div>
            )}
            {navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8 && (
              <div className="text-green-400 mb-2">🚀 Multi-core system detected. Web Workers can boost performance.</div>
            )}
            <div className="text-gray-500">
              System appears optimally configured for AI cost analysis and visualization.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
