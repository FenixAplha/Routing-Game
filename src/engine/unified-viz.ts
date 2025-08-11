// engine/unified-viz.ts
// Unified Visualization Engine: Radial visuals + Classic grid positioning
// Combines the stunning visual style from radial layout with Manhattan-style grid structure

import { Graph } from './graph';
import { Node, Signal, Point } from '../calc/types';

const PI2 = Math.PI * 2;

/**
 * Enhanced easing functions for smooth animations
 */
const Easing = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return 1 + Math.pow(2, -10 * t) * Math.sin((t - s) * PI2 / p);
  },
  easeInOutQuart: (t: number) => 
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

/**
 * Enhanced Node for unified layout with animation properties
 */
interface UnifiedNode extends Node {
  // Animation properties
  animProgress: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  
  // Visual properties (from radial engine)
  glowIntensity: number;
  pulsePhase: number;
  hoverScale: number;
  connectionOpacity: number;
  
  // Interaction
  isHovered: boolean;
  isPinned: boolean;
  dragOffset: Point;
}

/**
 * Enhanced Signal with particle system
 */
interface UnifiedSignal extends Signal {
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    opacity: number;
    color: string;
    trail: Point[];
  }>;
  intensity: number;
  pulseSpeed: number;
}

/**
 * Unified Visualization Engine
 * Combines radial visual effects with classic Manhattan grid positioning
 */
