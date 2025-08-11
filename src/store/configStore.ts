// store/configStore.ts
import { create } from 'zustand';
import { RunConfig, Router, Model, Profile, Group, SustainAssumptions } from '../calc/types';
import { BUILTIN_PRESETS } from '../presets/builtin';
import { getDefaultSustainAssumptions } from '../calc/sustainability';
import { validateTotalCommission } from '../calc/schema';

interface ConfigState {
  config: RunConfig;
  isDirty: boolean;
  lastScatterSeed: number;
  
  // Actions
  setUniversalUserName: (name: string) => void;
  setTotalUsers: (count: number) => void;
  setRouterLayers: (layers: number) => void;
  setCaptureSeconds: (seconds: number) => void;
  setSeed: (seed: number) => void;
  
  // Router management
  addRouter: (layer: number) => void;
  updateRouter: (id: string, updates: Partial<Router>) => void;
  deleteRouter: (id: string) => void;
  
  // Model management
  addModel: () => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  deleteModel: (id: string) => void;
  
  // Profile management
  addProfile: () => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  
  // Group management
  updateGroup: (id: string, updates: Partial<Group>) => void;
  
  // Presets
  applyPreset: (presetId: string) => void;
  applyBuiltinPreset: (presetId: string) => void;
  
  // Sustainability
  updateSustainAssumptions: (updates: Partial<SustainAssumptions>) => void;
  
  // Utilities
  randomizeSeed: () => void;
  markClean: () => void;
  resetToDefaults: () => void;
  
