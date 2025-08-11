# 🌟 Local AI Cost Calculator - North Star Document

## 🎯 Project Vision

Transform the existing routing visualization into a **comprehensive local AI cost calculator** that helps users understand, compare, and optimize AI model costs across all major providers. This tool serves as the definitive resource for AI cost planning without requiring external API dependencies.

### Core Mission
Enable developers, product managers, and business stakeholders to make informed decisions about AI model selection through accurate cost modeling, visual simulation, and comprehensive model comparison.

## 📊 Project Scope & Constraints

### ✅ In Scope
- **Local-only operation** (no external API dependencies)
- **Comprehensive model database** (50+ current AI models)
- **Manual model management** (add, edit, remove models)
- **Enhanced cost visualization** (multi-provider cost flows)
- **Realistic scenario presets** (10+ common use cases)
- **Export capabilities** (PDF, CSV, JSON)
- **Mobile-responsive design**

### ❌ Out of Scope  
- Real-time pricing API integration
- Cloud provider calculator integration
- User authentication or cloud storage
- Complex enterprise features (reservations, discounts)
- Multi-currency live conversion
- Advanced ML model performance predictions

## 🏗️ Technical Architecture

### Current Foundation (Keep & Enhance)
```
src/
├── calc/                   # ✅ ENHANCE: Cost calculation engine
├── engine/                 # ✅ ENHANCE: Canvas visualization
├── store/                  # ✅ ENHANCE: State management
├── components/             # ✅ ENHANCE: UI components
├── routes/                 # ✅ ENHANCE: Capture/Admin routes
└── db/                     # ✅ ENHANCE: Local persistence
```

### New Architecture Additions
```
src/
├── models/                 # 🆕 NEW: Model database & management
│   ├── database.ts        # Pre-loaded 50+ AI models
│   ├── types.ts           # Model interfaces & validation
│   ├── search.ts          # Model search & filtering
│   └── validator.ts       # Model data validation
├── scenarios/              # 🆕 NEW: Scenario management
│   ├── builder.ts         # Scenario creation utilities
│   ├── presets.ts         # Built-in realistic presets
│   └── comparison.ts      # Multi-scenario analysis
├── export/                 # 🆕 NEW: Export capabilities
│   ├── pdf-generator.ts   # PDF report generation
│   ├── csv-exporter.ts    # CSV data export
│   └── json-serializer.ts # JSON scenario export
└── ui/                     # 🆕 NEW: Enhanced UI components
    ├── ModelBrowser.tsx   # Model browsing interface
    ├── ModelEditor.tsx    # Model add/edit modal
    ├── ScenarioBuilder.tsx # Scenario configuration
    └── ResultsDashboard.tsx # Results analysis
```

## 📋 Implementation Roadmap

### Chunk 1: Model Database Foundation (Week 1)
**Goal**: Create comprehensive, accurate model database

#### 1.1 Core Model Schema
```typescript
interface AIModel {
  id: string;                           // unique identifier
  name: string;                         // display name
  provider: Provider;                   // OpenAI, Anthropic, etc.
  category: ModelCategory;              // text, image, audio, multimodal
  
  // Pricing (USD)
  input_price_per_1k_tokens: number;
  output_price_per_1k_tokens: number;
  image_price_per_image?: number;
  audio_price_per_minute?: number;
  
  // Technical Specifications
  context_window: number;
  max_output_tokens?: number;
  
  // Sustainability
  energy_per_1k_tokens_wh?: number;
  energy_per_request_wh?: number;
  
  // Metadata
  release_date?: string;
  deprecated?: boolean;
  notes?: string;
}

type Provider = 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Mistral' | 'Cohere' | 'Custom';
type ModelCategory = 'text' | 'image' | 'audio' | 'video' | 'multimodal';
```

#### 1.2 Pre-loaded Model Database (50+ Models)
**OpenAI Models**:
- GPT-4o (multimodal): $2.50/$10.00 per 1k tokens
- GPT-4o Mini: $0.15/$0.60 per 1k tokens  
- GPT-4 Turbo: $10.00/$30.00 per 1k tokens
- GPT-4: $30.00/$60.00 per 1k tokens
- GPT-3.5 Turbo: $0.50/$1.50 per 1k tokens
- DALL-E 3: $0.040-$0.120 per image
- Whisper: $0.006 per minute

