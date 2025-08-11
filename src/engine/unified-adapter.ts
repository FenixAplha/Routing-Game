// engine/unified-adapter.ts
// Adapter to make UnifiedVizEngine compatible with SimulationEngine

import { UnifiedVizEngine } from './unified-viz';
import { AnimatedSignal } from './viz';

/**
 * Adapter class to make UnifiedVizEngine compatible with SimulationEngine
 */
export class UnifiedVizEngineAdapter {
  public signals: AnimatedSignal[] = [];
  
  constructor(private unifiedEngine: UnifiedVizEngine) {}
  
  // Delegate methods to unified engine
  addSignal(
    fromId: string,
    toId: string,
    speed: number,
    colorOut: string,
    colorBack: string,
    splitIndex: number,
    onDone?: () => void
  ): AnimatedSignal {
    // Create a signal for the unified engine
    this.unifiedEngine.addSignal(fromId, toId);
    
    // Create a mock AnimatedSignal for compatibility
    const mockSignal: AnimatedSignal = {
      id: `signal_${Date.now()}_${Math.random()}`,
      path: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      speed,
      seg: 0,
      t: 0,
      dead: false,
      colorOut,
      colorBack,
      splitIndex,
      onDone,
      step: (dt: number) => {
        // Mock step function
      },
      xy: () => ({ x: 0, y: 0 }),
      color: () => colorOut
    };
    
    this.signals.push(mockSignal);
    return mockSignal;
  }
  
  // Pass through other methods
  start() {
    this.unifiedEngine.start();
  }
  
  stop() {
    this.unifiedEngine.stop();
  }
  
  clear() {
    this.unifiedEngine.clear();
    this.signals = [];
  }
  
  resize(width: number, height: number) {
    this.unifiedEngine.resize(width, height);
  }
  
  getSignalCount(): number {
    return this.unifiedEngine.getSignalCount();
  }
  
  // Additional round-trip signal method for compatibility
  addRoundTripSignal(
    edges: { path: { x: number; y: number }[] }[],
    speed = 650,
    colorOut = 'rgb(159,210,255)',
    colorBack = 'rgb(255,224,102)',
    onDone?: () => void
  ): void {
    // For unified engine, we'll just add a basic signal
    if (edges.length > 0 && edges[0].path.length >= 2) {
      // Extract from/to from path - this is a simplified approach
      const firstPoint = edges[0].path[0];
      const lastPoint = edges[edges.length - 1].path[edges[edges.length - 1].path.length - 1];
      
      // Find nodes closest to these points
      const fromNode = this.findClosestNode(firstPoint.x, firstPoint.y);
      const toNode = this.findClosestNode(lastPoint.x, lastPoint.y);
      
      if (fromNode && toNode) {
        this.addSignal(fromNode, toNode, speed, colorOut, colorBack, 1, onDone);
      }
    }
  }
  
  private findClosestNode(x: number, y: number): string | null {
    // Simple approach - would need access to graph nodes
    // For now, return null and let the calling code handle it
    return null;
  }
}