  // Validation
  validateCommissionCap: () => boolean;
  getTotalCommissionRate: () => number;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultConfig(): RunConfig {
  const defaultPreset = BUILTIN_PRESETS[0]; // Zen Garden
  return defaultPreset.config();
}

function createDefaultRouter(layer: number, index: number): Router {
  return {
    id: generateId(),
    layer,
    name: `Router ${layer + 1}.${index + 1}`,
    feePct: 0.05,
    enabled: true,
  };
}

function createDefaultModel(): Model {
  return {
    id: generateId(),
    name: 'New Model',
    pricePer1kTokensUSD: 1.0,
    energyPerTokenWh: 0.1,
    weight: 1,
  };
}

function createDefaultProfile(): Profile {
  return {
    id: generateId(),
    name: 'New Profile',
    avgReqsPerUserPerSec: 0.2,
    distribution: 'poisson',
    promptTokenMean: 100,
    completionTokenMean: 200,
  };
}

function createGroupsFromUsers(totalUsers: number, profileId: string): Group[] {
  const groups: Group[] = [];
  const numGroups = Math.ceil(totalUsers / 10);
  
  for (let i = 0; i < numGroups; i++) {
    const size = Math.min(10, totalUsers - i * 10);
    groups.push({
      id: `group_${i}`,
      label: `Group ${i + 1}`,
      size,
      profileId,
    });
  }
  
  return groups;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: createDefaultConfig(),
  isDirty: false,
  lastScatterSeed: Math.random(),

  setUniversalUserName: (name: string) => {
    set(state => ({
      config: { ...state.config, universalUserName: name },
      isDirty: true,
    }));
  },

  setTotalUsers: (count: number) => {
    set(state => {
      const newGroups = createGroupsFromUsers(count, state.config.profiles[0]?.id || 'default');
      return {
        config: { 
          ...state.config, 
          totalUsers: count,
          groups: newGroups,
        },
        isDirty: true,
      };
    });
  },

  setRouterLayers: (layers: number) => {
    set(state => {
      // Remove routers from layers that no longer exist
      const newRouters = state.config.routers.filter(r => r.layer < layers);
      
      // Add default routers for new layers
      for (let layer = Math.max(0, state.config.routerLayers); layer < layers; layer++) {
        newRouters.push(createDefaultRouter(layer, 0));
      }
      
      return {
        config: {
          ...state.config,
          routerLayers: layers,
          routers: newRouters,
        },
        isDirty: true,
      };
    });
  },

  setCaptureSeconds: (seconds: number) => {
    set(state => ({
      config: { ...state.config, captureSeconds: seconds },
      isDirty: true,
    }));
  },

  setSeed: (seed: number) => {
    set(state => ({
      config: { ...state.config, seed },
      isDirty: true,
    }));
  },

  addRouter: (layer: number) => {
    set(state => {
      const layerRouters = state.config.routers.filter(r => r.layer === layer);
      const newRouter = createDefaultRouter(layer, layerRouters.length);
      
      return {
        config: {
          ...state.config,
          routers: [...state.config.routers, newRouter],
        },
        isDirty: true,
      };
    });
  },

  updateRouter: (id: string, updates: Partial<Router>) => {
    set(state => ({
      config: {
        ...state.config,
        routers: state.config.routers.map(r =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
      isDirty: true,
    }));
  },

  deleteRouter: (id: string) => {
    set(state => ({
      config: {
        ...state.config,
        routers: state.config.routers.filter(r => r.id !== id),
      },
      isDirty: true,
    }));
  },

  addModel: () => {
    set(state => ({
      config: {
        ...state.config,
        models: [...state.config.models, createDefaultModel()],
      },
      isDirty: true,
    }));
  },

  updateModel: (id: string, updates: Partial<Model>) => {
    set(state => ({
      config: {
        ...state.config,
        models: state.config.models.map(m =>
          m.id === id ? { ...m, ...updates } : m
        ),
      },
      isDirty: true,
    }));
  },

  deleteModel: (id: string) => {
    set(state => {
      const newModels = state.config.models.filter(m => m.id !== id);
      // Ensure at least one model remains
      if (newModels.length === 0) {
        newModels.push(createDefaultModel());
      }
      
      return {
        config: {
          ...state.config,
          models: newModels,
        },
        isDirty: true,
      };
    });
  },

  addProfile: () => {
    set(state => ({
      config: {
        ...state.config,
        profiles: [...state.config.profiles, createDefaultProfile()],
      },
      isDirty: true,
    }));
  },

  updateProfile: (id: string, updates: Partial<Profile>) => {
    set(state => ({
      config: {
        ...state.config,
        profiles: state.config.profiles.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
      isDirty: true,
    }));
  },

  deleteProfile: (id: string) => {
    set(state => {
      const newProfiles = state.config.profiles.filter(p => p.id !== id);
      // Ensure at least one profile remains
      if (newProfiles.length === 0) {
        newProfiles.push(createDefaultProfile());
      }
      
      // Update groups that were using the deleted profile
      const newGroups = state.config.groups.map(g =>
        g.profileId === id ? { ...g, profileId: newProfiles[0].id } : g
      );
      
      return {
        config: {
          ...state.config,
          profiles: newProfiles,
          groups: newGroups,
        },
        isDirty: true,
      };
    });
  },

  updateGroup: (id: string, updates: Partial<Group>) => {
    set(state => ({
      config: {
        ...state.config,
        groups: state.config.groups.map(g =>
          g.id === id ? { ...g, ...updates } : g
        ),
      },
      isDirty: true,
    }));
  },

  applyPreset: (presetId: string) => {
    // This would load from custom presets DB
    // For now, just apply builtin presets
    get().applyBuiltinPreset(presetId);
  },

  applyBuiltinPreset: (presetId: string) => {
    const preset = BUILTIN_PRESETS.find(p => p.id === presetId);
    if (preset) {
      set(state => ({
        config: preset.config(),
        isDirty: true,
        lastScatterSeed: Math.random(),
      }));
    }
  },

  updateSustainAssumptions: (updates: Partial<SustainAssumptions>) => {
    set(state => ({
      config: {
        ...state.config,
        sustain: { ...state.config.sustain, ...updates },
      },
      isDirty: true,
    }));
  },

  randomizeSeed: () => {
    set(state => ({
      config: {
        ...state.config,
        seed: Math.floor(Math.random() * 1000000),
      },
      isDirty: true,
    }));
  },

  markClean: () => {
    set({ isDirty: false });
  },

  resetToDefaults: () => {
    set({
      config: createDefaultConfig(),
      isDirty: false,
      lastScatterSeed: Math.random(),
    });
  },

  validateCommissionCap: () => {
    const { config } = get();
    return validateTotalCommission(config.routers);
  },

  getTotalCommissionRate: () => {
    const { config } = get();
    return config.routers
      .filter(r => r.enabled)
      .reduce((sum, r) => sum + r.feePct, 0);
  },
}));
