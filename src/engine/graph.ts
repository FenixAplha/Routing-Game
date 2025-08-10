// engine/graph.ts
import { Node, Edge, Point, RunConfig, Group, Router, Model } from '../calc/types';
import { SeededRandom } from './rng';

/**
 * Graph class for managing nodes and edges
 */
export class Graph {
  public nodes: Node[] = [];
  public edges: Edge[] = [];
  private _idCounter = 0;

  constructor() {}

  /**
   * Add a node to the graph
   */
  addNode(node: Omit<Node, 'id'>): Node {
    const fullNode: Node = {
      id: `n_${++this._idCounter}`,
      ...node,
    };
    this.nodes.push(fullNode);
    return fullNode;
  }

  /**
   * Add an edge between two nodes
   */
  addEdge(from: Node, to: Node, path: Point[]): Edge {
    const tint = to.type === 'router' ? '#a78bfa' : '#34d399';
    const edge: Edge = {
      id: `e_${from.id}_${to.id}`,
      from,
      to,
      path,
      tint,
    };
    this.edges.push(edge);
    return edge;
  }

  /**
   * Find edge between two nodes
   */
  findEdge(from: Node, to: Node): Edge | undefined {
    return this.edges.find(e => e.from.id === from.id && e.to.id === to.id);
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes = [];
    this.edges = [];
    this._idCounter = 0;
  }
}

/**
 * Create Manhattan-style path between two points
 */
export function createManhattanPath(from: Point, to: Point): Point[] {
  const midX = (from.x + to.x) / 2;
  return [
    { x: from.x, y: from.y },
    { x: midX, y: from.y },
    { x: midX, y: to.y },
    { x: to.x, y: to.y },
  ];
}

/**
 * Build graph from configuration
 */
export function buildGraph(
  config: RunConfig,
  canvasWidth: number,
  canvasHeight: number,
  rng: SeededRandom,
  keepScatter = false,
  lastScatterSeed?: number
): Graph {
  const graph = new Graph();

  // Use existing scatter seed or generate new one
  const scatterSeed = keepScatter && lastScatterSeed ? lastScatterSeed : Math.floor(rng.random() * 1000000);
  const scatterRng = rng; // For now, use the same RNG

  const leftX = canvasWidth * 0.20;
  const rightX = canvasWidth * 0.80;
  const centerX = canvasWidth * 0.5;

  // Create user groups (max 10 users each)
  const groupNodes: Node[] = [];
  const groups = Math.ceil(config.totalUsers / 10);
  
  for (let i = 0; i < groups; i++) {
    const groupSize = Math.min(10, config.totalUsers - i * 10);
    const group = config.groups[i] || {
      id: `group_${i}`,
      label: `Group ${i + 1}`,
      size: groupSize,
      profileId: config.profiles[0]?.id || 'default',
    };

    const y = canvasHeight * 0.15 + (i / Math.max(1, groups - 1)) * canvasHeight * 0.7;
    const jitterX = scatterRng.randomRange(-canvasWidth * 0.03, canvasWidth * 0.03);
    const jitterY = scatterRng.randomRange(-20, 20);

    const node = graph.addNode({
      type: 'ugroup',
      x: leftX + jitterX,
      y: y + jitterY,
      r: 17,
      icon: '👥',
      size: groupSize,
      gid: group.id,
    });

    groupNodes.push(node);
  }

  // Create router layers
  const routerLayers: Node[][] = [];
  for (let layer = 0; layer < config.routerLayers; layer++) {
    const layerRouters = config.routers.filter(r => r.layer === layer && r.enabled);
    const layerNodes: Node[] = [];

    if (layerRouters.length > 0) {
      const layerX = config.routerLayers > 1 
        ? centerX - (canvasWidth * 0.08 * (config.routerLayers - 1)) / 2 + layer * canvasWidth * 0.08
        : centerX;

      for (let i = 0; i < layerRouters.length; i++) {
        const router = layerRouters[i];
        const y = canvasHeight * 0.2 + (i / Math.max(1, layerRouters.length - 1)) * canvasHeight * 0.6;
        const jitterY = scatterRng.randomRange(-8, 8);

        const node = graph.addNode({
          type: 'router',
          x: layerX,
          y: y + jitterY,
          r: 15,
          icon: '🛰️',
          layerIndex: layer,
        });

        layerNodes.push(node);
      }
    }

    routerLayers.push(layerNodes);
  }

  // Create model nodes
  const modelNodes: Node[] = [];
  for (let i = 0; i < config.models.length; i++) {
    const model = config.models[i];
    const y = canvasHeight * 0.15 + (i / Math.max(1, config.models.length - 1)) * canvasHeight * 0.7;
    const jitterX = scatterRng.randomRange(-canvasWidth * 0.02, canvasWidth * 0.02);
    const jitterY = scatterRng.randomRange(-8, 8);

    const node = graph.addNode({
      type: 'model',
      x: rightX + jitterX,
      y: y + jitterY,
      r: 17,
      icon: '◇',
      modelId: model.id, // Important: tag with the actual model ID
    });

    modelNodes.push(node);
  }

  // Create edges
  if (routerLayers.length === 0 || routerLayers.every(layer => layer.length === 0)) {
    // Direct user -> model connections
    for (const groupNode of groupNodes) {
      for (const modelNode of modelNodes) {
        const path = createManhattanPath(groupNode, modelNode);
        graph.addEdge(groupNode, modelNode, path);
      }
    }
  } else {
    // User -> First router layer
    for (const groupNode of groupNodes) {
      for (const routerNode of routerLayers[0]) {
        const path = createManhattanPath(groupNode, routerNode);
        graph.addEdge(groupNode, routerNode, path);
      }
    }

    // Router layer to router layer
    for (let i = 0; i < routerLayers.length - 1; i++) {
      for (const fromRouter of routerLayers[i]) {
        for (const toRouter of routerLayers[i + 1]) {
          const path = createManhattanPath(fromRouter, toRouter);
          graph.addEdge(fromRouter, toRouter, path);
        }
      }
    }

    // Last router layer -> Models
    const lastRouterLayer = routerLayers[routerLayers.length - 1];
    for (const routerNode of lastRouterLayer) {
      for (const modelNode of modelNodes) {
        const path = createManhattanPath(routerNode, modelNode);
        graph.addEdge(routerNode, modelNode, path);
      }
    }
  }

  return graph;
}

/**
 * Find path through graph for a request
 */
export function findRequestPath(
  graph: Graph,
  groupNode: Node,
  routerPath: Router[],
  targetModel: Model,
  rng: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  let currentNode = groupNode;

  // Go through each router layer
  for (const router of routerPath) {
    const routerNodes = graph.nodes.filter(
      n => n.type === 'router' && n.layerIndex === router.layer
    );
    
    if (routerNodes.length === 0) continue;
    
    // Pick a router from this layer (could be weighted in the future)
    const routerNode = rng.choice(routerNodes);
    const edge = graph.findEdge(currentNode, routerNode);
    
    if (edge) {
      edges.push(edge);
      currentNode = routerNode;
    }
  }

  // Final edge to model
  const modelNode = graph.nodes.find(n => n.type === 'model' && n.modelId === targetModel.id);
  if (modelNode) {
    const edge = graph.findEdge(currentNode, modelNode);
    if (edge) {
      edges.push(edge);
    }
  }

  return edges;
}
