// engine/simulation.ts
import { RunConfig, Group, Router, Model, Profile, SimulationState } from '../calc/types';
import { createSeededRandom, SeededRandom } from './rng';
import { sampleTokens, sampleRequests, getGroupRate } from '../calc/tokens';
import { calculateRequestCost } from '../calc/pricing';
import { calculateEnergyWh } from '../calc/sustainability';
import { MetricsAggregator } from '../calc/aggregator';
import { Graph, findRequestPath } from './graph';
import { VizEngine } from './viz';

/**
 * Request context for tracking spawned requests
 */
interface RequestContext {
  id: string;
  groupId: string;
  routerPath: Router[];
  model: Model;
  tokens: { prompt: number; completion: number; total: number };
  cost: { baseCost: number; commission: number };
  energyWh: number;
}

/**
 * Simulation engine that orchestrates the 10-second capture
 */
export class SimulationEngine {
  private config: RunConfig;
  private rng: SeededRandom;
  private vizEngine: VizEngine;
  private graph: Graph;
  
  public state: SimulationState;
  public aggregator = new MetricsAggregator();
  
  private perGroupAccumulators = new Map<string, number>();
  private rafId: number | null = null;
  private startTime = 0;
  private lastTime = 0;

  constructor(
    config: RunConfig,
    vizEngine: VizEngine,
    graph: Graph
  ) {
    this.config = config;
    this.rng = createSeededRandom(config.seed);
    this.vizEngine = vizEngine;
    this.graph = graph;
    
    this.state = {
      phase: 'building',
      t: 0,
      duration: config.captureSeconds,
      forwards: 0,
      returns: 0,
      tokensPrompt: 0,
      tokensCompletion: 0,
      tokensTotal: 0,
      modelCostUSD: 0,
      commissionUSD: 0,
      energyWh: 0,
      perGroupAcc: new Map(),
      maxConcurrent: 48,
    };

    this.initializeAccumulators();
  }

  /**
   * Initialize per-group rate accumulators
   */
  private initializeAccumulators(): void {
    this.perGroupAccumulators.clear();
    this.state.perGroupAcc.clear();
    
    for (const group of this.config.groups) {
      this.perGroupAccumulators.set(group.id, 0);
      this.state.perGroupAcc.set(group.id, 0);
    }
  }

  /**
   * Transition to idle state (ready to run)
   */
  setIdle(): void {
    if (this.state.phase === 'building') {
      this.state.phase = 'idle';
    }
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.rafId) return;
    
