// engine/enhanced-viz.ts
// Enhanced Visualization Engine for AI Cost Flow Business Intelligence

import { Graph } from './graph';
import { AnimatedSignal, fitCanvas } from './viz';
import { AIModel, Provider, PROVIDER_COLORS } from '../models';
import { EnhancedCostRequest, EnhancedCostResult } from '../calc/enhanced-pricing';
import { Point, Node } from '../calc/types';

export interface TrafficPattern {
  hourlyMultipliers: number[]; // 24 values for each hour of day
  weeklyMultipliers: number[]; // 7 values for each day of week  
  monthlyMultipliers: number[]; // 12 values for each month
  seasonalVariations: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
}

export interface SimulatedTrafficEvent {
  id: string;
  timestamp: number; // Unix timestamp
  fromModelId: string;
  toModelId: string;
  volume: number; // Traffic volume multiplier
  cost: number;
  latency: number;
  success: boolean;
  routeQuality: 'optimal' | 'good' | 'degraded' | 'failed';
}

export interface TimeSimulationSettings {
  simSpeedMultiplier: number;
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  realTimeDuration: number; // in seconds
  paused: boolean;
  looping: boolean;
  currentProgress: number; // 0-100%;
}

/**
 * Enhanced Model Node for multi-provider visualization
 */
export interface EnhancedModelNode extends Node {
  model: AIModel;
  provider: Provider;
  brand_color: string;
  cost_per_request: number;
  requests_handled: number;
  total_cost_usd: number;
  efficiency_score: number;
  load_percentage: number;
  energy_consumption: number;
  animation_pulse: number;
  size_multiplier: number;
  // Traffic simulation properties
  temperature: number; // Visual heat indicator 0-1
  healthScore: number; // 0-1 representing node health
  connectionStrength: Map<string, number>; // Connection weights to other nodes
  trafficHistory: number[]; // Recent traffic volume history
  statusIndicators: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
    duration: number;
  }>;
}

/**
 * Enhanced Cost Signal with rich metadata
 */
export class EnhancedCostSignal extends AnimatedSignal {
  public cost_usd: number;
  public token_count: number;
  public model_id: string;
  public provider: Provider;
  public efficiency_tier: 'high' | 'medium' | 'low';
  public multimodal_content: boolean;
  public trail_length: number;
  public pulse_intensity: number;

  constructor(
    id: string,
    points: Point[],
    speed: number,
    cost_usd: number,
    token_count: number,
    model_id: string,
    provider: Provider,
    onDone?: () => void
  ) {
    // Dynamic color based on cost efficiency
    const efficiency_tier = cost_usd / token_count < 0.001 ? 'high' : 
                           cost_usd / token_count < 0.01 ? 'medium' : 'low';
    
    const colorOut = efficiency_tier === 'high' ? '#10b981' :  // Green for efficient
                     efficiency_tier === 'medium' ? '#f59e0b' : // Yellow for medium
                     '#ef4444'; // Red for expensive
    
    const colorBack = PROVIDER_COLORS[provider];
    
    super(id, points, speed, colorOut, colorBack, Math.floor(points.length / 2), onDone);
    
    this.cost_usd = cost_usd;
    this.token_count = token_count;
    this.model_id = model_id;
    this.provider = provider;
    this.efficiency_tier = efficiency_tier;
    this.multimodal_content = false; // Would be determined by request type
    
    // Visual properties based on cost and efficiency
    this.trail_length = Math.min(50, Math.max(5, cost_usd * 1000));
    this.pulse_intensity = efficiency_tier === 'high' ? 1.2 : 
                          efficiency_tier === 'medium' ? 1.0 : 0.8;
  }

  /**
   * Get dynamic size based on cost magnitude
   */
  getSize(): number {
    const baseSize = 3;
    const costMultiplier = Math.min(3, Math.max(0.5, Math.log10(this.cost_usd * 1000) + 2));
    return baseSize * costMultiplier * this.pulse_intensity;
  }

