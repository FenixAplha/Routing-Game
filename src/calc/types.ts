// calc/types.ts
export type ID = string;

export interface Profile {
  id: ID;
  name: string;
  avgReqsPerUserPerSec: number;
  distribution: 'poisson' | 'bounded-normal' | 'fixed' | 'custom';
  distributionParams?: Record<string, number>;
  promptTokenMean: number;
  completionTokenMean: number;
  promptCompletionRatio?: number;
}

export interface Group {
  id: ID;
  label: string;
  size: number; // <= 10
  profileId: ID;
}

export interface Router {
  id: ID;
  layer: number;
  name: string;
  feePct: number; // e.g., 0.075 for +7.5%
  enabled: boolean;
}

export interface Model {
  id: ID;
  name: string;
  pricePer1kTokensUSD: number;
  minBillableTokens?: number;
  energyPerTokenWh?: number;
  energyPerRequestWh?: number;
  weight?: number;
}

export interface SustainAssumptions {
  phoneChargeWh: number; // 12
  householdKWhPerDay: number; // 10
  gridKgCO2ePerKWh: number; // 0.40
}

export interface RunConfig {
  id: ID;
  createdAt: string;
  seed: number;
  captureSeconds: number; // 10
  universalUserName: string; // e.g. "Researchers"
  totalUsers: number; // grouped by 10
  routerLayers: number;
  routers: Router[]; // with layer indices
  models: Model[];
  profiles: Profile[];
  groups: Group[];
  sustain: SustainAssumptions;
}

export interface RunRecord {
  id: ID;
  configId: ID;
  startedAt: string;
  durationSeconds: number;
  drainedUntil: string;
  forwards: number;
  returns: number;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  modelCostUSD: number; // excludes commission
  commissionUSD: number; // sum(router fees)
  energyWh: number;
  co2eKg: number;
  phoneCharges: number;
  householdHours: number;
  byGroup?: Record<ID, GroupStats>;
  byRouter?: Record<ID, RouterStats>;
  byModel?: Record<ID, ModelStats>;
}

export interface GroupStats {
  forwards: number;
  returns: number;
  tokensTotal: number;
}

export interface RouterStats {
  traversals: number;
  commissionUSD: number;
}

export interface ModelStats {
  forwards: number;
  requests: number;
  tokensTotal: number;
  costUSD: number;
  modelCostUSD: number;
}

// Visualization types
export interface Node {
  id: ID;
  type: 'ugroup' | 'router' | 'model';
  x: number;
  y: number;
  r: number;
  icon?: string;
  size?: number;
  gid?: string;
  layerIndex?: number;
  modelId?: string;
}

export interface Edge {
  id: ID;
  from: Node;
  to: Node;
  path: Point[];
  tint: string;
}

export interface Point {
  x: number;
  y: number;
}

// Simulation types
export interface Signal {
  id: ID;
  path: Point[];
  speed: number;
  seg: number;
  t: number;
  dead: boolean;
  colorOut: string;
  colorBack: string;
  splitIndex: number;
  onDone?: () => void;
}

export interface SimulationState {
  phase: 'building' | 'idle' | 'running' | 'drain' | 'done';
  t: number;
  duration: number;
  forwards: number;
  returns: number;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  modelCostUSD: number;
  commissionUSD: number;
  energyWh: number;
  perGroupAcc: Map<string, number>;
  maxConcurrent: number;
}
