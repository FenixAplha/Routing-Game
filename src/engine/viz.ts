// engine/viz.ts
import { Graph } from './graph';
import { Node, Signal, Point } from '../calc/types';

const PI2 = Math.PI * 2;

/**
 * Signal class for animated particles
 */
export class AnimatedSignal implements Signal {
  public id: string;
  public path: Point[];
  public speed: number;
  public seg = 0;
  public t = 0;
  public dead = false;
  public colorOut: string;
  public colorBack: string;
  public splitIndex: number;
  public onDone?: () => void;

  constructor(
    id: string,
    points: Point[],
    speed: number,
    colorOut: string,
    colorBack: string,
    splitIndex: number,
    onDone?: () => void
  ) {
    this.id = id;
    this.path = points;
    this.speed = speed;
    this.colorOut = colorOut;
    this.colorBack = colorBack;
    this.splitIndex = splitIndex;
    this.onDone = onDone;
  }

  step(dt: number): void {
    let remain = this.speed * dt;
    
    while (remain > 0 && !this.dead) {
      const p0 = this.path[this.seg];
      const p1 = this.path[this.seg + 1];
      
      if (!p1) {
        this.dead = true;
        if (this.onDone) this.onDone();
        break;
      }

      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1e-6;
      const left = (1 - this.t) * L;

      if (remain < left) {
        this.t += remain / L;
        remain = 0;
      } else {
        remain -= left;
        this.seg++;
        this.t = 0;
      }
    }
  }

  xy(): Point {
    const p0 = this.path[this.seg];
    const p1 = this.path[this.seg + 1] || p0;
    return {
      x: p0.x + (p1.x - p0.x) * this.t,
      y: p0.y + (p1.y - p0.y) * this.t,
    };
  }

  color(): string {
    return this.seg < this.splitIndex ? this.colorOut : this.colorBack;
  }
}

/**
 * Utility to fit canvas to container
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  aspectRatio = 16/9,
  padding = 0
): void {
  const container = canvas.parentElement;
  if (!container) return;

  const containerWidth = container.clientWidth - padding * 2;
  const maxHeight = Math.max(360, window.innerHeight - 220);
  
  let width = Math.floor(containerWidth);
  let height = Math.floor(width / aspectRatio);
  
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.floor(height * aspectRatio);
  }
  
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}

/**
 * Visualization engine
 */
