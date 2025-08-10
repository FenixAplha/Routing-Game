// presets/builtin.ts
import { RunConfig, Profile, Router, Model, Group } from '../calc/types';
import { getDefaultSustainAssumptions } from '../calc/sustainability';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default profiles
 */
function createProfiles(): Profile[] {
  return [
    {
      id: 'profile_zen',
      name: 'Zen Garden',
      avgReqsPerUserPerSec: 0.1,
      distribution: 'fixed',
      promptTokenMean: 50,
      completionTokenMean: 150,
    },
    {
      id: 'profile_hedgehog',
      name: 'Hedgehog Mode', 
      avgReqsPerUserPerSec: 0.3,
      distribution: 'bounded-normal',
      distributionParams: { promptStd: 20, completionStd: 100 },
      promptTokenMean: 80,
      completionTokenMean: 200,
    },
    {
      id: 'profile_chaos',
      name: 'Chaos Monkey',
      avgReqsPerUserPerSec: 0.25,
      distribution: 'custom',
      promptTokenMean: 120,
      completionTokenMean: 300,
    },
    {
      id: 'profile_coffee',
      name: 'Coffee Rush',
      avgReqsPerUserPerSec: 0.4,
      distribution: 'poisson',
      promptTokenMean: 30,
      completionTokenMean: 80,
    },
    {
      id: 'profile_townhall',
      name: 'Town Hall',
      avgReqsPerUserPerSec: 0.05,
      distribution: 'fixed',
      promptTokenMean: 200,
      completionTokenMean: 800,
    },
    {
      id: 'profile_launch',
      name: 'Launch Day',
      avgReqsPerUserPerSec: 0.8,
      distribution: 'poisson',
      promptTokenMean: 100,
      completionTokenMean: 250,
    },
  ];
}

/**
 * Create default models
 */
function createModels(): Model[] {
  return [
    {
      id: 'model_gpt4_mini',
      name: 'GPT-4o Mini',
      pricePer1kTokensUSD: 0.15,
      energyPerTokenWh: 0.05,
      weight: 3,
    },
    {
      id: 'model_gpt4',
      name: 'GPT-4o',
      pricePer1kTokensUSD: 2.5,
      energyPerTokenWh: 0.2,
      weight: 2,
    },
    {
      id: 'model_claude_haiku',
      name: 'Claude 3 Haiku',
      pricePer1kTokensUSD: 0.25,
      energyPerTokenWh: 0.08,
      weight: 2,
    },
    {
      id: 'model_claude_sonnet',
      name: 'Claude 3.5 Sonnet',
      pricePer1kTokensUSD: 3.0,
      energyPerTokenWh: 0.25,
      weight: 1,
    },
    {
      id: 'model_gemini_flash',
      name: 'Gemini 1.5 Flash',
      pricePer1kTokensUSD: 0.075,
      energyPerTokenWh: 0.03,
      weight: 4,
    },
  ];
}

/**
 * Create default routers
 */
function createRouters(layers: number): Router[] {
  const routers: Router[] = [];
  
  for (let layer = 0; layer < layers; layer++) {
    const routersPerLayer = layer === 0 ? 3 : 2; // First layer has more routers
    
    for (let i = 0; i < routersPerLayer; i++) {
      routers.push({
        id: `router_l${layer}_${i}`,
        layer,
        name: `Router ${layer + 1}.${i + 1}`,
        feePct: 0.05 + (layer * 0.025), // Higher fees for deeper layers
        enabled: true,
      });
    }
  }
  
  return routers;
}

/**
 * Create groups from total users
 */
function createGroups(totalUsers: number, profileId: string): Group[] {
  const groups: Group[] = [];
  const numGroups = Math.ceil(totalUsers / 10);
  
  for (let i = 0; i < numGroups; i++) {
    const groupSize = Math.min(10, totalUsers - i * 10);
    groups.push({
      id: `group_${i}`,
      label: `Group ${i + 1}`,
      size: groupSize,
      profileId,
    });
  }
  
  return groups;
}

/**
 * Create base configuration
 */
function createBaseConfig(
  name: string,
  totalUsers: number,
  routerLayers: number,
  profileId: string
): RunConfig {
  const profiles = createProfiles();
  const models = createModels();
  const routers = createRouters(routerLayers);
  const groups = createGroups(totalUsers, profileId);
  
  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    seed: Math.floor(Math.random() * 1000000),
    captureSeconds: 10,
    universalUserName: 'Researchers',
    totalUsers,
    routerLayers,
    routers,
    models,
    profiles,
    groups,
    sustain: getDefaultSustainAssumptions(),
  };
}

/**
 * Built-in preset configurations
 */
export const BUILTIN_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  config: () => RunConfig;
}> = [
  {
    id: 'zen_garden',
    name: 'Zen Garden',
    description: 'Slow & steady • Low throughput • Minimal router overhead',
    config: () => createBaseConfig('Zen Garden', 50, 1, 'profile_zen'),
  },
  {
    id: 'hedgehog_mode', 
    name: 'Hedgehog Mode',
    description: 'Spiky bursts • Variable load • Defensive routing',
    config: () => createBaseConfig('Hedgehog Mode', 80, 2, 'profile_hedgehog'),
  },
  {
    id: 'chaos_monkey',
    name: 'Chaos Monkey',
    description: 'Heavy-tailed • Unpredictable patterns • Stress test',
    config: () => createBaseConfig('Chaos Monkey', 100, 3, 'profile_chaos'),
  },
  {
    id: 'coffee_rush',
    name: 'Coffee Rush',
    description: 'Short prompts • High frequency • Quick responses',
    config: () => createBaseConfig('Coffee Rush', 120, 1, 'profile_coffee'),
  },
  {
    id: 'town_hall',
    name: 'Town Hall',
    description: 'Long conversations • Fewer requests • Deep thinking',
    config: () => createBaseConfig('Town Hall', 30, 2, 'profile_townhall'),
  },
  {
    id: 'launch_day',
    name: 'Launch Day',
    description: 'Maximum throughput • All systems go • Peak load',
    config: () => createBaseConfig('Launch Day', 200, 3, 'profile_launch'),
  },
];

/**
 * Get a preset by ID
 */
export function getPreset(id: string) {
  return BUILTIN_PRESETS.find(p => p.id === id);
}

/**
 * Get all preset summaries
 */
export function getPresetSummaries() {
  return BUILTIN_PRESETS.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}

/**
 * Create a custom preset from current config
 */
export function createCustomPreset(
  name: string,
  description: string,
  config: RunConfig
): {
  id: string;
  name: string;
  description: string;
  config: RunConfig;
} {
  return {
    id: `custom_${generateId()}`,
    name,
    description,
    config: {
      ...config,
      id: generateId(),
      createdAt: new Date().toISOString(),
    },
  };
}
