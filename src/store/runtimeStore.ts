// store/runtimeStore.ts
import { create } from 'zustand';
import { RunRecord, SimulationState } from '../calc/types';
import { recordsDB } from '../db/records';

interface RuntimeState {
  // Simulation state
  simulationState: SimulationState;
  isRunning: boolean;
  
  // Run tracking
  currentRunId: string | null;
  startedAt: string | null;
  
  // Recent records
  recentRecords: RunRecord[];
  
  // Actions
  setSimulationState: (state: SimulationState) => void;
  startRun: (runId: string) => void;
  stopRun: () => void;
  completeRun: (record: RunRecord) => void;
  
  // Records management
  loadRecentRecords: () => Promise<void>;
  clearRecords: () => Promise<void>;
  exportRecordsJSON: () => Promise<string>;
  exportRecordsCSV: () => Promise<string>;
  
  // Progress tracking
  getProgress: () => number;
  getCurrentMetrics: () => {
    forwards: number;
    returns: number;
    tokensTotal: number;
    modelCostUSD: number;
    energyWh: number;
    avgRPS: number;
  };
}

function createInitialSimulationState(): SimulationState {
  return {
    phase: 'building',
    t: 0,
    duration: 10,
    forwards: 0,
    returns: 0,
    tokensPrompt: 0,
    tokensCompletion: 0,
    tokensTotal: 0,
    modelCostUSD: 0,
    commissionUSD: 0,
    energyWh: 0,
    perGroupAcc: new Map(),
    maxConcurrent: 48,
  };
}

export const useRuntimeStore = create<RuntimeState>((set, get) => ({
  simulationState: createInitialSimulationState(),
  isRunning: false,
  currentRunId: null,
  startedAt: null,
  recentRecords: [],

  setSimulationState: (simulationState: SimulationState) => {
    set({ simulationState });
  },

  startRun: (runId: string) => {
    set({
      isRunning: true,
      currentRunId: runId,
      startedAt: new Date().toISOString(),
      simulationState: {
        ...get().simulationState,
        phase: 'running',
        t: 0,
      },
    });
  },

  stopRun: () => {
    set(state => ({
      isRunning: false,
      simulationState: {
        ...state.simulationState,
        phase: 'done',
      },
    }));
  },

  completeRun: async (record: RunRecord) => {
    // Save to database
    await recordsDB.saveRecord(record);
    
    // Update state
    set(state => ({
      isRunning: false,
      currentRunId: null,
      startedAt: null,
      simulationState: {
        ...state.simulationState,
        phase: 'done',
      },
      recentRecords: [record, ...state.recentRecords.slice(0, 9)], // Keep last 10
    }));
  },

  loadRecentRecords: async () => {
    try {
      const records = await recordsDB.listRecords(10);
      set({ recentRecords: records });
    } catch (error) {
      console.error('Failed to load recent records:', error);
    }
  },

  clearRecords: async () => {
    try {
      await recordsDB.clearAllRecords();
      set({ recentRecords: [] });
    } catch (error) {
      console.error('Failed to clear records:', error);
      throw error;
    }
  },

  exportRecordsJSON: async () => {
    try {
      return await recordsDB.exportJSON();
    } catch (error) {
      console.error('Failed to export JSON:', error);
      throw error;
    }
  },

  exportRecordsCSV: async () => {
    try {
      return await recordsDB.exportCSV();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  },

  getProgress: () => {
    const { simulationState } = get();
    if (simulationState.phase === 'running') {
      return Math.min(1, simulationState.t / simulationState.duration);
    } else if (simulationState.phase === 'drain' || simulationState.phase === 'done') {
      return 1;
    }
    return 0;
  },

  getCurrentMetrics: () => {
    const { simulationState } = get();
    const avgRPS = simulationState.t > 0 ? simulationState.forwards / simulationState.t : 0;
    
    return {
      forwards: simulationState.forwards,
      returns: simulationState.returns,
      tokensTotal: simulationState.tokensTotal,
      modelCostUSD: simulationState.modelCostUSD,
      energyWh: simulationState.energyWh,
      avgRPS,
    };
  },
}));

// Load recent records on initialization
useRuntimeStore.getState().loadRecentRecords();
