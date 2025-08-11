// components/CanvasViz.tsx
import React, { useEffect, useRef, useState } from 'react';
import { VizEngine, fitCanvas } from '../engine/viz';
import { UnifiedVizEngine } from '../engine/unified-viz';
import { UnifiedVizEngineAdapter } from '../engine/unified-adapter';
import { buildGraph } from '../engine/graph';
import { SimulationEngine } from '../engine/simulation';
import { createSeededRandom } from '../engine/rng';
import { useConfigStore } from '../store/configStore';
import { useRuntimeStore } from '../store/runtimeStore';

interface CanvasVizProps {
  className?: string;
}

export const CanvasViz: React.FC<CanvasVizProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const unifiedVizEngineRef = useRef<UnifiedVizEngine | null>(null);
  const simulationEngineRef = useRef<SimulationEngine | null>(null);
  
  const { config, lastScatterSeed } = useConfigStore();
  const { setSimulationState } = useRuntimeStore();
  
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const unifiedAdapterRef = useRef<UnifiedVizEngineAdapter | null>(null);

  // Initialize unified visualization engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    fitCanvas(canvas, 16/9);
    
    // Always use unified visualization engine
    unifiedVizEngineRef.current = new UnifiedVizEngine(canvas);
    unifiedAdapterRef.current = new UnifiedVizEngineAdapter(unifiedVizEngineRef.current);
    
    return () => {
      if (unifiedVizEngineRef.current) {
        unifiedVizEngineRef.current.stop();
      }
      if (unifiedAdapterRef.current) {
        unifiedAdapterRef.current.stop();
      }
    };
  }, []);

  // Build graph when config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const unifiedVizEngine = unifiedVizEngineRef.current;
    
    if (!canvas || !unifiedVizEngine) return;

    // Create RNG with config seed
    const rng = createSeededRandom(config.seed);
    
    // Build graph
    const graph = buildGraph(
      config,
      canvas.width,
      canvas.height,
      rng,
      true, // Keep scatter for consistency
      lastScatterSeed
    );
    
    // Use unified visualization engine
    unifiedVizEngine.clear();
    unifiedVizEngine.setupNodes(graph);
    
    // Create simulation engine with unified adapter
    simulationEngineRef.current = new SimulationEngine(config, unifiedAdapterRef.current as any, graph);
    
    // Start build with callback to transition simulation state
    unifiedVizEngine.startBuild(() => {
      if (simulationEngineRef.current) {
        simulationEngineRef.current.setIdle();
      }
    });
    
    // Update stats
    setStats({
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    });
    
    // Set up simulation state monitoring
    const monitorSimulation = () => {
      if (simulationEngineRef.current) {
        setSimulationState(simulationEngineRef.current.state);
      }
      // Continue monitoring while component is mounted
      requestAnimationFrame(monitorSimulation);
    };
    
    // Start monitoring after a brief delay to ensure engine is ready
    const timeoutId = setTimeout(() => {
      monitorSimulation();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
    
  }, [config, lastScatterSeed, setSimulationState]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const unifiedVizEngine = unifiedVizEngineRef.current;
      
      if (!canvas || !unifiedVizEngine) return;
      
      fitCanvas(canvas, 16/9);
      
      unifiedVizEngine.resize(canvas.width, canvas.height);
      
      // Rebuild graph with new dimensions
      const rng = createSeededRandom(config.seed);
      const graph = buildGraph(
        config,
        canvas.width,
        canvas.height,
        rng,
        true,
        lastScatterSeed
      );
      
      unifiedVizEngine.setupNodes(graph);
      
      if (simulationEngineRef.current) {
        simulationEngineRef.current.updateConfig(config);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config, lastScatterSeed]);

  // Expose simulation controls
  useEffect(() => {
    // Make simulation engine available globally for controls
    (window as any).__simulationEngine = simulationEngineRef.current;
    
    // Also expose unified viz engine for signal count checks
    (window as any).__vizEngine = unifiedVizEngineRef.current;
  }, []);

  // Update global references when engines change
  useEffect(() => {
    (window as any).__simulationEngine = simulationEngineRef.current;
    (window as any).__vizEngine = unifiedVizEngineRef.current;
    (window as any).__unifiedVizEngine = unifiedVizEngineRef.current;
  }, [simulationEngineRef.current, unifiedVizEngineRef.current]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Canvas Container */}
      <div 
        id="cwrap" 
        className="border border-dark-border rounded-xl overflow-hidden bg-dark-bg relative"
      >
        <canvas 
          ref={canvasRef}
          className="block w-full h-auto"
        />
        
        {/* HUD - Stats Display */}
        <div className="absolute top-3 right-3 text-xs opacity-90 bg-dark-surface/75 border border-dark-border px-2 py-1.5 rounded backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span>Nodes: {stats.nodes} • Edges: {stats.edges}</span>
            <div className="px-2 py-1 rounded text-[10px] font-medium bg-purple-600 text-white">
              ✨ Unified
            </div>
          </div>
        </div>
        
        {/* Enhanced Legend */}
        <div className="absolute bottom-3 left-3 text-xs opacity-90 bg-dark-surface/75 border border-dark-border px-3 py-2 rounded backdrop-blur-sm">
          <div className="mb-2 text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
            ✨ Unified Layout
          </div>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm"></span>
              <span className="text-cyan-200">Users (Left)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-500 shadow-sm animate-pulse"></span>
              <span className="text-violet-200">Router (Center)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
              <span className="text-green-200">Models (Right)</span>
            </span>
          </div>
          <div className="mt-2 text-[10px] text-gray-400">
            💡 Drag nodes • Click to pin • Scroll to zoom • Radial visuals with grid positioning
          </div>
        </div>
      </div>
    </div>
  );
};
