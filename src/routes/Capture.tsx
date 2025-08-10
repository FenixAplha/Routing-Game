// routes/Capture.tsx
import React, { useState } from 'react';
import { CanvasViz } from '../components/CanvasViz';
import { MiniCounters } from '../components/MiniCounters';
import { useRuntimeStore } from '../store/runtimeStore';
import { useConfigStore } from '../store/configStore';

export const Capture: React.FC = () => {
  const { 
    simulationState, 
    isRunning, 
    startRun, 
    stopRun, 
    completeRun,
    getProgress 
  } = useRuntimeStore();
  
  const { config, randomizeSeed } = useConfigStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleRunClick = async () => {
    if (isRunning) {
      stopRun();
      
      // Stop the simulation engine
      const simEngine = (window as any).__simulationEngine;
      if (simEngine) {
        simEngine.stop();
      }
      return;
    }

    const runId = `run_${Date.now()}`;
    startRun(runId);

    // Start the simulation engine
    const simEngine = (window as any).__simulationEngine;
    if (simEngine) {
      simEngine.start();
      
      // Monitor completion
      const checkCompletion = () => {
        if (simEngine.isComplete()) {
          const record = simEngine.finalize(
            runId,
            new Date().toISOString(),
            new Date().toISOString()
          );
          completeRun(record);
        } else if (simulationState.phase !== 'done') {
          requestAnimationFrame(checkCompletion);
        }
      };
      requestAnimationFrame(checkCompletion);
    } else {
      console.warn('Simulation engine not available');
      stopRun();
    }
  };

  const handleRebuild = () => {
    // Force graph rebuild by updating seed
    randomizeSeed();
    
    // Reset simulation if running
    if (isRunning) {
      stopRun();
    }
  };

  const handleRescatter = () => {
    // This will trigger a rescatter by updating the scatter seed
    const event = new CustomEvent('rescatter');
    window.dispatchEvent(event);
  };

  const progress = getProgress();
  const isRunDisabled = simulationState.phase === 'building';

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Routing Visualization</h1>
          <p className="text-gray-400">
            {config.universalUserName} • {config.totalUsers} users • {config.routerLayers} router layers • {config.models.length} models
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handleRunClick}
            disabled={isRunDisabled}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : isRunDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? 'Stop' : `Run ${config.captureSeconds}s`}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            ⚙️
          </button>

          {showSettings && (
            <div className="flex gap-2">
              <button
                onClick={handleRebuild}
                className="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-gray-700 transition-colors text-sm"
              >
                Rebuild
              </button>
              <button
                onClick={handleRescatter}
                className="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-gray-700 transition-colors text-sm"
              >
                Re-scatter
              </button>
            </div>
          )}

          {/* Phase Badge */}
          <div className="ml-auto text-sm text-gray-400">
            Phase: <span className="text-dark-text font-semibold">{simulationState.phase}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {(simulationState.phase === 'running' || simulationState.phase === 'drain') && (
          <div className="mb-4">
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-violet-500 transition-all duration-200 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {simulationState.phase === 'running' ? 'Capturing...' : 'Draining in-flight requests...'}
            </div>
          </div>
        )}

        {/* Visualization */}
        <div className="mb-6">
          <CanvasViz />
        </div>

        {/* Mini Counters */}
        <MiniCounters />

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-500">
          This is the Capture interface for recording. 
          Commission and detailed analytics are available in the Admin panel.
        </div>
      </div>
    </div>
  );
};
