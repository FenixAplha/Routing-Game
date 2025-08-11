# Traffic Routing Visualization Fix Plan

## Current Issues Identified

1. **Button Greyed Out**: The "Run 10s" button stays disabled because `simulationState.phase` remains stuck on 'building'
2. **Missing Phase Transition**: VizEngine completes build animation but doesn't notify SimulationEngine to transition to 'idle'
3. **Disconnected Systems**: Traffic simulation controls from AICostCalculator are not integrated with Capture interface
4. **Limited Time Controls**: Only has 10s fixed duration instead of flexible time ranges (hour, day, week, month, year)
5. **No Speed Controls**: Missing ability to simulate year of traffic in 1 minute

## Solution Plan

### Phase 1: Fix Core Simulation State Management
- Add proper phase transition from 'building' → 'idle' when VizEngine completes
- Fix button enabling logic
- Ensure simulation can start properly

### Phase 2: Integrate Enhanced Traffic Controls
- Move TrafficSimulationControls into Capture interface
- Add flexible time range selection (hour to year)
- Add speed multiplier controls (up to 1 min = 1 year)

### Phase 3: Enhanced Visualization
- Connect stunning visualizer to traffic simulation
- Add realistic traffic patterns (hourly, weekly, seasonal)
- Improve visual effects and indicators

### Phase 4: UI/UX Improvements
- Better progress indicators
- Real-time metrics display
- Intuitive controls layout

## Files to Modify

1. `src/engine/simulation.ts` - Add phase transition management
2. `src/engine/viz.ts` - Add build completion callback
3. `src/components/CanvasViz.tsx` - Wire up phase transitions
4. `src/routes/Capture.tsx` - Integrate enhanced controls
5. `src/components/visualizations/TrafficSimulationControls.tsx` - Adapt for Capture