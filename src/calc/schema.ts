// calc/schema.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avgReqsPerUserPerSec: z.number().min(0).max(10),
  distribution: z.enum(['poisson', 'bounded-normal', 'fixed', 'custom']),
  distributionParams: z.record(z.number()).optional(),
  promptTokenMean: z.number().min(1).max(10000),
  completionTokenMean: z.number().min(1).max(10000),
  promptCompletionRatio: z.number().positive().optional(),
});

export const GroupSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  size: z.number().int().min(1).max(10),
  profileId: z.string(),
});

export const RouterSchema = z.object({
  id: z.string(),
  layer: z.number().int().min(0),
  name: z.string().min(1),
  feePct: z.number().min(0).max(0.5), // 0-50%
  enabled: z.boolean(),
});

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  pricePer1kTokensUSD: z.number().min(0),
  minBillableTokens: z.number().int().positive().optional(),
  energyPerTokenWh: z.number().min(0).optional(),
  energyPerRequestWh: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
});

export const SustainAssumptionsSchema = z.object({
  phoneChargeWh: z.number().positive(),
  householdKWhPerDay: z.number().positive(),
  gridKgCO2ePerKWh: z.number().min(0),
});

export const RunConfigSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  seed: z.number(),
  captureSeconds: z.number().positive(),
  universalUserName: z.string().min(1),
  totalUsers: z.number().int().min(1),
  routerLayers: z.number().int().min(0),
  routers: z.array(RouterSchema),
  models: z.array(ModelSchema).min(1),
  profiles: z.array(ProfileSchema).min(1),
  groups: z.array(GroupSchema).min(1),
  sustain: SustainAssumptionsSchema,
});

export const RunRecordSchema = z.object({
  id: z.string(),
  configId: z.string(),
  startedAt: z.string(),
  durationSeconds: z.number(),
  drainedUntil: z.string(),
  forwards: z.number().int().min(0),
  returns: z.number().int().min(0),
  tokensPrompt: z.number().int().min(0),
  tokensCompletion: z.number().int().min(0),
  tokensTotal: z.number().int().min(0),
  modelCostUSD: z.number().min(0),
  commissionUSD: z.number().min(0),
  energyWh: z.number().min(0),
  co2eKg: z.number().min(0),
  phoneCharges: z.number().min(0),
  householdHours: z.number().min(0),
});

// Helper to validate total commission cap
export function validateTotalCommission(routers: z.infer<typeof RouterSchema>[]): boolean {
  const total = routers
    .filter(r => r.enabled)
    .reduce((sum, r) => sum + r.feePct, 0);
  return total <= 0.95; // 95% cap
}
