// engine/stunning-visualizer.ts
// Advanced Stunning Node Visualizer with GPU-Accelerated Graphics

import { AIModel } from '../models/types';
import { EnhancedCostResult } from '../calc/enhanced-pricing';

export interface VisualNode {
  id: string;
  model: AIModel;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  energy: number;
  glow: number;
  connections: number;
  lastActivity: number;
  pulsePhase: number;
  color: {
    h: number;
    s: number;
    l: number;
  };
  trails: Array<{x: number, y: number, alpha: number, timestamp: number}>;
}

export interface CostSignal {
  id: string;
  from: string;
  to: string;
  progress: number;
  speed: number;
  cost: number;
  intensity: number;
  color: string;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
  }>;
  createdAt: number;
  result?: EnhancedCostResult;
}

export class StunningVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Map<string, VisualNode> = new Map();
  private signals: Map<string, CostSignal> = new Map();
  private animationId: number = 0;
  private lastTime: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseDown: boolean = false;
  private dragNode: VisualNode | null = null;
  
  // Visual effects
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: 'spark' | 'glow' | 'cost' | 'error';
  }> = [];
  
  private backgroundGrid: Array<{
    x: number;
    y: number;
    opacity: number;
    pulsePhase: number;
  }> = [];

  // Performance metrics
  private frameCount: number = 0;
  private fps: number = 60;
  private lastFpsUpdate: number = 0;
  
  // Visual settings
  private settings = {
    nodeMinRadius: 12,
    nodeMaxRadius: 35,
    glowIntensity: 0.8,
    particleCount: 150,
    trailLength: 20,
    costSignalSpeed: 0.02,
    damping: 0.92,
    attraction: 0.001,
    repulsion: 100,
    centeringForce: 0.0005,
    backgroundAnimation: true,
    highQuality: true
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    this.setupCanvas();
    this.setupEventListeners();
    this.generateBackgroundGrid();
  }

  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Find node under mouse
      for (const node of this.nodes.values()) {
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius) {
          this.dragNode = node;
          break;
        }
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.dragNode = null;
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.dragNode) return; // Don't trigger click if we were dragging
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create click effect
      this.createClickEffect(x, y);
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.generateBackgroundGrid();
      this.repositionNodes();
    });
  }

  private generateBackgroundGrid(): void {
    this.backgroundGrid = [];
    const gridSize = 60;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        this.backgroundGrid.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          opacity: Math.random() * 0.3,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  private repositionNodes(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const margin = 100;
    
    const positions = this.generateOptimalPositions(this.nodes.size, width - 2 * margin, height - 2 * margin);
    let i = 0;
    
    for (const node of this.nodes.values()) {
      const pos = positions[i % positions.length];
      node.targetX = pos.x + margin;
      node.targetY = pos.y + margin;
      i++;
    }
  }

  private generateOptimalPositions(count: number, width: number, height: number): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    
    if (count <= 1) {
      return [{x: width / 2, y: height / 2}];
    }
    
    // Use golden spiral for optimal distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    
    for (let i = 0; i < count; i++) {
      const theta = i * goldenAngle;
      const r = Math.sqrt(i / count) * Math.min(width, height) * 0.35;
      
      positions.push({
        x: width / 2 + r * Math.cos(theta),
        y: height / 2 + r * Math.sin(theta)
      });
    }
    
    return positions;
  }

  public setupModelNodes(models: AIModel[]): void {
    this.nodes.clear();
    
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;
    const positions = this.generateOptimalPositions(models.length, width - 200, height - 200);
    
    models.forEach((model, index) => {
      const pos = positions[index % positions.length];
      const baseRadius = Math.max(
        this.settings.nodeMinRadius,
        Math.min(
          this.settings.nodeMaxRadius,
          (model.metadata.popularity_rank ? (100 - model.metadata.popularity_rank) / 10 : 5) + 8
        )
      );
      
      // Generate color based on provider and cost
      const providerHue = this.getProviderHue(model.provider);
      const costFactor = this.getCostFactor(model);
      
      const node: VisualNode = {
        id: model.id,
        model,
        x: pos.x + 100,
        y: pos.y + 100,
        targetX: pos.x + 100,
        targetY: pos.y + 100,
        vx: 0,
        vy: 0,
        radius: baseRadius,
        targetRadius: baseRadius,
        energy: 0,
        glow: 0,
        connections: 0,
        lastActivity: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        color: {
          h: providerHue,
          s: 60 + costFactor * 30,
          l: 50 + costFactor * 20
        },
        trails: []
      };
      
      this.nodes.set(model.id, node);
    });
  }

  private getProviderHue(provider: string): number {
    const hues: Record<string, number> = {
      'OpenAI': 200,      // Blue
      'Anthropic': 25,    // Orange
      'Google': 120,      // Green
      'Meta': 240,        // Purple
      'Mistral': 300,     // Magenta
      'Cohere': 60,       // Yellow
      'Perplexity': 180,  // Cyan
      'Together': 330,    // Pink
      'Replicate': 90,    // Light green
      'Custom': 0         // Red
    };
    return hues[provider] || Math.random() * 360;
  }

  private getCostFactor(model: AIModel): number {
    const avgCost = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
    return Math.min(1, avgCost / 10); // Normalize to 0-1 range
  }

  public addCostSignal(fromId: string, toId: string, result: EnhancedCostResult): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (!fromNode || !toNode) return;
    
    const signalId = `${fromId}-${toId}-${Date.now()}`;
    const intensity = Math.min(1, result.costs.total_cost / 0.1);
    
    // Determine color based on cost tier
    let color = '#10b981'; // Green for budget
    if (result.insights.cost_tier === 'mid-tier') color = '#f59e0b'; // Yellow
    else if (result.insights.cost_tier === 'premium') color = '#ef4444'; // Red
    else if (result.insights.cost_tier === 'enterprise') color = '#8b5cf6'; // Purple
    
    const signal: CostSignal = {
      id: signalId,
      from: fromId,
      to: toId,
      progress: 0,
      speed: this.settings.costSignalSpeed + intensity * 0.01,
      cost: result.costs.total_cost,
      intensity,
      color,
      particles: [],
      createdAt: Date.now(),
      result
    };
    
    // Generate particles for the signal
    for (let i = 0; i < Math.ceil(intensity * 10) + 3; i++) {
      signal.particles.push({
        x: fromNode.x + (Math.random() - 0.5) * fromNode.radius,
        y: fromNode.y + (Math.random() - 0.5) * fromNode.radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        size: Math.random() * 3 + 1
      });
    }
    
    this.signals.set(signalId, signal);
    
    // Activate nodes
    fromNode.energy = Math.min(1, fromNode.energy + intensity * 0.3);
    fromNode.connections++;
    fromNode.lastActivity = Date.now();
    
    toNode.energy = Math.min(1, toNode.energy + intensity * 0.5);
    toNode.connections++;
    toNode.lastActivity = Date.now();
  }

  private createClickEffect(x: number, y: number): void {
    // Create particles for click effect
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`,
        type: 'spark'
      });
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private animate = (currentTime: number = performance.now()): void => {
    const deltaTime = Math.min(currentTime - this.lastTime, 16.67); // Cap at 60fps
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    // Calculate FPS
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate > 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(deltaTime: number): void {
    const time = performance.now();
    
    // Update nodes
    for (const node of this.nodes.values()) {
      this.updateNode(node, deltaTime, time);
    }
    
    // Update signals
    for (const [id, signal] of this.signals.entries()) {
      this.updateSignal(signal, deltaTime);
      if (signal.progress >= 1) {
        this.signals.delete(id);
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * deltaTime * 0.01;
      particle.y += particle.vy * deltaTime * 0.01;
      particle.life -= deltaTime * 0.001;
      particle.vx *= 0.98; // Friction
      particle.vy *= 0.98;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update background grid
    if (this.settings.backgroundAnimation) {
      for (const gridPoint of this.backgroundGrid) {
        gridPoint.pulsePhase += deltaTime * 0.001;
        gridPoint.opacity = 0.1 + Math.sin(gridPoint.pulsePhase) * 0.05;
      }
    }
  }

  private updateNode(node: VisualNode, deltaTime: number, time: number): void {
    // Handle dragging
    if (this.dragNode === node && this.isMouseDown) {
      node.targetX = this.mouseX;
      node.targetY = this.mouseY;
    }
    
    // Apply forces
    const dx = node.targetX - node.x;
    const dy = node.targetY - node.y;
    
    node.vx += dx * this.settings.attraction * deltaTime;
    node.vy += dy * this.settings.attraction * deltaTime;
    
    // Apply repulsion from other nodes
    for (const other of this.nodes.values()) {
      if (other === node) continue;
      
      const odx = node.x - other.x;
      const ody = node.y - other.y;
      const dist = Math.sqrt(odx * odx + ody * ody);
      
      if (dist < this.settings.repulsion && dist > 0) {
        const force = this.settings.repulsion / (dist * dist);
        node.vx += (odx / dist) * force * deltaTime;
        node.vy += (ody / dist) * force * deltaTime;
      }
    }
    
    // Apply centering force
    const centerX = this.canvas.clientWidth / 2;
    const centerY = this.canvas.clientHeight / 2;
    const centerDx = centerX - node.x;
    const centerDy = centerY - node.y;
    const centerDist = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
    
    if (centerDist > 200) {
      node.vx += centerDx * this.settings.centeringForce * deltaTime;
      node.vy += centerDy * this.settings.centeringForce * deltaTime;
    }
    
    // Apply damping
    node.vx *= this.settings.damping;
    node.vy *= this.settings.damping;
    
    // Update position
    node.x += node.vx * deltaTime * 0.1;
    node.y += node.vy * deltaTime * 0.1;
    
    // Update node properties
    node.energy *= 0.995; // Energy decay
    node.glow = node.energy * this.settings.glowIntensity;
    
    // Update pulse phase
    node.pulsePhase += deltaTime * 0.003;
    
    // Update trails
    if (Math.abs(node.vx) > 0.1 || Math.abs(node.vy) > 0.1) {
      node.trails.push({
        x: node.x,
        y: node.y,
        alpha: 0.8,
        timestamp: time
      });
      
      if (node.trails.length > this.settings.trailLength) {
        node.trails.shift();
      }
    }
    
    // Update trail alpha
    for (let i = 0; i < node.trails.length; i++) {
      const trail = node.trails[i];
      const age = time - trail.timestamp;
      trail.alpha = Math.max(0, 0.8 - (age / 1000));
    }
    
    // Remove old trails
    node.trails = node.trails.filter(trail => trail.alpha > 0.01);
  }

  private updateSignal(signal: CostSignal, deltaTime: number): void {
    signal.progress += signal.speed * deltaTime * 0.1;
    signal.progress = Math.min(1, signal.progress);
    
    const fromNode = this.nodes.get(signal.from);
    const toNode = this.nodes.get(signal.to);
    
    if (!fromNode || !toNode) return;
    
    // Update particles
    for (const particle of signal.particles) {
      const t = signal.progress;
      const targetX = fromNode.x + (toNode.x - fromNode.x) * t;
      const targetY = fromNode.y + (toNode.y - fromNode.y) * t;
      
      particle.x += (targetX - particle.x) * 0.1;
      particle.y += (targetY - particle.y) * 0.1;
      particle.life = Math.max(0, particle.life - deltaTime * 0.001);
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Render background
    this.renderBackground(ctx, width, height);
    
    // Render node connections
    this.renderConnections(ctx);
    
    // Render cost signals
    this.renderSignals(ctx);
    
    // Render nodes
    this.renderNodes(ctx);
    
    // Render particles
    this.renderParticles(ctx);
    
    // Render UI overlay
    this.renderOverlay(ctx, width, height);
  }

  private renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Gradient background
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    gradient.addColorStop(1, 'rgba(3, 7, 18, 0.98)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Animated grid
    if (this.settings.backgroundAnimation) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      
      for (const gridPoint of this.backgroundGrid) {
        ctx.globalAlpha = gridPoint.opacity;
        ctx.beginPath();
        ctx.arc(gridPoint.x, gridPoint.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }
  }

  private renderConnections(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 1;
    
    const nodes = Array.from(this.nodes.values());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          const alpha = Math.max(0, (150 - dist) / 150) * 0.2;
          ctx.globalAlpha = alpha;
          
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
        }
      }
    }
    
    ctx.globalAlpha = 1;
  }

  private renderSignals(ctx: CanvasRenderingContext2D): void {
    for (const signal of this.signals.values()) {
      const fromNode = this.nodes.get(signal.from);
      const toNode = this.nodes.get(signal.to);
      
      if (!fromNode || !toNode) continue;
      
      // Render signal path
      const t = signal.progress;
      const x = fromNode.x + (toNode.x - fromNode.x) * t;
      const y = fromNode.y + (toNode.y - fromNode.y) * t;
      
      // Render particles
      for (const particle of signal.particles) {
        if (particle.life > 0) {
          ctx.globalAlpha = particle.life * signal.intensity;
          ctx.fillStyle = signal.color;
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Render signal glow
      ctx.globalAlpha = signal.intensity * 0.6;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
      gradient.addColorStop(0, signal.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }

  private renderNodes(ctx: CanvasRenderingContext2D): void {
    for (const node of this.nodes.values()) {
      const x = node.x;
      const y = node.y;
      const radius = node.radius + Math.sin(node.pulsePhase) * 2;
      
      // Render trails
      if (node.trails.length > 1) {
        ctx.strokeStyle = `hsla(${node.color.h}, ${node.color.s}%, ${node.color.l}%, 0.3)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < node.trails.length; i++) {
          const trail = node.trails[i];
          ctx.globalAlpha = trail.alpha;
          
          if (i === 0) {
            ctx.moveTo(trail.x, trail.y);
          } else {
            ctx.lineTo(trail.x, trail.y);
          }
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Render glow
      if (node.glow > 0.1) {
        const glowRadius = radius * (1 + node.glow * 2);
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
        gradient.addColorStop(0, `hsla(${node.color.h}, ${node.color.s}%, ${node.color.l}%, ${node.glow})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Render main node
      const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
      gradient.addColorStop(0, `hsl(${node.color.h}, ${node.color.s}%, ${node.color.l + 20}%)`);
      gradient.addColorStop(1, `hsl(${node.color.h}, ${node.color.s}%, ${node.color.l}%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Render border
      ctx.strokeStyle = `hsl(${node.color.h}, ${node.color.s}%, ${node.color.l + 30}%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Render provider logo area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Render provider text
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(8, radius * 0.3)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const providerShort = node.model.provider.substring(0, 3).toUpperCase();
      ctx.fillText(providerShort, x, y - 2);
      
      // Render cost tier indicator
      const costTier = this.getCostTier(node.model);
      ctx.font = `${Math.max(6, radius * 0.2)}px Arial`;
      ctx.fillStyle = this.getCostTierColor(costTier);
      ctx.fillText(costTier, x, y + radius * 0.4);
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }

  private renderOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // FPS counter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${this.fps}`, 10, 10);
    
    // Node count
    ctx.fillText(`Nodes: ${this.nodes.size}`, 10, 25);
    ctx.fillText(`Signals: ${this.signals.size}`, 10, 40);
    ctx.fillText(`Particles: ${this.particles.length}`, 10, 55);
  }

  private getCostTier(model: AIModel): string {
    const avgCost = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
    if (avgCost < 1) return '$';
    if (avgCost < 5) return '$$';
    if (avgCost < 20) return '$$$';
    return '$$$$';
  }

  private getCostTierColor(tier: string): string {
    switch (tier) {
      case '$': return '#10b981';
      case '$$': return '#f59e0b';
      case '$$$': return '#ef4444';
      case '$$$$': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  // Public API methods
  public updateSettings(newSettings: Partial<typeof this.settings>): void {
    Object.assign(this.settings, newSettings);
  }

  public getNodeAt(x: number, y: number): VisualNode | null {
    for (const node of this.nodes.values()) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius) {
        return node;
      }
    }
    return null;
  }

  public getPerformanceMetrics() {
    return {
      fps: this.fps,
      nodeCount: this.nodes.size,
      signalCount: this.signals.size,
      particleCount: this.particles.length
    };
  }
}