  /**
   * Get glow intensity based on efficiency
   */
  getGlowIntensity(): number {
    return this.efficiency_tier === 'high' ? 0.8 :
           this.efficiency_tier === 'medium' ? 0.5 : 0.3;
  }
}

/**
 * Provider Analytics for HUD display
 */
export interface ProviderMetrics {
  provider: Provider;
  total_cost: number;
  request_count: number;
  avg_efficiency: number;
  market_share: number;
  color: string;
  active_models: number;
}

/**
 * Live Metrics for BI Dashboard
 */
export interface LiveCostMetrics {
  session_totals: {
    total_cost_usd: number;
    total_tokens: number;
    total_requests: number;
    avg_cost_per_request: number;
    avg_cost_per_token: number;
  };
  efficiency_metrics: {
    most_efficient_model: string;
    least_efficient_model: string;
    overall_efficiency_score: number;
  };
  provider_breakdown: ProviderMetrics[];
  sustainability: {
    energy_consumed_wh: number;
    co2e_kg: number;
    phone_charges_equivalent: number;
    efficiency_trend: 'improving' | 'stable' | 'declining';
  };
  cost_trends: {
    trend_direction: 'up' | 'down' | 'stable';
    hourly_projection: number;
    optimization_savings: number;
  };
}

/**
 * Enhanced Visualization Engine for AI Cost Flow BI
 */
