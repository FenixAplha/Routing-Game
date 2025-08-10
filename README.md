# 🚀 Routing Visualization Game

> **AI Collaboration Ready**: This project is designed for collaborative development with AI models via GitHub issues, pull requests, and code reviews.

## 🎯 Project Overview

An interactive routing visualization application that simulates network traffic flow through user groups, router layers, and AI models. Built with React + TypeScript, featuring real-time canvas animations, economic modeling, and sustainability tracking.

### 🎮 Live Demo Routes
- **Capture Interface**: `/capture` - Clean recording interface
- **Admin Dashboard**: `/admin` - Full configuration and analytics

## 🏗️ Architecture Summary

```
Capture (/capture)           Admin (/admin)
├── Canvas Visualization     ├── Run Setup
├── Mini Counters           ├── Pricing & Tokens  
├── 10s Simulation          ├── Sustainability
└── Progress Tracking       ├── Commission Revenue
                           ├── Presets Management
                           ├── Records Export
                           └── Advanced Settings
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── routes/                 # Main application routes
│   ├── Capture.tsx        # Recording interface (/capture)
│   ├── Admin.tsx          # Admin dashboard (/admin)
│   └── admin/             # Admin tab components
├── components/            # Reusable UI components
│   ├── CanvasViz.tsx     # Main visualization engine
│   └── MiniCounters.tsx  # Metrics display
├── engine/               # Core simulation engine
│   ├── viz.ts           # Canvas rendering & animation
│   ├── graph.ts         # Network graph building
│   ├── simulation.ts    # 10-second simulation orchestrator
│   └── rng.ts          # Seeded random number generation
├── calc/                # Business logic & calculations
│   ├── pricing.ts       # Cost & commission calculations
│   ├── tokens.ts        # Token sampling & distribution
│   ├── sustainability.ts # Energy conversion utilities
│   └── aggregator.ts    # Metrics collection
├── store/               # State management (Zustand)
│   ├── configStore.ts   # Configuration state
│   └── runtimeStore.ts  # Simulation runtime state
├── db/                  # Data persistence (IndexedDB)
│   ├── records.ts       # Run records storage
│   └── presets.ts       # Custom presets management
└── presets/             # Built-in configurations
    └── builtin.ts       # Zen Garden, Hedgehog Mode, etc.
```

## 🧠 AI Collaboration Guidelines

### For AI Contributors:

1. **🎯 Understanding the Domain**
   - This is a **network routing visualization** tool
   - Users = people making requests to AI models
   - Routers = intermediary routing layers with commission fees
   - Models = AI models that process requests and cost tokens
   - Signals = animated requests flowing through the network

2. **💰 Economic Model**
   - **Base Cost**: `tokens × (pricePer1k / 1000)`
   - **Commission**: Additive router fees (sum of enabled routers)
   - **Commission Cap**: 95% maximum total
   - **User-Visible**: Base cost only (commission hidden in Capture)

3. **🎨 Interface Separation**
   - **Capture**: Recording-focused, minimal UI, no commission data
   - **Admin**: Full configuration, analytics, commission tracking

4. **⚡ Performance Requirements**
   - Target 60 FPS canvas animation
   - Max 48 concurrent animated signals
   - Static elements pre-baked to offscreen canvas
   - Deterministic simulations with seeded RNG

### 🛠️ Development Workflow

1. **Issues**: Use for feature requests, bugs, or questions
2. **Pull Requests**: For code contributions with detailed descriptions
3. **Branches**: Use descriptive names (`feature/router-weights`, `fix/canvas-performance`)
4. **Testing**: Include tests for new calculator functions
5. **Documentation**: Update this README for architectural changes

### 🔧 Common Development Tasks

```bash
# Add new built-in preset
# Edit: src/presets/builtin.ts

# Add new admin tab
# Create: src/routes/admin/NewTab.tsx
# Update: src/routes/Admin.tsx

# Modify economic calculations
# Edit: src/calc/pricing.ts
# Add tests: tests/pricing.test.ts

# Extend canvas visualization
# Edit: src/engine/viz.ts
# Performance testing required

# Add new sustainability metrics
# Edit: src/calc/sustainability.ts
```

### 📊 Key Metrics to Preserve

- **Determinism**: Same seed = same results
- **Performance**: 60 FPS target maintained
- **Data Integrity**: Forwards = Returns after drain
- **Commission Math**: Additive model, 95% cap
- **Interface Separation**: No commission leakage to Capture

## 🧪 Testing Strategy

```bash
# Unit tests for calculations
npm run test

# Key test areas:
# - Pricing calculations (commission cap, additive fees)
# - Token sampling (distributions, rate limiting)
# - Sustainability conversions
# - Data persistence (IndexedDB)
# - Seeded RNG determinism
```

## 🐛 Known Issues & Future Enhancements

### Current Limitations:
- [ ] Custom presets (UI created, persistence pending)
- [ ] Latency modeling (placeholder in Advanced tab)
- [ ] Weighted router selection (uniform distribution currently)
- [ ] Real-time performance monitoring during simulation

### Enhancement Opportunities:
- [ ] WebGL renderer for >1000 concurrent signals
- [ ] Advanced statistical distributions for token sampling
- [ ] Router load balancing algorithms
- [ ] Multi-simulation comparison views
- [ ] CSV import for custom user behavior data

## 🔍 Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Zod Validation**: All user inputs and data schemas
- **Performance**: Canvas operations optimized, memory-conscious
- **Accessibility**: Proper ARIA labels, keyboard navigation
- **Error Handling**: Graceful degradation, user-friendly messages

## 📚 Technical Dependencies

```json
{
  "core": ["react", "typescript", "vite"],
  "state": ["zustand", "zod"],
  "storage": ["idb"],
  "styling": ["tailwindcss"],
  "routing": ["react-router-dom"],
  "testing": ["vitest", "@testing-library/react"]
}
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-enhancement`)
3. **Test** your changes (`npm run test`)
4. **Commit** with descriptive message
5. **Push** to your branch
6. **Open** Pull Request with detailed description

### AI-Specific Contribution Notes:
- Include performance impact analysis for canvas changes
- Provide before/after screenshots for UI modifications
- Explain economic model implications for pricing changes
- Test with multiple built-in presets to ensure compatibility

## 📞 Support & Communication

- **Issues**: Technical problems, feature requests
- **Discussions**: Architecture decisions, design patterns
- **Pull Requests**: Code contributions with peer review
- **Wiki**: Detailed technical documentation (coming soon)

---

**Status**: ✅ Production Ready | 🧪 Test Coverage: Core Functions | 🚀 Performance: 60 FPS Target
