# Repository Cleanup Plan

**Project**: routing-viz - AI routing visualization with traffic simulation  
**Tech Stack**: Node.js + npm, TypeScript, React, Vite  
**Package Manager**: npm (package-lock.json present)  
**Build Command**: `npm run build`  
**Test Command**: `npm run test`  

## Current State Analysis

### Repository Stats
- **Tracked files**: 46 Git-tracked files
- **Package manager**: npm (package-lock.json found)
- **Build tool**: Vite + TypeScript
- **Framework**: React 18 + TypeScript

### Stack Detection
- **Runtime**: Node.js (ES modules)
- **Framework**: React 18.2.0 with TypeScript 5.0.2  
- **Build**: Vite 6.3.5 + TypeScript compiler
- **Testing**: Vitest 3.2.4 + @testing-library
- **Styling**: TailwindCSS 3.3.3 + PostCSS
- **Linting**: ESLint 8.45.0 + TypeScript ESLint
- **State**: Zustand 4.4.1
- **Routing**: React Router 6.15.0

## Cleanup Categories

### 1. 🗑️ Build Outputs and Caches to Purge
**Status**: ✅ ALREADY PROPERLY GITIGNORED
```
dist/           # Build output (already in .gitignore)
node_modules/   # Dependencies (already in .gitignore)  
.eslintcache    # ESLint cache (already in .gitignore)
```

### 2. 📁 Unused Files and Dead Code

#### Unused Files (6 files identified by knip):
```
- Assets Created Separatly/Routing Visualizer/config.js  # Orphaned config
- src/db/presets.ts                                     # Unused database module  
- src/engine/radial-viz.ts                             # Legacy engine (replaced by unified)
- src/engine/viz-adapter.ts                            # Legacy adapter (replaced)
- src/ui/index.ts                                       # Unused barrel export
- src/ui/ModelEditor.tsx                               # Duplicate of components/models/ModelEditor.tsx
```

#### Unused Exports (46 exports identified):
Major categories:
- **Model management utilities**: 23 unused exports from models/ directory
- **Legacy visualization engines**: 8 exports from replaced engines  
- **Schema validators**: 7 unused schema exports
- **Pricing utilities**: 8 unused pricing functions

### 3. 📦 Dependencies Cleanup  

#### Unused Dependencies (1):
```
- classnames: No usage found in codebase
```

#### Unused Dev Dependencies (5):
```  
- @testing-library/react: Testing setup but no tests use React Testing Library
- @testing-library/user-event: No user interaction tests found
- @typescript-eslint/eslint-plugin: ESLint config exists but not actively used
- @typescript-eslint/parser: ESLint parser not referenced  
- prettier: Config missing, not integrated with workflow
```

#### Dependencies Analysis:
- **Keep**: All production dependencies are actively used
- **Dev tools assessment**: Several testing/linting tools installed but not configured

### 4. 🔧 Configuration Consolidation

#### Current Configs:
```
✅ tsconfig.json + tsconfig.node.json  # Proper TypeScript setup
✅ vite.config.ts                      # Vite configuration  
✅ tailwind.config.js                  # TailwindCSS config
✅ postcss.config.js                   # PostCSS for Tailwind
⚠️  .eslintrc.cjs                       # ESLint config (unused dependencies)
❌ No prettier config                   # Prettier dep without config
```

#### Recommendations:
- **Keep**: All existing configs are properly structured
- **Fix**: Remove unused ESLint dependencies or complete ESLint integration
- **Add**: Prettier config if keeping prettier dependency

### 5. 📄 Documentation Files Analysis

#### Documentation Status:
```
✅ README.md                                    # Main project docs
✅ COLLABORATION.md                            # Team workflow
✅ NORTH_STAR.md                               # Project vision
✅ ENHANCED_TRAFFIC_ROUTING_COMPLETE.md       # Feature documentation  
✅ STUNNING_CANVAS_VISUALIZATION_COMPLETE.md  # Implementation docs
✅ TRAFFIC_ROUTING_FIX.md                     # Technical documentation
```

**Assessment**: All documentation files appear valuable for project understanding and maintenance.

### 6. 🖼️ Assets and Binaries 

#### Large Files: 
```
⚠️  Assets Created Separatly/Models_Catalog__seed_snapshot_.csv
⚠️  Assets Created Separatly/Routing Visualizer/ (legacy HTML/CSS/JS)
```

**Recommendation**: Move "Assets Created Separatly" to .trash/ - appears to be development artifacts.

### 7. 🎯 Proposed Actions

#### Phase 1: Safe Removals (Move to .trash/)
1. **Legacy assets**: `Assets Created Separatly/` directory
2. **Unused code files**: 6 files identified by knip
3. **Unused dependencies**: Remove 1 prod + 5 dev dependencies

#### Phase 2: Code Cleanup  
1. **Remove unused exports**: Clean up 46+ unused exports (batch by module)
2. **Consolidate duplicates**: Address 3 duplicate exports

#### Phase 3: Configuration 
1. **ESLint**: Either complete integration or remove unused deps
2. **Prettier**: Add config file or remove dependency
3. **Update .gitignore**: Add Vite-specific ignores

#### Phase 4: Documentation
1. **Update README.md**: Reflect current tech stack and commands
2. **Add CHANGELOG.md**: Document cleanup changes

## Size Impact Estimate

### Before Cleanup:
- **Source files**: 46 tracked files
- **Dependencies**: 21 prod + 21 dev dependencies  
- **Asset files**: Legacy HTML/CSS/JS artifacts

### After Cleanup:
- **Source files**: ~40 tracked files (-6 unused files)
- **Dependencies**: 20 prod + ~16 dev dependencies (-6 unused deps)
- **Cleaner codebase**: -46 unused exports, -3 duplicate exports

## Risk Assessment

### ⚠️ HIGH CAUTION Required:
- **src/engine/radial-viz.ts**: Marked unused but might be recently replaced
- **ESLint dependencies**: May be used in CI/IDE despite local issues

### ✅ SAFE TO REMOVE:
- **Assets Created Separatly/**: Development artifacts  
- **classnames**: Confirmed unused in codebase
- **Testing dependencies**: No tests currently using them

## Implementation Plan

### Step 1: Verification
- [x] Analyze with knip, depcheck 
- [x] Generate cleanup plan
- [ ] **USER CONFIRMATION REQUIRED**

### Step 2: Create .trash/ Structure
- [ ] Mirror directory structure in .trash/
- [ ] Move files (never delete directly)
- [ ] Create RESTORE_INSTRUCTIONS.md

### Step 3: Apply Changes
- [ ] Remove unused dependencies from package.json
- [ ] Clean up unused exports (module by module)
- [ ] Update configurations
- [ ] Fresh install & build test

### Step 4: Documentation  
- [ ] Update README.md
- [ ] Create CHANGELOG.md entry
- [ ] Final verification

## Questions for Confirmation

1. **Project purpose**: Is this an AI routing cost analysis and visualization tool?
2. **Must-keep paths**: Should I preserve all documentation .md files?
3. **Must-keep files**: Any specific files beyond standard ones (.env.example, etc.)?
4. **ESLint**: Complete the ESLint setup or remove the unused dependencies?
5. **Legacy engines**: Confirm src/engine/radial-viz.ts and viz-adapter.ts are safe to move to .trash?

---

**Ready to proceed?** Please confirm the plan before I start moving files to .trash/.