**Anthropic Models**:
- Claude 3.5 Sonnet: $3.00/$15.00 per 1k tokens
- Claude 3 Opus: $15.00/$75.00 per 1k tokens
- Claude 3 Sonnet: $3.00/$15.00 per 1k tokens
- Claude 3 Haiku: $0.25/$1.25 per 1k tokens

**Google Models**:
- Gemini 1.5 Pro: $3.50/$10.50 per 1k tokens
- Gemini 1.5 Flash: $0.075/$0.30 per 1k tokens
- Gemini 1.0 Pro: $0.50/$1.50 per 1k tokens

**Meta Models**:
- Llama 3.1 405B: $2.70/$2.70 per 1k tokens (via providers)
- Llama 3.1 70B: $0.88/$0.88 per 1k tokens
- Llama 3.1 8B: $0.20/$0.20 per 1k tokens
- Llama 3.2 90B: $1.20/$1.20 per 1k tokens

**Mistral Models**:
- Mistral Large: $4.00/$12.00 per 1k tokens
- Mistral Small: $1.00/$3.00 per 1k tokens  
- Mistral Nemo: $0.30/$0.30 per 1k tokens

**Cohere Models**:
- Command R+: $3.00/$15.00 per 1k tokens
- Command R: $0.50/$1.50 per 1k tokens

**Deliverables**:
- [ ] Complete model database with accurate pricing
- [ ] TypeScript interfaces with Zod validation
- [ ] Model search and filtering utilities
- [ ] JSON import/export for model data

### Chunk 2: Model Management UI (Week 1-2)
**Goal**: Create intuitive interface for browsing and managing models

#### 2.1 Model Browser Component
```typescript
// Features:
// - Grid/List view toggle
// - Provider filter tabs (All, OpenAI, Anthropic, Google, etc.)
// - Category filter (Text, Image, Multimodal, etc.)
// - Search by model name
// - Sort by: Price (input/output), Context Window, Release Date
// - Quick selection for scenario building
// - Comparison mode (select multiple for side-by-side)
```

#### 2.2 Model Editor Modal
```typescript
// Features:
// - Add new custom models
// - Edit existing model details
// - Form validation (required fields, price ranges)
// - Provider autocomplete
// - Currency selection (USD default)
// - Energy estimation helper
// - Price validation warnings
// - Preview card showing model summary
```

#### 2.3 Model Comparison Table
```typescript
// Features:
// - Side-by-side comparison of selected models
// - Price per 1k tokens (input/output)
// - Cost per typical request scenarios
// - Context window comparison
// - Energy efficiency ranking
// - Performance characteristics
// - Clear visual indicators for best value/performance
```

**Deliverables**:
- [ ] Model browser with filters and search
- [ ] Model editor with comprehensive validation
- [ ] Model comparison interface
- [ ] Responsive design for mobile/tablet
- [ ] Accessibility features (keyboard nav, screen reader)

### Chunk 3: Enhanced Calculator Engine (Week 2)
**Goal**: Upgrade calculation engine to support comprehensive model analysis

#### 3.1 Enhanced Cost Calculator
```typescript
interface CostRequest {
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  requests_count: number;
  
  // Optional overrides for custom scenarios
  custom_input_price?: number;
  custom_output_price?: number;
  
  // For non-text models
  images_count?: number;
  audio_minutes?: number;
}

interface CostResult {
  model: AIModel;
  breakdown: {
    input_cost: number;
    output_cost: number;
    image_cost?: number;
    audio_cost?: number;
  };
  totals: {
    total_cost: number;
    cost_per_request: number;
    cost_per_token: number;
  };
  sustainability: {
    energy_wh: number;
    co2e_kg: number;
    phone_charges: number;
  };
  currency: string;
}

class EnhancedCostCalculator {
  calculate(request: CostRequest): CostResult;
  calculateBatch(requests: CostRequest[]): CostResult[];
  compareModels(modelIds: string[], scenario: TokenScenario): ModelComparison[];
  estimateMonthly(daily_requests: number, token_estimate: TokenEstimate): MonthlyCost;
  optimizeModelMix(requirements: Requirements): OptimizationSuggestion[];
}
```