export class VizEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private staticCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;
  
  public graph = new Graph();
  public signals: AnimatedSignal[] = [];
  
  private lastTime = 0;
  private rafId: number | null = null;
  
  // Build animation
  public mode: 'build' | 'run' = 'build';
  private buildT = 0;
  private buildDuration = 1.0;
  private center: Point;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    
    this.staticCanvas = document.createElement('canvas');
    this.staticCtx = this.staticCanvas.getContext('2d', { alpha: false })!;
    
    this.center = { x: canvas.width / 2, y: canvas.height / 2 };
  }

  /**
   * Clear and reset the engine
   */
  clear(): void {
    this.graph.clear();
    this.signals = [];
    this.mode = 'build';
    this.buildT = 0;
  }

  /**
   * Start the build animation
   */
  startBuild(): void {
    this.mode = 'build';
    this.buildT = 0;
    this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  }

  /**
   * Bake static elements to offscreen canvas
   */
  bakeStatic(): void {
    const W = this.canvas.width;
    const H = this.canvas.height;
    
    this.staticCanvas.width = W;
    this.staticCanvas.height = H;
    
    const ctx = this.staticCtx;
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const gradient = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.95);
    gradient.addColorStop(0, 'rgba(124,58,237,0.18)');
    gradient.addColorStop(1, '#0b1020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 1;
    const cellSize = 44;

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

    // Draw edges (rails)
    for (const edge of this.graph.edges) {
      this.drawEdge(ctx, edge);
    }

    // Draw nodes
    for (const node of this.graph.nodes) {
      this.drawNode(ctx, node, node.r);
    }
  }

  /**
   * Draw an edge (rail)
   */
  private drawEdge(ctx: CanvasRenderingContext2D, edge: { path: Point[]; tint: string }): void {
    const path = edge.path;
    
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shadow
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(path[0].x + 0.5, path[0].y + 0.5);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x + 0.5, path[i].y + 0.5);
    }
    ctx.stroke();

    // Main line
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = edge.tint;
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(path[0].x + 0.5, path[0].y + 0.5);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x + 0.5, path[i].y + 0.5);
    }
    ctx.stroke();

    // Highlight
    ctx.lineWidth = 2.25;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.setLineDash([2, 14]);
    ctx.beginPath();
    ctx.moveTo(path[0].x + 0.5, path[0].y + 0.5);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x + 0.5, path[i].y + 0.5);
    }
    ctx.stroke();

    // Arrowhead
    if (path.length >= 2) {
      const a = path[path.length - 2];
      const b = path[path.length - 1];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const size = 9;

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(
        b.x - size * Math.cos(angle - 0.35),
        b.y - size * Math.sin(angle - 0.35)
      );
      ctx.lineTo(
        b.x - size * Math.cos(angle + 0.35),
        b.y - size * Math.sin(angle + 0.35)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw a node
   */
  private drawNode(ctx: CanvasRenderingContext2D, node: Node, radius: number): void {
    ctx.save();
    ctx.translate(node.x + 0.5, node.y + 0.5);

    const baseColor = node.type === 'ugroup' ? '#00d4ff' : 
                     node.type === 'router' ? '#7c3aed' : '#22c55e';

    // Glow
    ctx.shadowBlur = 18;
    ctx.shadowColor = baseColor;

    // Node gradient
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.15, baseColor + 'cc');
    gradient.addColorStop(1, baseColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, PI2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();

    // Icon
    if (node.icon) {
      ctx.fillStyle = '#0b1020';
      ctx.font = '700 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, 0, 0);
    }

    // User group size indicator
    if (node.type === 'ugroup' && node.size && radius > 10) {
      const capped = Math.min(10, node.size);
      const R = radius + 3;
      const ticks = capped;

      ctx.save();
      ctx.rotate(-Math.PI / 2);
      for (let i = 0; i < ticks; i++) {
        const angle = i * (PI2 / ticks);
        ctx.save();
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(R, 0);
        ctx.lineTo(R + 7, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Size badge
      const text = node.size > 9 ? '10' : String(node.size);
      const badgeX = radius - 2;
      const badgeY = radius - 2;

      ctx.fillStyle = 'rgba(20,27,45,.96)';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 9, 0, PI2);
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 9, 0, PI2);
      ctx.stroke();

      ctx.fillStyle = '#e6ecff';
      ctx.font = '700 10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, badgeX, badgeY + 0.5);
    }

    ctx.restore();
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ease out cubic
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Draw build animation
   */
  private drawBuild(dt: number): void {
    this.buildT = Math.min(1, this.buildT + dt / this.buildDuration);
    const t = this.easeOutCubic(this.buildT);

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    const gradient = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.95);
    gradient.addColorStop(0, 'rgba(124,58,237,0.18)');
    gradient.addColorStop(1, '#0b1020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Animate edges growing from center
    for (const edge of this.graph.edges) {
      const fromPos = {
        x: this.lerp(this.center.x, edge.from.x, t),
        y: this.lerp(this.center.y, edge.from.y, t),
      };
      const toPos = {
        x: this.lerp(this.center.x, edge.to.x, t),
        y: this.lerp(this.center.y, edge.to.y, t),
      };

      // Create path for current positions
      const midX = (fromPos.x + toPos.x) / 2;
      const animatedPath = [
        { x: fromPos.x, y: fromPos.y },
        { x: midX, y: fromPos.y },
        { x: midX, y: toPos.y },
        { x: toPos.x, y: toPos.y },
      ];

      this.drawEdge(ctx, { path: animatedPath, tint: edge.tint });
    }

    // Animate nodes scaling and moving from center
    for (const node of this.graph.nodes) {
      const animatedNode = {
        ...node,
        x: this.lerp(this.center.x, node.x, t),
        y: this.lerp(this.center.y, node.y, t),
      };
      const animatedRadius = node.r * t;

      this.drawNode(ctx, animatedNode, animatedRadius);
    }

    if (this.buildT >= 1) {
      this.mode = 'run';
      this.bakeStatic();
    }
  }

  /**
   * Main animation loop
   */
  frame(timestamp: number): void {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (this.mode === 'build') {
      this.drawBuild(dt);
    } else {
      // Running mode - draw static canvas + animated signals
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(this.staticCanvas, 0, 0);

      // Update and draw signals
      for (const signal of this.signals) {
        signal.step(dt);
      }

      // Remove dead signals
      this.signals = this.signals.filter(s => !s.dead);

      // Draw signals
      for (const signal of this.signals) {
        const pos = signal.xy();
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, PI2);
        ctx.fillStyle = signal.color();
        ctx.shadowColor = signal.color();
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();
      }
    }

    this.rafId = requestAnimationFrame(this.frame.bind(this));
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (!this.rafId) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.frame.bind(this));
    }
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Add a round-trip signal
   */
  addRoundTripSignal(
    edges: { path: Point[] }[],
    speed = 650,
    colorOut = 'rgb(159,210,255)',
    colorBack = 'rgb(255,224,102)',
    onDone?: () => void
  ): void {
    // Build forward path
    const forward: Point[] = [];
    for (const edge of edges) {
      const path = edge.path;
      if (forward.length === 0) {
        forward.push(...path);
      } else {
        // Skip first point if it matches the last point of the previous path
        if (forward.length && path.length && 
            forward[forward.length - 1].x === path[0].x && 
            forward[forward.length - 1].y === path[0].y) {
          forward.push(...path.slice(1));
        } else {
          forward.push(...path);
        }
      }
    }

    if (forward.length < 2) return;

    // Build return path (reverse, excluding the final point)
    const back = forward.slice(0, -1).reverse();
    const fullPath = [...forward, ...back];
    const splitIndex = forward.length - 1;

    const signal = new AnimatedSignal(
      `signal_${Date.now()}_${Math.random()}`,
      fullPath,
      speed,
      colorOut,
      colorBack,
      splitIndex,
      onDone
    );

    this.signals.push(signal);
  }

  /**
   * Get signal count
   */
  getSignalCount(): number {
    return this.signals.length;
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.center = { x: width / 2, y: height / 2 };
    
    if (this.mode === 'run') {
      this.bakeStatic();
    }
  }
}
