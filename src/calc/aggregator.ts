// calc/aggregator.ts
import { RunRecord, GroupStats, RouterStats, ModelStats, SustainAssumptions } from './types';
import { calculateEquivalents } from './sustainability';

/**
 * Aggregator for collecting metrics during simulation
 */
export class MetricsAggregator {
  public forwards = 0;
  public returns = 0;
  public tokensPrompt = 0;
  public tokensCompletion = 0;
  public modelCostUSD = 0;
  public commissionUSD = 0;
  public energyWh = 0;

  public byGroup = new Map<string, GroupStats>();
  public byRouter = new Map<string, RouterStats>();
  public byModel = new Map<string, ModelStats>();

  /**
   * Record a forward request
   */
  addForward(
    groupId: string,
    routerIds: string[],
    modelId: string,
    tokens: { prompt: number; completion: number; total: number },
    cost: { baseCost: number; commission: number },
    energyWh: number
  ): void {
    this.forwards++;
    this.tokensPrompt += tokens.prompt;
    this.tokensCompletion += tokens.completion;
    this.modelCostUSD += cost.baseCost;
    this.commissionUSD += cost.commission;
    this.energyWh += energyWh;

    // Track by group
    const groupStats = this.byGroup.get(groupId) || { forwards: 0, returns: 0, tokensTotal: 0 };
    groupStats.forwards++;
    groupStats.tokensTotal += tokens.total;
    this.byGroup.set(groupId, groupStats);

    // Track by router
    for (const routerId of routerIds) {
      const routerStats = this.byRouter.get(routerId) || { traversals: 0, commissionUSD: 0 };
      routerStats.traversals++;
      routerStats.commissionUSD += cost.commission / routerIds.length; // Split commission among routers
      this.byRouter.set(routerId, routerStats);
    }

    // Track by model
    const modelStats = this.byModel.get(modelId) || { requests: 0, tokensTotal: 0, costUSD: 0 };
    modelStats.requests++;
    modelStats.tokensTotal += tokens.total;
    modelStats.costUSD += cost.baseCost;
    this.byModel.set(modelId, modelStats);
  }

  /**
   * Record a return (completed round-trip)
   */
  addReturn(groupId: string): void {
    this.returns++;

    // Track by group
    const groupStats = this.byGroup.get(groupId) || { forwards: 0, returns: 0, tokensTotal: 0 };
    groupStats.returns++;
    this.byGroup.set(groupId, groupStats);
  }

  /**
   * Get current totals
   */
  getTotals() {
    return {
      forwards: this.forwards,
      returns: this.returns,
      tokensPrompt: this.tokensPrompt,
      tokensCompletion: this.tokensCompletion,
      tokensTotal: this.tokensPrompt + this.tokensCompletion,
      modelCostUSD: this.modelCostUSD,
      commissionUSD: this.commissionUSD,
      totalCostUSD: this.modelCostUSD + this.commissionUSD,
      energyWh: this.energyWh,
    };
  }

  /**
   * Create final run record
   */
  finalize(
    id: string,
    configId: string,
    startedAt: string,
    durationSeconds: number,
    drainedUntil: string,
    assumptions: SustainAssumptions
  ): RunRecord {
    const equivalents = calculateEquivalents(this.energyWh, assumptions);

    return {
      id,
      configId,
      startedAt,
      durationSeconds,
      drainedUntil,
      forwards: this.forwards,
      returns: this.returns,
      tokensPrompt: this.tokensPrompt,
      tokensCompletion: this.tokensCompletion,
      tokensTotal: this.tokensPrompt + this.tokensCompletion,
      modelCostUSD: this.modelCostUSD,
      commissionUSD: this.commissionUSD,
      energyWh: this.energyWh,
      co2eKg: equivalents.co2eKg,
      phoneCharges: equivalents.phoneCharges,
      householdHours: equivalents.householdHours,
      byGroup: Object.fromEntries(this.byGroup),
      byRouter: Object.fromEntries(this.byRouter),
      byModel: Object.fromEntries(this.byModel),
    };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.forwards = 0;
    this.returns = 0;
    this.tokensPrompt = 0;
    this.tokensCompletion = 0;
    this.modelCostUSD = 0;
    this.commissionUSD = 0;
    this.energyWh = 0;
    this.byGroup.clear();
    this.byRouter.clear();
    this.byModel.clear();
  }
}

/**
 * Helper to calculate cumulative metrics from multiple records
 */
export function calculateCumulativeMetrics(records: RunRecord[]) {
  const totals = {
    runs: records.length,
    forwards: 0,
    returns: 0,
    tokensTotal: 0,
    modelCostUSD: 0,
    commissionUSD: 0,
    energyWh: 0,
    co2eKg: 0,
    phoneCharges: 0,
    householdHours: 0,
  };

  for (const record of records) {
    totals.forwards += record.forwards;
    totals.returns += record.returns;
    totals.tokensTotal += record.tokensTotal;
    totals.modelCostUSD += record.modelCostUSD;
    totals.commissionUSD += record.commissionUSD;
    totals.energyWh += record.energyWh;
    totals.co2eKg += record.co2eKg;
    totals.phoneCharges += record.phoneCharges;
    totals.householdHours += record.householdHours;
  }

  return totals;
}
