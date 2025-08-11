// routes/Capture.tsx
import React, { useState, useCallback } from 'react';
import { CanvasViz } from '../components/CanvasViz';
import { MiniCounters } from '../components/MiniCounters';
import { useRuntimeStore } from '../store/runtimeStore';
import { useConfigStore } from '../store/configStore';
import { TrafficSimulationControls, TimeSimulationSettings } from '../components/visualizations/TrafficSimulationControls';

export const Capture: React.FC = () => {
  const { 
    simulationState, 
    isRunning, 
    startRun, 
    stopRun, 
    completeRun,
    getProgress 
  } = useRuntimeStore();
  
  const { config, randomizeSeed, setCaptureSeconds } = useConfigStore();
  const [showSettings, setShowSettings] = useState(false);
  
  // Enhanced traffic simulation state - ALWAYS show advanced controls
  const [timeSettings, setTimeSettings] = useState<TimeSimulationSettings>({
    simSpeedMultiplier: 60, // Default to 60x speed (1 min = 1 hour)
    timeRange: 'day',
    realTimeDuration: 60, // Default 60 seconds for better simulation
    paused: false,
    looping: false,
    currentProgress: 0
  });

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

  // Enhanced traffic simulation handlers
  const handleStartAdvancedSimulation = useCallback(() => {
    const timeRangeHours = {
      'hour': 1,
      'day': 24, 
      'week': 168,
      'month': 720,
      'quarter': 2160,
      'year': 8760
    }[timeSettings.timeRange];
    
    // Update config duration based on settings
    const durationSeconds = timeSettings.realTimeDuration;
    setCaptureSeconds(durationSeconds);
    
    // Start simulation with enhanced metrics
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
    }
    
    // Update progress tracking
    const progressInterval = setInterval(() => {
      const currentProgress = getProgress() * 100;
      setTimeSettings(prev => ({ ...prev, currentProgress }));
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        if (timeSettings.looping && !isRunning) {
          setTimeout(() => handleStartAdvancedSimulation(), 1000);
        }
      }
    }, 100);
  }, [timeSettings, getProgress, isRunning, setCaptureSeconds, startRun, completeRun, simulationState.phase]);
  
  const handlePauseAdvancedSimulation = useCallback(() => {
    // For now, just stop - could add pause functionality later
    stopRun();
  }, [stopRun]);
  
  const handleStopAdvancedSimulation = useCallback(() => {
    stopRun();
    setTimeSettings(prev => ({ ...prev, currentProgress: 0 }));
  }, [stopRun]);
  
  const handleResetAdvancedSimulation = useCallback(() => {
    stopRun();
    setTimeSettings(prev => ({ ...prev, currentProgress: 0 }));
    // Reset visualization
    handleRebuild();
  }, [stopRun, handleRebuild]);
  
  // Remove toggle function - we always use advanced controls now

  const progress = getProgress();
  const isRunDisabled = simulationState.phase === 'building';
  const isReadyToRun = simulationState.phase === 'idle' || simulationState.phase === 'done';

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

        {/* Traffic Simulation Controls - Always Visible */}
        <div className="mb-4 p-4 bg-dark-surface border border-dark-border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Traffic Simulation Controls</h3>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                ✨ Unified Layout with Full Controls
              </div>
            </div>
          </div>
          
          <TrafficSimulationControls
            settings={timeSettings}
            onSettingsChange={setTimeSettings}
            isRunning={isRunning}
            onStart={handleStartAdvancedSimulation}
            onPause={handlePauseAdvancedSimulation}
            onStop={handleStopAdvancedSimulation}
            onReset={handleResetAdvancedSimulation}
          />
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handleStartAdvancedSimulation}
            disabled={isRunDisabled}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : !isReadyToRun
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <span>⏹️</span>
                Stop Simulation
              </>
            ) : (
              <>
                <span>▶️</span>
                Run {timeSettings.timeRange.toUpperCase()} ({timeSettings.realTimeDuration}s at {timeSettings.simSpeedMultiplier}x speed)
              </>
            )}
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

          {/* Enhanced Status Badge */}
          <div className="ml-auto flex items-center gap-4 text-sm text-gray-400">
            <div className="bg-dark-surface/50 px-3 py-1 rounded-full border border-dark-border">
              Speed: <span className="text-blue-400 font-medium">{timeSettings.simSpeedMultiplier}x</span>
            </div>
            <div className="bg-dark-surface/50 px-3 py-1 rounded-full border border-dark-border">
              Range: <span className="text-green-400 font-medium">{timeSettings.timeRange}</span>
            </div>
            <div className="bg-dark-surface/50 px-3 py-1 rounded-full border border-dark-border">
              Phase: <span className="text-purple-400 font-semibold">{simulationState.phase}</span>
            </div>
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
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
              <span>
                {simulationState.phase === 'running' 
                  ? `Simulating ${timeSettings.timeRange} of traffic at ${timeSettings.simSpeedMultiplier}x speed...` 
                  : 'Draining in-flight requests...'}
              </span>
              <span className="text-blue-400">
                {Math.round(progress * 100)}% ({Math.round(timeSettings.currentProgress)}% sim)
              </span>
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
        <div className="mt-8 space-y-2">
          <div className="text-center text-xs text-gray-500">
            ✨ Unified Layout: Radial visual styling with classic grid positioning for optimal clarity
          </div>
          <div className="text-center text-xs text-gray-600">
            📈 Full traffic simulation controls • ⚡ Speed multipliers up to 525,600x • 🎨 Interactive visualization
          </div>
        </div>
      </div>
    </div>
  );
};