export class EnhancedVizEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private staticCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;
  
  public graph = new Graph();
  public modelNodes: Map<string, EnhancedModelNode> = new Map();
  public costSignals: EnhancedCostSignal[] = [];
  public liveMetrics: LiveCostMetrics;
  
  // Time simulation
  private simulationTime: number = 0; // Current simulation timestamp
  private simulationSpeed: number = 1440; // 1 min = 1 day by default
  private isSimulating: boolean = false;
  private simulationStartTime: number = 0;
  private simulationDuration: number = 365 * 24 * 3600; // 1 year in seconds
  private currentProgress: number = 0;
  private trafficEvents: SimulatedTrafficEvent[] = [];
  
  private lastTime = 0;
  private rafId: number | null = null;
  private animationTime = 0;
  
  // Performance settings
  public targetFPS = 60;
  public maxSignals = 100;
  public enableEffects = true;
  
  // Traffic patterns
  private trafficPattern: TrafficPattern = {
    hourlyMultipliers: [
      0.3, 0.2, 0.1, 0.1, 0.2, 0.4, 0.7, 1.0, // 00-07: Night to morning
      1.2, 1.5, 1.8, 1.9, 1.8, 1.6, 1.7, 1.8, // 08-15: Work hours
      1.9, 1.7, 1.4, 1.1, 0.9, 0.7, 0.5, 0.4  // 16-23: Evening to night
    ],
    weeklyMultipliers: [0.8, 1.2, 1.3, 1.3, 1.4, 1.1, 0.6], // Sun-Sat
    monthlyMultipliers: [1.0, 0.9, 1.1, 1.0, 1.0, 1.1, 0.8, 0.9, 1.2, 1.3, 1.1, 0.7], // Jan-Dec
    seasonalVariations: {
      spring: 1.1,
      summer: 0.9,
      fall: 1.2,
      winter: 1.0
    }
  };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    
    this.staticCanvas = document.createElement('canvas');
    this.staticCtx = this.staticCanvas.getContext('2d', { alpha: false })!;
    
    this.liveMetrics = this.initializeMetrics();
  }

  /**
   * Initialize live metrics
   */
  private initializeMetrics(): LiveCostMetrics {
    return {
      session_totals: {
        total_cost_usd: 0,
        total_tokens: 0,
        total_requests: 0,
        avg_cost_per_request: 0,
        avg_cost_per_token: 0
      },
      efficiency_metrics: {
        most_efficient_model: '',
        least_efficient_model: '',
        overall_efficiency_score: 0
      },
      provider_breakdown: [],
      sustainability: {
        energy_consumed_wh: 0,
        co2e_kg: 0,
        phone_charges_equivalent: 0,
        efficiency_trend: 'stable'
      },
      cost_trends: {
        trend_direction: 'stable',
        hourly_projection: 0,
        optimization_savings: 0
      }
    };
  }

  /**
   * Setup enhanced model nodes from AI model database
   */
  setupModelNodes(models: AIModel[]): void {
    this.modelNodes.clear();
    this.graph.clear();

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // Group models by provider for clustering
    const providerGroups = new Map<Provider, AIModel[]>();
    models.forEach(model => {
      const existing = providerGroups.get(model.provider) || [];
      existing.push(model);
      providerGroups.set(model.provider, existing);
    });

    // Position providers in circular arrangement
    const providers = Array.from(providerGroups.keys());
    const centerX = canvasWidth * 0.5;
    const centerY = canvasHeight * 0.5;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.35;

    providers.forEach((provider, providerIndex) => {
      const providerModels = providerGroups.get(provider)!;
      const angle = (providerIndex / providers.length) * Math.PI * 2;
      
      // Provider cluster center
      const providerX = centerX + Math.cos(angle) * radius;
      const providerY = centerY + Math.sin(angle) * radius;
      
      // Arrange models within provider cluster
      providerModels.forEach((model, modelIndex) => {
        const modelAngle = angle + (modelIndex - (providerModels.length - 1) / 2) * 0.3;
        const modelRadius = 60 + (modelIndex % 2) * 30;
        
        const x = providerX + Math.cos(modelAngle) * modelRadius;
        const y = providerY + Math.sin(modelAngle) * modelRadius;

        const modelNode: EnhancedModelNode = {
          id: `model_${model.id}`,
          type: 'model',
          x,
          y,
          r: 12 * (model.visualization.node_size_multiplier || 1.0),
          model,
          provider: model.provider,
          brand_color: model.visualization.brand_color,
          cost_per_request: 0,
          requests_handled: 0,
          total_cost_usd: 0,
          efficiency_score: model.sustainability.compute_efficiency_score || 5,
          load_percentage: 0,
          energy_consumption: 0,
          animation_pulse: 0,
          size_multiplier: model.visualization.node_size_multiplier || 1.0,
          // Initialize traffic simulation properties
          temperature: 0.5,
          healthScore: 1.0,
          connectionStrength: new Map(),
          trafficHistory: new Array(60).fill(0), // 1 minute history
          statusIndicators: []
        };

        this.modelNodes.set(model.id, modelNode);
        this.graph.addNode(modelNode);
      });
    });

    this.bakeStatic();
  }

  /**
   * Add animated cost signal between models
   */
  addCostSignal(
    fromModelId: string,
    toModelId: string,
    costResult: EnhancedCostResult
  ): void {
    if (this.costSignals.length >= this.maxSignals) {
      // Remove oldest signal
      this.costSignals.shift();
    }

    const fromNode = this.modelNodes.get(fromModelId);
    const toNode = this.modelNodes.get(toModelId);
    
    if (!fromNode || !toNode) return;

    // Create curved path for more visual appeal
    const path = this.createCurvedPath(fromNode, toNode);
    
    // Calculate signal properties
    const cost = costResult.costs.total_cost;
    const tokens = costResult.request.input_tokens + costResult.request.output_tokens;
    const speed = 150 * (costResult.model.visualization.animation_speed_multiplier || 1.0);

    const signal = new EnhancedCostSignal(
      `signal_${Date.now()}_${Math.random()}`,
      path,
      speed,
      cost,
      tokens,
      toModelId,
      costResult.model.provider,
      () => {
        // Update destination model metrics
        if (toNode) {
          toNode.requests_handled++;
          toNode.total_cost_usd += cost;
          toNode.cost_per_request = toNode.total_cost_usd / toNode.requests_handled;
          toNode.energy_consumption += costResult.sustainability.energy_consumption_wh;
          toNode.load_percentage = Math.min(100, toNode.requests_handled * 2);
        }
        
        // Update live metrics
        this.updateLiveMetrics(costResult);
        
        // Remove completed signal
        const index = this.costSignals.findIndex(s => s.id === signal.id);
        if (index >= 0) this.costSignals.splice(index, 1);
      }
    );

    this.costSignals.push(signal);
  }

  /**
   * Create curved path between two nodes
   */
  private createCurvedPath(from: EnhancedModelNode, to: EnhancedModelNode): Point[] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Add curve for visual appeal
    const curvature = 0.3;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Perpendicular offset for curve
    const offsetX = -dy / distance * curvature * distance * 0.5;
    const offsetY = dx / distance * curvature * distance * 0.5;

    return [
      { x: from.x, y: from.y },
      { x: midX + offsetX, y: midY + offsetY },
      { x: to.x, y: to.y }
    ];
  }

  /**
   * Update live metrics from cost result
   */
  private updateLiveMetrics(costResult: EnhancedCostResult): void {
    const metrics = this.liveMetrics;
    
    // Update session totals
    metrics.session_totals.total_cost_usd += costResult.costs.total_cost;
    metrics.session_totals.total_tokens += costResult.request.input_tokens + costResult.request.output_tokens;
    metrics.session_totals.total_requests += costResult.request.requests_count;
    
    if (metrics.session_totals.total_requests > 0) {
      metrics.session_totals.avg_cost_per_request = 
        metrics.session_totals.total_cost_usd / metrics.session_totals.total_requests;
    }
    
    if (metrics.session_totals.total_tokens > 0) {
      metrics.session_totals.avg_cost_per_token = 
        metrics.session_totals.total_cost_usd / metrics.session_totals.total_tokens;
    }

    // Update sustainability
    metrics.sustainability.energy_consumed_wh += costResult.sustainability.energy_consumption_wh;
    metrics.sustainability.co2e_kg += costResult.sustainability.co2e_kg;
    metrics.sustainability.phone_charges_equivalent += costResult.sustainability.phone_charges_equivalent;

    // Update provider breakdown
    this.updateProviderMetrics(costResult);
  }

  /**
   * Update provider metrics
   */
  private updateProviderMetrics(costResult: EnhancedCostResult): void {
    const provider = costResult.model.provider;
    let providerMetrics = this.liveMetrics.provider_breakdown.find(p => p.provider === provider);
    
    if (!providerMetrics) {
      providerMetrics = {
        provider,
        total_cost: 0,
        request_count: 0,
        avg_efficiency: 0,
        market_share: 0,
        color: PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS] || '#6366f1',
        active_models: 1
      };
      this.liveMetrics.provider_breakdown.push(providerMetrics);
    }

    providerMetrics.total_cost += costResult.costs.total_cost;
    providerMetrics.request_count += costResult.request.requests_count;
    providerMetrics.avg_efficiency = costResult.performance.efficiency_score;

    // Calculate market share
    const totalCost = this.liveMetrics.session_totals.total_cost_usd;
    if (totalCost > 0) {
      this.liveMetrics.provider_breakdown.forEach(p => {
        p.market_share = (p.total_cost / totalCost) * 100;
      });
    }
  }

  /**
   * Bake static background elements
   */
  bakeStatic(): void {
    const W = this.canvas.width;
    const H = this.canvas.height;
    
    this.staticCanvas.width = W;
    this.staticCanvas.height = H;
    
    const ctx = this.staticCtx;
    ctx.clearRect(0, 0, W, H);

    // Enhanced background with BI theme
    const gradient = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H));
    gradient.addColorStop(0, 'rgba(79,70,229,0.15)'); // Indigo core
    gradient.addColorStop(0.6, 'rgba(99,102,241,0.08)'); // Purple middle
    gradient.addColorStop(1, '#0f172a'); // Dark slate background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Sophisticated grid pattern
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 0.5;
    const cellSize = 60;

    for (let x = 0.5; x < W; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    for (let y = 0.5; y < H; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Provider cluster backgrounds
    if (this.modelNodes.size > 0) {
      this.renderProviderClusters(ctx, W, H);
    }
  }

  /**
   * Render provider cluster backgrounds
   */
  private renderProviderClusters(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const providers = new Map<Provider, EnhancedModelNode[]>();
    
    // Group nodes by provider
    for (const node of this.modelNodes.values()) {
      const existing = providers.get(node.provider) || [];
      existing.push(node);
      providers.set(node.provider, existing);
    }

    // Draw cluster backgrounds
    providers.forEach((nodes, provider) => {
      if (nodes.length === 0) return;

      // Calculate cluster bounds
      let minX = nodes[0].x, maxX = nodes[0].x;
      let minY = nodes[0].y, maxY = nodes[0].y;
      
      nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      });

      // Draw subtle cluster background
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radius = Math.max((maxX - minX) / 2, (maxY - minY) / 2) + 40;

      ctx.save();
      ctx.globalAlpha = 0.1;
      const clusterGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      clusterGradient.addColorStop(0, PROVIDER_COLORS[provider]);
      clusterGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = clusterGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Provider label
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = PROVIDER_COLORS[provider];
      ctx.font = '12px Inter, system-ui, sans-serif';
      // ctx.fontWeight = '600'; // Not supported - use font string instead
      ctx.textAlign = 'center';
      ctx.fillText(provider, centerX, centerY - radius - 10);
      ctx.restore();
    });
  }

  /**
   * Start animation loop
   */
  start(): void {
    if (this.rafId) return;
    
    this.lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaTime = Math.min(50, currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      this.animationTime += deltaTime;
      
      this.render(deltaTime);
      this.rafId = requestAnimationFrame(animate);
    };
    
    this.rafId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main render function
   */
  render(deltaTime: number): void {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Clear and draw static background
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.staticCanvas, 0, 0);

    // Update signals
    // Update simulation time
    if (this.isSimulating) {
      this.simulationTime += (deltaTime / 1000) * this.simulationSpeed;
      this.currentProgress = Math.min(100, (this.simulationTime / this.simulationDuration) * 100);
      
      // Generate traffic events
      this.generateTrafficEvents(deltaTime);
    }
    
    // Update node decay
    this.modelNodes.forEach(node => {
      node.load_percentage *= 0.995;
      node.temperature = Math.max(0.5, node.temperature * 0.98);
    });
    
    this.costSignals.forEach(signal => signal.step(deltaTime));

    // Render model nodes
    this.renderModelNodes(ctx);

    // Render cost signals
    this.renderCostSignals(ctx);

    // Render enhanced HUD
    this.renderEnhancedHUD(ctx, W, H);
  }

  /**
   * Render enhanced model nodes
   */
  private renderModelNodes(ctx: CanvasRenderingContext2D): void {
    for (const node of this.modelNodes.values()) {
      // Update animation pulse
      node.animation_pulse = Math.sin(this.animationTime * 2 + node.x * 0.01) * 0.2 + 1;
      
      // Base size with load-based scaling
      const baseSize = 12 * node.size_multiplier;
      const loadScale = 1 + (node.load_percentage / 100) * 0.5;
      const size = baseSize * loadScale * node.animation_pulse;

      // Glow effect for active nodes
      if (this.enableEffects && node.requests_handled > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3 * (node.load_percentage / 100);
        ctx.fillStyle = node.brand_color;
        ctx.shadowColor = node.brand_color;
        ctx.shadowBlur = size;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Main node
      ctx.save();
      ctx.fillStyle = node.brand_color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Load indicator
      if (node.load_percentage > 0) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 6, -Math.PI / 2, 
          -Math.PI / 2 + (node.load_percentage / 100) * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Model label
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.model.name, node.x, node.y + size + 15);
      
      // Cost indicator
      if (node.cost_per_request > 0) {
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`$${node.cost_per_request.toFixed(4)}/req`, node.x, node.y + size + 28);
      }
      ctx.restore();
    }
  }

  /**
   * Render enhanced cost signals
   */
  private renderCostSignals(ctx: CanvasRenderingContext2D): void {
    this.costSignals.forEach(signal => {
      const pos = signal.xy();
      const size = signal.getSize();
      const glowIntensity = signal.getGlowIntensity();

      // Trail effect
      if (this.enableEffects && signal.trail_length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= signal.trail_length; i++) {
          const trailT = Math.max(0, signal.t - i * 0.02);
          const trailSeg = Math.max(0, signal.seg - Math.floor(i * 0.02 * signal.path.length));
          
          if (trailSeg < signal.path.length - 1) {
            const p0 = signal.path[trailSeg];
            const p1 = signal.path[trailSeg + 1] || p0;
            const trailPos = {
              x: p0.x + (p1.x - p0.x) * (trailT % 1),
              y: p0.y + (p1.y - p0.y) * (trailT % 1)
            };
            
            ctx.fillStyle = signal.color();
            ctx.globalAlpha = 0.3 * (1 - i / signal.trail_length);
            ctx.beginPath();
            ctx.arc(trailPos.x, trailPos.y, size * (1 - i / signal.trail_length), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // Main signal with glow
      if (this.enableEffects) {
        ctx.save();
        ctx.globalAlpha = glowIntensity;
        ctx.fillStyle = signal.color();
        ctx.shadowColor = signal.color();
        ctx.shadowBlur = size * 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Core signal
      ctx.save();
      ctx.fillStyle = signal.color();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Cost indicator for expensive signals
      if (signal.cost_usd > 0.01) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`$${signal.cost_usd.toFixed(3)}`, pos.x, pos.y - size - 5);
        ctx.restore();
      }
    });
  }

  /**
   * Render enhanced HUD with BI metrics
   */
  private renderEnhancedHUD(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const metrics = this.liveMetrics;
    const padding = 20;
    const panelWidth = 280;
    const panelHeight = 200;

    // Main metrics panel
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding, padding, panelWidth, panelHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillText('Live Cost Analytics', padding + 15, padding + 25);

    // Session totals
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    let y = padding + 50;
    
    ctx.fillText(`Total Cost: $${metrics.session_totals.total_cost_usd.toFixed(2)}`, padding + 15, y);
    y += 20;
    ctx.fillText(`Requests: ${metrics.session_totals.total_requests.toLocaleString()}`, padding + 15, y);
    y += 20;
    ctx.fillText(`Avg/Request: $${metrics.session_totals.avg_cost_per_request.toFixed(4)}`, padding + 15, y);
    y += 20;
    ctx.fillText(`Energy: ${metrics.sustainability.energy_consumed_wh.toFixed(1)} Wh`, padding + 15, y);

    // Provider breakdown
    y += 30;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText('Provider Breakdown:', padding + 15, y);
    
    metrics.provider_breakdown.slice(0, 3).forEach((provider, index) => {
      y += 18;
      ctx.fillStyle = provider.color;
      ctx.fillRect(padding + 15, y - 8, 12, 8);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${provider.provider}: ${provider.market_share.toFixed(1)}%`, padding + 35, y);
    });

    ctx.restore();

    // Active signals count
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath();
    ctx.roundRect(W - 150, padding, 120, 40, 6);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Active Signals', W - 90, padding + 18);
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${this.costSignals.length}`, W - 90, padding + 35);
    ctx.restore();
  }

  /**
   * Get current live metrics
   */
  getLiveMetrics(): LiveCostMetrics {
    return { ...this.liveMetrics };
  }

  /**
   * Time Simulation Methods
   */
  public startSimulation(duration: number, speed: number): void {
    this.simulationDuration = duration;
    this.simulationSpeed = speed;
    this.simulationStartTime = Date.now();
    this.simulationTime = 0;
    this.isSimulating = true;
    this.currentProgress = 0;
    
    if (!this.rafId) {
      this.start();
    }
  }

  public pauseSimulation(): void {
    this.isSimulating = false;
  }

  public resumeSimulation(): void {
    this.isSimulating = true;
    this.simulationStartTime = Date.now() - (this.simulationTime / this.simulationSpeed * 1000);
  }

  public stopSimulation(): void {
    this.isSimulating = false;
    this.simulationTime = 0;
    this.currentProgress = 0;
  }

  public resetSimulation(): void {
    this.stopSimulation();
    this.costSignals = [];
    this.trafficEvents = [];
    
    // Reset node states
    this.modelNodes.forEach(node => {
      node.energy_consumption = 0;
      node.temperature = 0.5;
      node.load_percentage = 0;
      node.healthScore = 1.0;
      node.trafficHistory.fill(0);
      node.statusIndicators = [];
      node.connectionStrength.clear();
    });
  }

  public getCurrentProgress(): number {
    return this.currentProgress;
  }

  public getSimulationTime(): number {
    return this.simulationTime;
  }

  private generateTrafficEvents(deltaTime: number): void {
    if (!this.isSimulating) return;
    
    const currentDate = new Date(this.simulationTime * 1000);
    const hour = currentDate.getUTCHours();
    const dayOfWeek = currentDate.getUTCDay();
    const month = currentDate.getUTCMonth();
    const dayOfYear = Math.floor(this.simulationTime / (24 * 3600));
    
    // Calculate traffic multiplier based on patterns
    const hourlyMult = this.trafficPattern.hourlyMultipliers[hour];
    const weeklyMult = this.trafficPattern.weeklyMultipliers[dayOfWeek];
    const monthlyMult = this.trafficPattern.monthlyMultipliers[month];
    
    // Seasonal variation
    const season = Math.floor((dayOfYear % 365) / 91.25); // 0-3 for seasons
    const seasonalMult = [
      this.trafficPattern.seasonalVariations.spring,
      this.trafficPattern.seasonalVariations.summer,
      this.trafficPattern.seasonalVariations.fall,
      this.trafficPattern.seasonalVariations.winter
    ][season];
    
    const totalMultiplier = hourlyMult * weeklyMult * monthlyMult * seasonalMult;
    
    // Generate traffic events based on multiplier
    const baseEventRate = 0.5; // Base events per second
    const eventRate = baseEventRate * totalMultiplier * (deltaTime / 1000);
    
    const nodeIds = Array.from(this.modelNodes.keys());
    
    for (let i = 0; i < Math.floor(eventRate) + (Math.random() < (eventRate % 1) ? 1 : 0); i++) {
      const fromId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      const toId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      
      if (fromId !== toId) {
        this.generateTrafficSignal(fromId, toId, totalMultiplier);
      }
    }
  }

  private generateTrafficSignal(fromId: string, toId: string, volumeMultiplier: number): void {
    const fromNode = this.modelNodes.get(fromId);
    const toNode = this.modelNodes.get(toId);
    
    if (!fromNode || !toNode) return;
    
    // Calculate route quality based on current load
    const loadFactor = (fromNode.load_percentage + toNode.load_percentage) / 200; // 0-1
    
    let routeQuality: 'optimal' | 'good' | 'degraded' | 'failed' = 'optimal';
    if (loadFactor > 0.8) routeQuality = 'degraded';
    else if (loadFactor > 0.6) routeQuality = 'good';
    
    // Simulate failures based on load
    if (Math.random() < loadFactor * 0.1) {
      routeQuality = 'failed';
    }
    
    const volume = volumeMultiplier * (0.5 + Math.random() * 0.5);
    const cost = (fromNode.model.pricing.input_price_per_1k_tokens + toNode.model.pricing.output_price_per_1k_tokens) / 2 * volume;
    
    // Create enhanced cost result for visualization
    const mockResult: EnhancedCostResult = {
      model: toNode.model,
      request: {
        model_id: toNode.model.id,
        input_tokens: Math.floor(volume * 100 + 50),
        output_tokens: Math.floor(volume * 75 + 30),
        requests_count: 1,
        images_count: 0,
        audio_minutes: 0
      },
      costs: {
        input_tokens_cost: cost * 0.6,
        output_tokens_cost: cost * 0.4,
        images_cost: 0,
        audio_cost: 0,
        video_cost: 0,
        base_subtotal: cost,
        batch_discount: 0,
        cache_savings: 0,
        retry_penalty: 0,
        router_commission: 0,
        total_cost: cost
      },
      per_unit: {
        cost_per_request: cost,
        cost_per_input_token: cost * 0.6 / (volume * 100 + 50),
        cost_per_output_token: cost * 0.4 / (volume * 75 + 30),
        cost_per_total_token: cost / (volume * 175 + 80)
      },
      performance: {
        estimated_latency_ms: 200 + Math.random() * 800,
        estimated_throughput_rps: 50 + Math.random() * 100,
        quality_adjusted_cost: cost * 1.1,
        efficiency_score: 5 + Math.random() * 5
      },
      insights: {
        cost_tier: cost < 0.001 ? 'budget' : cost < 0.01 ? 'mid-tier' : cost < 0.05 ? 'premium' : 'enterprise',
        optimization_opportunities: [],
        risk_factors: [],
        comparative_ranking: Math.floor(Math.random() * 50) + 1
      },
      sustainability: {
        energy_consumption_wh: volume * 2,
        co2e_kg: volume * 0.001,
        phone_charges_equivalent: volume * 0.5,
        household_hours_equivalent: volume * 0.05,
        sustainability_score: 5 + Math.random() * 5
      },
      projections: {
        hourly_cost: cost * 100,
        daily_cost: cost * 2400,
        weekly_cost: cost * 16800,
        monthly_cost: cost * 72000,
        annual_cost: cost * 876000
      }
    };
    
    this.addCostSignal(fromId, toId, mockResult);
    
    // Update node states
    fromNode.load_percentage = Math.min(100, fromNode.load_percentage + volume * 5);
    toNode.load_percentage = Math.min(100, toNode.load_percentage + volume * 8);
    fromNode.temperature = Math.min(1, fromNode.temperature + volume * 0.2);
    toNode.temperature = Math.min(1, toNode.temperature + volume * 0.3);
    
    // Update connection strength
    const currentStrength = fromNode.connectionStrength.get(toId) || 0;
    fromNode.connectionStrength.set(toId, Math.min(1, currentStrength + volume * 0.1));
    
    // Add to traffic history
    fromNode.trafficHistory.push(volume);
    if (fromNode.trafficHistory.length > 60) {
      fromNode.trafficHistory.shift();
    }
  }

  /**
   * Reset all metrics and visualization state
   */
  reset(): void {
    this.costSignals = [];
    this.modelNodes.forEach(node => {
      node.requests_handled = 0;
      node.total_cost_usd = 0;
      node.cost_per_request = 0;
      node.load_percentage = 0;
      node.energy_consumption = 0;
      node.temperature = 0.5;
      node.healthScore = 1.0;
      node.trafficHistory.fill(0);
      node.statusIndicators = [];
      node.connectionStrength.clear();
    });
    this.liveMetrics = this.initializeMetrics();
  }
}

/**
 * Utility functions for enhanced visualization
 */
export const EnhancedVizUtils = {
  /**
   * Fit canvas with high DPI support
   */
  setupCanvas: (canvas: HTMLCanvasElement): void => {
    fitCanvas(canvas);
    
    // High DPI support
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  },

  /**
   * Generate cost visualization color palette
   */
  getCostTierColor: (costPer1kTokens: number): string => {
    if (costPer1kTokens < 1) return '#10b981'; // Green - Budget
    if (costPer1kTokens < 5) return '#f59e0b'; // Yellow - Mid-tier  
    if (costPer1kTokens < 15) return '#f97316'; // Orange - Premium
    return '#ef4444'; // Red - Enterprise
  }
};