export class UnifiedVizEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private staticCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;
  
  // Core properties
  public graph = new Graph();
  public signals: UnifiedSignal[] = [];
  private nodes: Map<string, UnifiedNode> = new Map();
  
  // Animation system
  private animationId: number | null = null;
  private lastTime = 0;
  private buildProgress = 0;
  private buildDuration = 2000; // 2 seconds build animation
  private isBuilding = true;
  private onBuildComplete?: () => void;
  
  // Layout properties (Classic Manhattan positioning)
  private leftX = 0;
  private rightX = 0;
  private centerX = 0;
  
  // Interaction
  private isDragging = false;
  private dragNode: UnifiedNode | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  
  // Visual effects
  private time = 0;
  private backgroundParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true,
      colorSpace: 'display-p3'
    });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    
    // Create static canvas for performance (from classic engine)
    this.staticCanvas = document.createElement('canvas');
    const staticCtx = this.staticCanvas.getContext('2d', { alpha: false });
    if (!staticCtx) throw new Error('Could not get static context');
    this.staticCtx = staticCtx;
    
    this.setupCanvas();
    this.setupEventListeners();
    this.initializeBackgroundParticles();
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.staticCanvas.width = this.canvas.width;
    this.staticCanvas.height = this.canvas.height;
    
    this.ctx.scale(dpr, dpr);
    this.staticCtx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Calculate Manhattan grid positions
    this.leftX = rect.width * 0.20;
    this.rightX = rect.width * 0.80;
    this.centerX = rect.width * 0.5;
    
    // Enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.staticCtx.imageSmoothingEnabled = true;
    this.staticCtx.imageSmoothingQuality = 'high';
  }

  private setupEventListeners(): void {
    // Mouse interaction (from radial engine)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Resize handling
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.repositionNodes();
    });
  }

  private initializeBackgroundParticles(): void {
    const count = 50;
    for (let i = 0; i < count; i++) {
      this.backgroundParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.1 + 0.02,
        color: ['#8b5cf6', '#06b6d4', '#10b981'][Math.floor(Math.random() * 3)]
      });
    }
  }

  public setupNodes(graph: Graph): void {
    this.graph = graph;
    this.nodes.clear();
    
    // Process each node and create enhanced unified nodes
    // Use CLASSIC GRID POSITIONING with RADIAL VISUAL STYLING
    graph.nodes.forEach((node) => {
      const unifiedNode = this.createUnifiedNode(node);
      this.nodes.set(node.id, unifiedNode);
    });
    
    this.startBuildAnimation();
  }

  private createUnifiedNode(node: Node): UnifiedNode {
    // Use the ORIGINAL X,Y from classic Manhattan layout - DO NOT CHANGE POSITIONING
    const targetX = node.x;
    const targetY = node.y;
    
    return {
      ...node,
      // Animation properties
      animProgress: 0,
      targetX,
      targetY,
      startX: this.centerX, // Start from center for animation
      startY: this.canvas.height / (window.devicePixelRatio || 1) / 2,
      
      // Visual properties (from radial engine)
      glowIntensity: 0,
      pulsePhase: Math.random() * PI2,
      hoverScale: 1,
      connectionOpacity: 0,
      
      // Interaction
      isHovered: false,
      isPinned: false,
      dragOffset: { x: 0, y: 0 }
    };
  }

  private startBuildAnimation(): void {
    this.isBuilding = true;
    this.buildProgress = 0;
    
    // Stagger node animations like radial engine
    const nodeArray = Array.from(this.nodes.values());
    nodeArray.forEach((node, index) => {
      const delay = node.type === 'router' ? 0 : index * 100;
      setTimeout(() => {
        this.animateNodeToPosition(node);
      }, delay);
    });
  }

  private animateNodeToPosition(node: UnifiedNode): void {
    const startTime = performance.now();
    const duration = 1000; // 1 second per node
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use elastic easing for bouncy effect (from radial)
      const easedProgress = Easing.easeOutElastic(progress);
      
      node.animProgress = progress;
      node.x = node.startX + (node.targetX - node.startX) * easedProgress;
      node.y = node.startY + (node.targetY - node.startY) * easedProgress;
      node.glowIntensity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.checkBuildCompletion();
      }
    };
    
    requestAnimationFrame(animate);
  }

  private checkBuildCompletion(): void {
    const allComplete = Array.from(this.nodes.values()).every(n => n.animProgress >= 1);
    if (allComplete && this.isBuilding) {
      this.isBuilding = false;
      this.buildProgress = 1;
      this.bakeStatic();
      if (this.onBuildComplete) {
        this.onBuildComplete();
      }
    }
  }

  /**
   * Bake static elements to offscreen canvas (from classic engine)
   */
  private bakeStatic(): void {
    const W = this.canvas.width / (window.devicePixelRatio || 1);
    const H = this.canvas.height / (window.devicePixelRatio || 1);
    
    this.staticCanvas.width = this.canvas.width;
    this.staticCanvas.height = this.canvas.height;
    this.staticCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    
    const ctx = this.staticCtx;
    ctx.clearRect(0, 0, W, H);

    // Radial background gradient (from radial engine)
    const gradient = ctx.createRadialGradient(
      W * 0.5, H * 0.5, 0,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.7
    );
    gradient.addColorStop(0, '#1e1b4b'); // Deep navy
    gradient.addColorStop(0.6, '#312e81'); // Purple navy
    gradient.addColorStop(1, '#0f0f23');   // Very dark navy
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Subtle animated grid (from radial engine)
    ctx.save();
    ctx.globalAlpha = 0.05 + Math.sin(this.time * 0.5) * 0.02;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 0.5;
    
    const gridSize = 40;
    for (let x = 0; x <= W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Background particles (from radial engine)
    this.renderBackgroundParticles(ctx);

    // Draw edges with radial styling
    for (const edge of this.graph.edges) {
      this.drawUnifiedEdge(ctx, edge);
    }

    // Draw nodes with radial styling
    for (const node of this.nodes.values()) {
      this.drawUnifiedNode(ctx, node);
    }
  }

  /**
   * Draw edge with radial visual styling
   */
  private drawUnifiedEdge(ctx: CanvasRenderingContext2D, edge: { from: Node; to: Node; path: Point[]; tint: string }): void {
    const fromNode = this.nodes.get(edge.from.id);
    const toNode = this.nodes.get(edge.to.id);
    
    if (!fromNode || !toNode || fromNode.animProgress <= 0 || toNode.animProgress <= 0) return;
    
    const path = edge.path;
    
    ctx.save();
    
    // Connection opacity based on animation progress
    const opacity = Math.min(fromNode.animProgress, toNode.animProgress) * 
                   Math.min(fromNode.connectionOpacity || 1, toNode.connectionOpacity || 1);
    
    if (opacity <= 0) {
      ctx.restore();
      return;
    }
    
    ctx.globalAlpha = opacity;
    
    // Dynamic connection styling (from radial engine)
    const isToRouter = toNode.type === 'router';
    const baseColor = isToRouter ? '#06b6d4' : '#10b981'; // Cyan for to-router, green for to-model
    
    // Draw connection with glow
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Soft glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = baseColor;
    
    // Dotted line for modern aesthetic
    ctx.setLineDash([5, 10]);
    
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Draw node with radial visual styling
   */
  private drawUnifiedNode(ctx: CanvasRenderingContext2D, node: UnifiedNode): void {
    if (node.animProgress <= 0) return;
    
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.scale(node.hoverScale, node.hoverScale);
    
    const radius = node.r * node.animProgress;
    const colors = this.getNodeColors(node);
    
    // Render glow based on node type and state
    if (node.glowIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = node.glowIntensity * 0.6;
      ctx.shadowBlur = radius * 2;
      ctx.shadowColor = colors.glow;
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, PI2);
      ctx.fill();
      ctx.restore();
    }
    
    // Main node body with gradient (from radial engine)
    const gradient = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0,
      0, 0, radius
    );
    gradient.addColorStop(0, colors.inner);
    gradient.addColorStop(0.7, colors.middle);
    gradient.addColorStop(1, colors.outer);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, PI2);
    ctx.fill();
    
    // Node border with pulsing effect
    const pulseIntensity = 0.5 + Math.sin(node.pulsePhase) * 0.5;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = node.type === 'router' ? 4 : 2;
    ctx.globalAlpha = pulseIntensity;
    ctx.stroke();
    
    // Node icon or label (from radial engine)
    this.renderNodeContent(ctx, node, radius, colors);
    
    ctx.restore();
  }

  private getNodeColors(node: UnifiedNode) {
    // Use radial engine color scheme
    switch (node.type) {
      case 'router':
        return {
          glow: '#8b5cf6',
          inner: '#f3f4f6',
          middle: '#c084fc',
          outer: '#7c3aed',
          border: '#8b5cf6',
          text: '#ffffff'
        };
      case 'ugroup':
        return {
          glow: '#06b6d4',
          inner: '#f0f9ff',
          middle: '#67e8f9',
          outer: '#0891b2',
          border: '#06b6d4',
          text: '#ffffff'
        };
      case 'model':
        return {
          glow: '#10b981',
          inner: '#f0fdf4',
          middle: '#6ee7b7',
          outer: '#059669',
          border: '#10b981',
          text: '#ffffff'
        };
      default:
        return {
          glow: '#6b7280',
          inner: '#f9fafb',
          middle: '#d1d5db',
          outer: '#4b5563',
          border: '#6b7280',
          text: '#ffffff'
        };
    }
  }

  private renderNodeContent(ctx: CanvasRenderingContext2D, node: UnifiedNode, radius: number, colors: any): void {
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Different content based on node type (from radial engine)
    switch (node.type) {
      case 'router':
        // Router icon (hexagon with center dot)
        ctx.save();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2;
        
        // Hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * PI2) / 6;
          const x = Math.cos(angle) * radius * 0.4;
          const y = Math.sin(angle) * radius * 0.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.1, 0, PI2);
        ctx.fill();
        
        ctx.restore();
        break;
        
      case 'ugroup':
        // User group icon
        ctx.font = `${radius * 0.8}px Arial`;
        ctx.fillText('👥', 0, 0);
        break;
        
      case 'model':
        // Model icon
        ctx.font = `${radius * 0.8}px Arial`;
        ctx.fillText('🧠', 0, 0);
        break;
    }
    
    // Label below node if not too small
    if (radius > 20 && node.animProgress > 0.8) {
      ctx.font = '10px Arial';
      ctx.fillStyle = colors.border;
      ctx.fillText(node.id.substring(0, 8), 0, radius + 15);
    }
  }

  private renderBackgroundParticles(ctx: CanvasRenderingContext2D): void {
    this.backgroundParticles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      // Soft glow effect
      ctx.shadowBlur = particle.size * 4;
      ctx.shadowColor = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, PI2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  public startBuild(onComplete?: () => void): void {
    this.onBuildComplete = onComplete;
    this.start();
  }

  public start(): void {
    if (this.animationId) return;
    this.lastTime = performance.now();
    this.animate();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (currentTime: number = performance.now()): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.time += deltaTime * 0.001;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(deltaTime: number): void {
    // Update background particles
    this.backgroundParticles.forEach(particle => {
      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;
      
      // Wrap around screen
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      const height = this.canvas.height / (window.devicePixelRatio || 1);
      
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
    });
    
    // Update nodes
    this.nodes.forEach(node => {
      node.pulsePhase += deltaTime * 0.003;
      
      // Smooth hover scaling
      const targetScale = node.isHovered ? 1.2 : 1;
      node.hoverScale += (targetScale - node.hoverScale) * 0.15;
      
      // Update drag if dragging
      if (this.isDragging && this.dragNode === node) {
        node.x = this.mouseX - node.dragOffset.x;
        node.y = this.mouseY - node.dragOffset.y;
      }
    });
    
    // Update signals
    this.signals.forEach(signal => {
      signal.particles.forEach(particle => {
        particle.x += particle.vx * deltaTime * 0.01;
        particle.y += particle.vy * deltaTime * 0.01;
        particle.life -= deltaTime * 0.001;
        particle.opacity = Math.max(0, particle.life);
        
        // Add to trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 10) {
          particle.trail.shift();
        }
      });
      
      // Remove dead particles
      signal.particles = signal.particles.filter(p => p.life > 0);
    });
  }

  private render(): void {
    if (this.isBuilding) {
      this.renderBuild();
    } else {
      this.renderRunning();
    }
  }

  private renderBuild(): void {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Background (from radial engine)
    const gradient = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.6, '#312e81');
    gradient.addColorStop(1, '#0f0f23');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Background particles during build
    this.renderBackgroundParticles(ctx);
    
    // Render animated edges and nodes
    for (const edge of this.graph.edges) {
      this.drawUnifiedEdge(ctx, edge);
    }
    
    for (const node of this.nodes.values()) {
      this.drawUnifiedNode(ctx, node);
    }
  }

  private renderRunning(): void {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    // Clear and draw static canvas
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.staticCanvas, 0, 0);
    
    // Draw animated signals
    this.renderSignals(ctx);
    
    // Draw interactive elements
    this.renderInteractiveElements(ctx);
  }

  private renderSignals(ctx: CanvasRenderingContext2D): void {
    this.signals.forEach(signal => {
      signal.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        
        // Render particle trail
        if (particle.trail.length > 1) {
          const trailGradient = ctx.createLinearGradient(
            particle.trail[0].x, particle.trail[0].y,
            particle.trail[particle.trail.length - 1].x, 
            particle.trail[particle.trail.length - 1].y
          );
          trailGradient.addColorStop(0, 'transparent');
          trailGradient.addColorStop(1, particle.color);
          
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = particle.size * 0.5;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          particle.trail.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
        }
        
        // Render particle
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = particle.size * 3;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, PI2);
        ctx.fill();
        
        ctx.restore();
      });
    });
  }

  private renderInteractiveElements(ctx: CanvasRenderingContext2D): void {
    // Render hover tooltip
    this.nodes.forEach(node => {
      if (node.isHovered && node.animProgress > 0.8) {
        this.renderTooltip(ctx, node);
      }
    });
    
    // Render connection highlights
    if (this.dragNode) {
      this.renderConnectionHighlights(ctx, this.dragNode);
    }
  }

  private renderTooltip(ctx: CanvasRenderingContext2D, node: UnifiedNode): void {
    const tooltipText = `${node.type.toUpperCase()}: ${node.id}`;
    const padding = 8;
    
    ctx.font = '12px Arial';
    const textWidth = ctx.measureText(tooltipText).width;
    
    const tooltipX = node.x + node.r + 10;
    const tooltipY = node.y - 15;
    
    // Tooltip background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(
      tooltipX - padding,
      tooltipY - padding,
      textWidth + padding * 2,
      20 + padding * 2,
      5
    );
    ctx.fill();
    
    // Tooltip text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tooltipText, tooltipX, tooltipY + 10);
  }

  private renderConnectionHighlights(ctx: CanvasRenderingContext2D, node: UnifiedNode): void {
    const connections = this.graph.edges.filter(e => 
      e.from.id === node.id || e.to.id === node.id
    );
    
    connections.forEach(edge => {
      const otherNode = this.nodes.get(
        edge.from.id === node.id ? edge.to.id : edge.from.id
      );
      
      if (otherNode) {
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(otherNode.x, otherNode.y);
        ctx.stroke();
        
        ctx.restore();
      }
    });
  }

  // Event handlers (from radial engine)
  private handleMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
    
    const clickedNode = this.getNodeAt(this.mouseX, this.mouseY);
    if (clickedNode) {
      this.isDragging = true;
      this.dragNode = clickedNode;
      clickedNode.dragOffset = {
        x: this.mouseX - clickedNode.x,
        y: this.mouseY - clickedNode.y
      };
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
    
    // Update hover states
    this.nodes.forEach(node => {
      const dist = Math.sqrt(
        (node.x - this.mouseX) ** 2 + (node.y - this.mouseY) ** 2
      );
      node.isHovered = dist <= node.r * node.hoverScale;
      
      // Update connection opacity for hovered nodes
      if (node.isHovered) {
        node.connectionOpacity = 1;
      } else {
        node.connectionOpacity = 0.3;
      }
    });
    
    // Update cursor
    const hoveredNode = this.getNodeAt(this.mouseX, this.mouseY);
    this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  }

  private handleMouseUp(): void {
    if (this.isDragging && this.dragNode) {
      // Spring back to original position unless pinned
      if (!this.dragNode.isPinned) {
        this.springNodeToPosition(this.dragNode);
      }
    }
    
    this.isDragging = false;
    this.dragNode = null;
  }

  private handleMouseLeave(): void {
    this.nodes.forEach(node => {
      node.isHovered = false;
      node.connectionOpacity = 1;
    });
    this.isDragging = false;
    this.dragNode = null;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.5, Math.min(3, this.zoom * delta));
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedNode = this.getNodeAt(x, y);
    if (clickedNode) {
      // Toggle pin state
      clickedNode.isPinned = !clickedNode.isPinned;
      
      // Highlight connections
      this.highlightNodeConnections(clickedNode);
    }
  }

  private getNodeAt(x: number, y: number): UnifiedNode | null {
    for (const node of this.nodes.values()) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist <= node.r * node.hoverScale) {
        return node;
      }
    }
    return null;
  }

  private springNodeToPosition(node: UnifiedNode): void {
    const startTime = performance.now();
    const duration = 500;
    const startX = node.x;
    const startY = node.y;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = Easing.easeOutBack(progress);
      
      node.x = startX + (node.targetX - startX) * easedProgress;
      node.y = startY + (node.targetY - startY) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  private highlightNodeConnections(node: UnifiedNode): void {
    // Reset all connection opacities
    this.nodes.forEach(n => n.connectionOpacity = 0.2);
    
    // Highlight connected nodes
    const connections = this.graph.edges.filter(e => 
      e.from.id === node.id || e.to.id === node.id
    );
    
    connections.forEach(edge => {
      const otherNodeId = edge.from.id === node.id ? edge.to.id : edge.from.id;
      const otherNode = this.nodes.get(otherNodeId);
      if (otherNode) {
        otherNode.connectionOpacity = 1;
      }
    });
    
    node.connectionOpacity = 1;
  }

  private repositionNodes(): void {
    // Recalculate Manhattan positions when canvas resizes
    const rect = this.canvas.getBoundingClientRect();
    this.leftX = rect.width * 0.20;
    this.rightX = rect.width * 0.80;
    this.centerX = rect.width * 0.5;
    
    // Update node positions - would need to regenerate the graph
    // For now, just update targets to current positions
    this.nodes.forEach((node) => {
      node.targetX = node.x;
      node.targetY = node.y;
    });
  }

  // Public methods
  public addSignal(fromId: string, toId: string): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (!fromNode || !toNode) return;
    
    const signal: UnifiedSignal = {
      id: `signal_${Date.now()}_${Math.random()}`,
      path: [
        { x: fromNode.x, y: fromNode.y },
        { x: toNode.x, y: toNode.y }
      ],
      speed: 0.02,
      seg: 0,
      t: 0,
      dead: false,
      colorOut: '#06b6d4',
      colorBack: '#10b981',
      splitIndex: 1,
      particles: this.createSignalParticles(fromNode, toNode),
      intensity: 1,
      pulseSpeed: 0.01
    };
    
    this.signals.push(signal);
  }

  private createSignalParticles(fromNode: UnifiedNode, toNode: UnifiedNode): any[] {
    const particles = [];
    const particleCount = 5;
    
    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      particles.push({
        x: fromNode.x + (toNode.x - fromNode.x) * progress,
        y: fromNode.y + (toNode.y - fromNode.y) * progress,
        vx: (toNode.x - fromNode.x) * 0.01,
        vy: (toNode.y - fromNode.y) * 0.01,
        life: 1,
        size: 2 + Math.random() * 2,
        opacity: 1,
        color: '#06b6d4',
        trail: []
      });
    }
    
    return particles;
  }

  public clear(): void {
    this.nodes.clear();
    this.signals = [];
    this.isBuilding = false;
    this.buildProgress = 0;
  }

  public resize(width: number, height: number): void {
    this.setupCanvas();
    this.repositionNodes();
  }
  
  // Compatibility methods for simulation engine
  public getSignalCount(): number {
    return this.signals.length;
  }
}