#### 3.2 Token Estimation Utilities
```typescript
// Common scenario templates
const TOKEN_SCENARIOS = [
  {
    name: 'Customer Support Chat',
    description: 'Typical customer service interaction',
    avg_input_tokens: 150,
    avg_output_tokens: 100,
    variance: 0.3
  },
  {
    name: 'Code Generation',
    description: 'Generate code from natural language',
    avg_input_tokens: 200,
    avg_output_tokens: 400,
    variance: 0.5
  },
  {
    name: 'Document Summarization',
    description: 'Summarize long documents',
    avg_input_tokens: 2000,
    avg_output_tokens: 300,
    variance: 0.4
  },
  // ... 10+ scenarios
];

// Estimation helpers
class TokenEstimator {
  estimateFromText(text: string): number;
  estimateFromWords(words: number): number;
  estimateFromChars(chars: number): number;
  getScenarioTemplate(name: string): TokenScenario;
}
```

**Deliverables**:
- [ ] Enhanced cost calculator supporting all model types
- [ ] Token estimation utilities with common scenarios
- [ ] Batch calculation for multiple models/scenarios
- [ ] Model optimization suggestions
- [ ] Monthly/annual cost projections

### Chunk 4: Enhanced Visualization (Week 2-3)
**Goal**: Upgrade canvas visualization to show model diversity and real costs

#### 4.1 Multi-Provider Model Nodes
```typescript
interface EnhancedModelNode extends Node {
  model: AIModel;
  provider_color: string;      // Provider-specific colors
  cost_per_request: number;
  requests_handled: number;
  efficiency_score: number;    // Cost per useful token
  load_percentage: number;     // Current utilization
}

// Provider color scheme:
// OpenAI: #00A67E (green)
// Anthropic: #D97757 (orange)
// Google: #4285F4 (blue)
// Meta: #1877F2 (blue)
// Mistral: #FF7000 (orange)
// Cohere: #39A0ED (light blue)
```

#### 4.2 Real-Time Cost Flow Visualization
```typescript
interface CostSignal extends Signal {
  line_item: {
    model_id: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
  accumulated_cost: number;
  efficiency_indicator: 'high' | 'medium' | 'low';
  provider_path: string[];
}

// Visual enhancements:
// - Signal size varies by cost (expensive requests = larger signals)
// - Signal color indicates efficiency (green = efficient, red = expensive)
// - Trail length shows processing time
// - Cost accumulation displayed on HUD
// - Provider clustering with cost breakdowns
```

#### 4.3 Enhanced Metrics HUD
```typescript
interface LiveCostMetrics {
  session_totals: {
    total_cost_usd: number;
    total_tokens: number;
    total_requests: number;
    avg_cost_per_request: number;
  };
  efficiency_metrics: {
    most_efficient_model: string;
    least_efficient_model: string;
    cost_per_useful_token: number;
  };
  provider_breakdown: {
    provider: string;
    requests: number;
    cost: number;
    percentage: number;
  }[];
  sustainability: {
    energy_consumed_wh: number;
    co2e_kg: number;
    phone_charges_equivalent: number;
  };
}
```

**Deliverables**:
- [ ] Multi-provider model visualization with color coding
- [ ] Real-time cost flow animation
- [ ] Enhanced metrics HUD with breakdowns
- [ ] Model efficiency heat mapping
- [ ] Provider clustering and cost attribution

### Chunk 5: Scenario Builder & Results (Week 3)
**Goal**: Create comprehensive scenario building and analysis interface

#### 5.1 Scenario Builder Interface
```typescript
interface CostScenario {
  id: string;
  name: string;
  description: string;
  
  // Traffic characteristics
  daily_requests: number;
  peak_concurrency: number;
  request_pattern: 'steady' | 'bursty' | 'business-hours' | 'custom';
  
  // Token patterns
  input_token_distribution: {
    mean: number;
    variance: number;
    min: number;
    max: number;
  };
  output_token_distribution: {
    mean: number;
    variance: number;
    min: number;
    max: number;
  };
  
  // Model selection strategy
  model_mix: {
    model_id: string;
    weight: number;           // Percentage of requests
    fallback_priority: number;
  }[];
  routing_strategy: 'cost-optimized' | 'latency-optimized' | 'balanced' | 'custom';
  
  // Advanced settings
  cache_hit_rate: number;     // 0-1
  retry_rate: number;         // 0-1
  scaling_factor: number;     // Growth multiplier
}
```

