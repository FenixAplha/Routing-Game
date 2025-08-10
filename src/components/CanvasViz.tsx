// components/CanvasViz.tsx
import React, { useEffect, useRef, useState } from 'react';
import { VizEngine, fitCanvas } from '../engine/viz';
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
  const vizEngineRef = useRef<VizEngine | null>(null);
  const simulationEngineRef = useRef<SimulationEngine | null>(null);
  
  const { config, lastScatterSeed } = useConfigStore();
  const { setSimulationState } = useRuntimeStore();
  
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  // Initialize visualization engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    fitCanvas(canvas, 16/9);
    vizEngineRef.current = new VizEngine(canvas);
    
    return () => {
      if (vizEngineRef.current) {
        vizEngineRef.current.stop();
      }
    };
  }, []);

  // Build graph when config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const vizEngine = vizEngineRef.current;
    if (!canvas || !vizEngine) return;

    // Clear previous state
    vizEngine.clear();
    
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
    
    // Update viz engine
    vizEngine.graph = graph;
    vizEngine.startBuild();
    vizEngine.start();
    
    // Create simulation engine
    simulationEngineRef.current = new SimulationEngine(config, vizEngine, graph);
    
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
      requestAnimationFrame(monitorSimulation);
    };
    requestAnimationFrame(monitorSimulation);
    
  }, [config, lastScatterSeed, setSimulationState]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const vizEngine = vizEngineRef.current;
      if (!canvas || !vizEngine) return;
      
      fitCanvas(canvas, 16/9);
      vizEngine.resize(canvas.width, canvas.height);
      
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
      
      vizEngine.graph = graph;
      vizEngine.startBuild();
      
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
  }, []);

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
          Nodes: {stats.nodes} • Edges: {stats.edges}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 text-xs opacity-90 bg-dark-surface/75 border border-dark-border px-2 py-1.5 rounded flex gap-3 items-center backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            User group (≤10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            Router
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            Model
          </span>
        </div>
      </div>
    </div>
  );
};