    this.state.phase = 'running';
    this.state.t = 0;
    this.aggregator.reset();
    this.initializeAccumulators();
    
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.state.phase = 'done';
  }

  /**
   * Main simulation tick
   */
  private tick(timestamp: number): void {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.state.t = (timestamp - this.startTime) / 1000;

    if (this.state.phase === 'running') {
      // Check if capture period is over
      if (this.state.t >= this.state.duration) {
        this.state.phase = 'drain';
      } else {
        // Spawn requests based on group rates
        this.spawnRequests(dt);
      }
    } else if (this.state.phase === 'drain') {
      // Wait for all signals to complete
      if (this.vizEngine.getSignalCount() === 0) {
        this.state.phase = 'done';
        this.rafId = null;
        return;
      }
    }

    // Update state counters from aggregator
    const totals = this.aggregator.getTotals();
    this.state.forwards = totals.forwards;
    this.state.returns = totals.returns;
    this.state.tokensPrompt = totals.tokensPrompt;
    this.state.tokensCompletion = totals.tokensCompletion;
    this.state.tokensTotal = totals.tokensTotal;
    this.state.modelCostUSD = totals.modelCostUSD;
    this.state.commissionUSD = totals.commissionUSD;
    this.state.energyWh = totals.energyWh;

    if (this.state.phase !== 'done') {
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
  }

  /**
   * Spawn requests for all groups based on their rates
   */
  private spawnRequests(dt: number): void {
    for (const group of this.config.groups) {
      // Check concurrency limit
      if (this.vizEngine.getSignalCount() >= this.state.maxConcurrent) {
        break;
      }

      const profile = this.config.profiles.find(p => p.id === group.profileId);
      if (!profile) continue;

      const rate = getGroupRate(group.size, profile.avgReqsPerUserPerSec);
      
      // Update accumulator
      const currentAcc = this.perGroupAccumulators.get(group.id) || 0;
      const newAcc = currentAcc + rate * dt;
      
      // Spawn requests for accumulated amount
      const requestsToSpawn = Math.floor(newAcc);
      
      if (requestsToSpawn > 0) {
        for (let i = 0; i < requestsToSpawn; i++) {
          if (this.vizEngine.getSignalCount() >= this.state.maxConcurrent) {
            break;
          }
          this.spawnSingleRequest(group, profile);
        }
        
        // Update accumulator (subtract integer part)
        this.perGroupAccumulators.set(group.id, newAcc - requestsToSpawn);
        this.state.perGroupAcc.set(group.id, newAcc - requestsToSpawn);
      } else {
        this.perGroupAccumulators.set(group.id, newAcc);
        this.state.perGroupAcc.set(group.id, newAcc);
      }
    }
  }

  /**
   * Spawn a single request from a group
   */
  private spawnSingleRequest(group: Group, profile: Profile): void {
    // Sample tokens for this request
    const tokens = sampleTokens(profile, this.rng);
    
    // Choose router path (one router per layer)
    const routerPath: Router[] = [];
    for (let layer = 0; layer < this.config.routerLayers; layer++) {
      const layerRouters = this.config.routers.filter(r => r.layer === layer && r.enabled);
      if (layerRouters.length > 0) {
        const router = this.rng.choice(layerRouters);
        routerPath.push(router);
      }
    }
    
    // Choose model
    const model = this.chooseModel();
    
    // Calculate costs
    const cost = calculateRequestCost(tokens.total, model, routerPath);
    const energyWh = calculateEnergyWh(tokens.total, model);
    
    // Create request context
    const requestContext: RequestContext = {
      id: `req_${Date.now()}_${Math.random()}`,
      groupId: group.id,
      routerPath,
      model,
      tokens,
      cost,
      energyWh,
    };
    
    // Record the forward request in aggregator
    this.aggregator.addForward(
      group.id,
      routerPath.map(r => r.id),
      model.id,
      tokens,
      cost,
      energyWh
    );
    
    // Find visual path through graph
    const groupNode = this.graph.nodes.find(n => n.type === 'ugroup' && n.gid === group.id);
    if (!groupNode) return;
    
    const edges = findRequestPath(this.graph, groupNode, routerPath, model, this.rng);
    
    // Add visual signal
    this.vizEngine.addRoundTripSignal(
      edges,
      650, // speed
      'rgb(159,210,255)', // out color
      'rgb(255,224,102)', // back color
      () => {
        // On completion, record return
        this.aggregator.addReturn(group.id);
      }
    );
  }

  /**
   * Choose a model based on weights
   */
  private chooseModel(): Model {
    if (this.config.models.length === 1) {
      return this.config.models[0];
    }
    
    // Use weights if available, otherwise uniform
    const weights = this.config.models.map(m => m.weight || 1);
    return this.rng.weighted(this.config.models, weights);
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    if (this.state.phase === 'running') {
      return Math.min(1, this.state.t / this.state.duration);
    } else if (this.state.phase === 'drain' || this.state.phase === 'done') {
      return 1;
    }
    return 0;
  }

  /**
   * Check if simulation is complete
   */
  isComplete(): boolean {
    return this.state.phase === 'done';
  }

  /**
   * Get final run record
   */
  finalize(id: string, startedAt: string, drainedUntil: string) {
    return this.aggregator.finalize(
      id,
      this.config.id,
      startedAt,
      this.state.duration,
      drainedUntil,
      this.config.sustain
    );
  }

  /**
   * Reset simulation state
   */
  reset(): void {
    this.stop();
    this.state.phase = 'building';
    this.state.t = 0;
    this.aggregator.reset();
    this.initializeAccumulators();
  }

  /**
   * Update configuration (for rebuilds)
   */
  updateConfig(config: RunConfig): void {
    this.config = config;
    this.rng = createSeededRandom(config.seed);
    this.state.duration = config.captureSeconds;
    this.reset();
  }
}