#### 5.2 Results Dashboard
```typescript
// Comprehensive results visualization:
interface ScenarioResults {
  cost_breakdown: {
    daily_cost: number;
    monthly_cost: number;
    annual_cost: number;
    cost_by_model: ModelCost[];
    cost_by_provider: ProviderCost[];
  };
  
  efficiency_analysis: {
    cost_per_request: number;
    cost_per_useful_token: number;
    most_cost_effective_model: string;
    optimization_opportunities: OptimizationSuggestion[];
  };
  
  sustainability_impact: {
    daily_energy_wh: number;
    monthly_co2e_kg: number;
    equivalent_metrics: {
      phone_charges: number;
      household_hours: number;
      tree_seedlings_offset: number;
    };
  };
  
  scaling_projections: {
    growth_scenarios: GrowthProjection[];
    cost_sensitivity: SensitivityAnalysis;
    budget_recommendations: BudgetRecommendation[];
  };
}
```

#### 5.3 Export & Sharing Capabilities
```typescript
// Export formats:
// - PDF Report: Executive summary with charts
// - CSV Data: Raw numbers for spreadsheet analysis  
// - JSON Scenario: Complete scenario for sharing/backup
// - Shareable Link: Readonly scenario view (local storage based)

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'link';
  include_charts: boolean;
  include_raw_data: boolean;
  template: 'executive' | 'technical' | 'detailed';
  branding?: BrandingOptions;
}
```

**Deliverables**:
- [ ] Intuitive scenario builder with templates
- [ ] Comprehensive results dashboard
- [ ] Export capabilities (PDF, CSV, JSON)
- [ ] Scenario comparison interface
- [ ] Mobile-responsive design

### Chunk 6: Presets & Final Polish (Week 3-4)
**Goal**: Ship with realistic presets and production-ready polish

#### 6.1 Built-in Realistic Presets
```typescript
export const REALISTIC_PRESETS: CostScenario[] = [
  {
    name: 'Customer Support Chatbot',
    description: 'AI-powered customer service with escalation to premium models',
    daily_requests: 1000,
    model_mix: [
      { model_id: 'gpt-4o-mini', weight: 0.7, fallback_priority: 1 },
      { model_id: 'gpt-4o', weight: 0.3, fallback_priority: 2 }
    ],
    input_token_distribution: { mean: 150, variance: 50, min: 50, max: 500 },
    output_token_distribution: { mean: 100, variance: 30, min: 20, max: 300 }
  },
  
  {
    name: 'Content Generation Pipeline',
    description: 'High-quality content creation for marketing teams',
    daily_requests: 200,
    model_mix: [
      { model_id: 'claude-3-5-sonnet', weight: 0.6, fallback_priority: 1 },
      { model_id: 'gpt-4o', weight: 0.4, fallback_priority: 2 }
    ],
    input_token_distribution: { mean: 300, variance: 100, min: 100, max: 1000 },
    output_token_distribution: { mean: 800, variance: 200, min: 200, max: 2000 }
  },
  
  {
    name: 'Code Assistant',
    description: 'Developer productivity tool with code generation',
    daily_requests: 500,
    model_mix: [
      { model_id: 'gpt-4o', weight: 0.5, fallback_priority: 1 },
      { model_id: 'claude-3-5-sonnet', weight: 0.3, fallback_priority: 2 },
      { model_id: 'gpt-4o-mini', weight: 0.2, fallback_priority: 3 }
    ],
    input_token_distribution: { mean: 200, variance: 80, min: 50, max: 800 },
    output_token_distribution: { mean: 400, variance: 150, min: 50, max: 1500 }
  },
  
  {
    name: 'Document Analysis',
    description: 'Large document processing and summarization',
    daily_requests: 100,
    model_mix: [
      { model_id: 'gemini-1-5-pro', weight: 0.7, fallback_priority: 1 },
      { model_id: 'claude-3-5-sonnet', weight: 0.3, fallback_priority: 2 }
    ],
    input_token_distribution: { mean: 4000, variance: 1000, min: 1000, max: 10000 },
    output_token_distribution: { mean: 500, variance: 150, min: 100, max: 1000 }
  },
  
  {
    name: 'Research Assistant',
    description: 'Academic and business research support',
    daily_requests: 150,
    model_mix: [
      { model_id: 'claude-3-5-sonnet', weight: 0.8, fallback_priority: 1 },
      { model_id: 'gpt-4o', weight: 0.2, fallback_priority: 2 }
    ],
    input_token_distribution: { mean: 600, variance: 200, min: 200, max: 2000 },
    output_token_distribution: { mean: 800, variance: 250, min: 300, max: 2500 }
  },
  
  // Additional presets:
  // - Creative Writing Assistant
  // - Data Analysis Helper  
  // - Translation Service
  // - Email Assistant
  // - Educational Tutor
];
```

#### 6.2 Production Polish Checklist
```typescript
// Performance Optimization:
// - Smooth 60fps animation with 20+ models
// - Efficient rendering with canvas optimization
// - Memory management for long-running sessions
// - Responsive UI for mobile devices

// User Experience:
// - Intuitive onboarding flow
// - Helpful tooltips and explanations
// - Error handling with clear messages
// - Loading states and progress indicators
// - Keyboard shortcuts for power users

// Accessibility:
// - Screen reader compatibility
// - Keyboard navigation
// - High contrast mode
// - Reduced motion preferences
// - ARIA labels and descriptions

// Data Validation:
// - Input sanitization and validation
// - Model data integrity checks
// - Scenario constraint enforcement
// - Error recovery mechanisms

// Testing:
// - Unit tests for calculator functions
// - Integration tests for UI flows
// - Performance tests for visualization
// - Accessibility compliance testing
```

#### 6.3 Documentation & Help System
```typescript
// Built-in help system:
// - Interactive onboarding tour
// - Context-sensitive help tooltips
// - Comprehensive FAQ section
// - Video tutorials for complex features
// - Model selection guidance
// - Cost optimization tips
// - Export and sharing instructions
```

**Deliverables**:
- [ ] 10+ realistic, production-ready presets
- [ ] Complete model database with 50+ models
- [ ] Production-quality polish and optimization
- [ ] Comprehensive testing suite
- [ ] Built-in help and documentation system
- [ ] Mobile-responsive design
- [ ] Accessibility compliance

## 🎯 Success Criteria

### Technical Success Metrics
- [ ] **Model Coverage**: 50+ current AI models with accurate pricing (±2% of official rates)
- [ ] **Performance**: Smooth 60fps visualization with 20+ models simultaneously
- [ ] **Accuracy**: Cost calculations match manual calculations within $0.01
- [ ] **Reliability**: Zero data loss, graceful error handling, offline capability
- [ ] **Compatibility**: Works on Chrome, Firefox, Safari, Edge (desktop + mobile)

### User Experience Success Metrics
- [ ] **Time to Value**: New users can create first scenario in <2 minutes
- [ ] **Comprehensiveness**: Covers 90% of common AI cost scenarios
- [ ] **Usability**: Mobile-friendly, accessible, intuitive navigation
- [ ] **Utility**: Export functionality enables real business planning
- [ ] **Engagement**: Visual simulation provides clear cost insights

### Business Impact Success Metrics
- [ ] **Decision Support**: Provides actionable cost optimization recommendations
- [ ] **Trust**: Builds confidence through accurate, transparent calculations
- [ ] **Shareability**: Easy to demonstrate scenarios to stakeholders
- [ ] **Educational Value**: Helps users understand AI cost dynamics
- [ ] **Future-Proof**: Easy to extend with new models and features

## 🚀 Launch Strategy

### Soft Launch (Week 4)
- [ ] Deploy with 5 core presets
- [ ] 30+ most popular models
- [ ] Basic export functionality
- [ ] Core documentation

### Full Launch (Week 5)
- [ ] All 10+ presets available
- [ ] Complete 50+ model database
- [ ] Advanced export options
- [ ] Comprehensive help system
- [ ] Performance optimization

### Post-Launch Evolution
- [ ] Monthly model database updates
- [ ] User feedback integration
- [ ] Performance monitoring
- [ ] Feature usage analytics
- [ ] Community preset sharing

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] **Monthly**: Update model pricing and add new models
- [ ] **Quarterly**: Review and update presets based on usage patterns
- [ ] **Bi-annually**: Performance audit and optimization
- [ ] **Annually**: Major feature additions and UX improvements

### Data Quality Assurance
- [ ] Verify model pricing against official sources monthly
- [ ] Test calculations against known benchmarks
- [ ] Monitor for deprecated models and pricing changes
- [ ] Validate energy consumption estimates

### User Support
- [ ] Built-in help system for common questions
- [ ] GitHub issues for bug reports and feature requests
- [ ] Community discussions for preset sharing
- [ ] Documentation updates based on user feedback

---

**This document serves as the definitive guide for the Local AI Cost Calculator project. All implementation decisions should align with these goals and constraints.**

**Last Updated**: January 2025  
**Status**: Implementation Ready  
**Next Action**: Begin Chunk 1 - Model Database Foundation