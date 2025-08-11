// models/types.ts
// Comprehensive AI Model Types for Business Intelligence Application

export type Provider = 
  | 'OpenAI' 
  | 'Anthropic' 
  | 'Google' 
  | 'Meta' 
  | 'Mistral' 
  | 'Cohere'
  | 'Perplexity'
  | 'Together'
  | 'Replicate'
  | 'Custom';

export type ModelCategory = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'multimodal'
  | 'embedding'
  | 'code';

export type ModelCapability = 
  | 'chat'
  | 'completion'
  | 'function-calling'
  | 'vision'
  | 'audio-generation'
  | 'image-generation'
  | 'code-generation'
  | 'embedding'
  | 'fine-tuning';

/**
 * Comprehensive AI Model Interface for BI Application
 * Supports all major providers and model types for accurate cost analysis
 */
export interface AIModel {
  // Identification
  id: string;
  name: string;
  display_name?: string;
  provider: Provider;
  category: ModelCategory;
  capabilities: ModelCapability[];
  
  // Pricing Structure (USD)
  pricing: {
    input_price_per_1k_tokens: number;
    output_price_per_1k_tokens: number;
    
    // Multimodal pricing
    image_price_per_image?: number;
    audio_price_per_minute?: number;
    video_price_per_minute?: number;
    
    // Special pricing models
    batch_discount?: number; // Percentage discount for batch processing
    fine_tuning_price_per_1k_tokens?: number;
    embedding_price_per_1k_tokens?: number;
  };
  
  // Technical Specifications
  specs: {
    context_window: number;
    max_output_tokens?: number;
    supports_streaming?: boolean;
    supports_function_calling?: boolean;
    supports_vision?: boolean;
    supports_json_mode?: boolean;
    training_data_cutoff?: string;
  };
  
  // Performance Characteristics
  performance: {
    latency_p50_ms?: number;
    latency_p95_ms?: number;
    throughput_tokens_per_second?: number;
    quality_score?: number; // 1-10 subjective quality rating
  };
  
  // Sustainability Metrics
  sustainability: {
    energy_per_1k_tokens_wh?: number;
    energy_per_request_wh?: number;
    carbon_intensity_g_co2_per_kwh?: number;
    compute_efficiency_score?: number; // Performance per watt
  };
  
  // Business Intelligence Metadata
  metadata: {
    release_date?: string;
    deprecation_date?: string;
    is_deprecated?: boolean;
    is_beta?: boolean;
    popularity_rank?: number;
    use_case_recommendations?: string[];
    competitive_advantages?: string[];
    limitations?: string[];
    notes?: string;
    // Custom model properties
    is_custom?: boolean;
    created_timestamp?: string;
    updated_timestamp?: string;
  };
  
  // Visualization Properties
  visualization: {
    brand_color: string; // Provider brand color
    icon_url?: string;
    node_size_multiplier?: number; // For canvas visualization
    animation_speed_multiplier?: number;
  };
}

/**
 * Model Comparison Interface for BI Analytics
 */
export interface ModelComparison {
  models: AIModel[];
  scenario: TokenScenario;
  results: ModelComparisonResult[];
  winner: {
    most_cost_effective: string;
    best_performance: string;
    most_sustainable: string;
    best_overall: string;
  };
}

export interface ModelComparisonResult {
  model_id: string;
  model_name: string;
  total_cost: number;
  cost_per_request: number;
  cost_per_token: number;
  estimated_latency_ms: number;
  energy_consumption_wh: number;
  quality_score: number;
  overall_score: number;
  rank: number;
}

/**
 * Token Usage Scenarios for Cost Modeling
 */
export interface TokenScenario {
  name: string;
  description: string;
  input_tokens: TokenDistribution;
  output_tokens: TokenDistribution;
  requests_per_day: number;
  peak_concurrency?: number;
  cache_hit_rate?: number; // 0-1
  retry_rate?: number; // 0-1
}

export interface TokenDistribution {
  mean: number;
  variance: number;
  min: number;
  max: number;
  distribution_type: 'normal' | 'lognormal' | 'uniform' | 'custom';
}

/**
 * Cost Calculation Results for BI Dashboard
 */
export interface CostAnalysisResult {
  model: AIModel;
  scenario: TokenScenario;
  
  // Cost Breakdown
  costs: {
    input_cost: number;
    output_cost: number;
    additional_costs: number; // Images, audio, etc.
    total_cost: number;
  };
  
  // Per-unit Costs
  per_unit: {
    cost_per_request: number;
    cost_per_token: number;
    cost_per_1k_input_tokens: number;
    cost_per_1k_output_tokens: number;
  };
  
  // Time-based Projections
  projections: {
    daily_cost: number;
    weekly_cost: number;
    monthly_cost: number;
    annual_cost: number;
  };
  
  // Performance Metrics
  performance: {
    estimated_total_latency_ms: number;
    estimated_throughput_rps: number;
    quality_adjusted_cost: number; // Cost / quality_score
  };
  
  // Sustainability Impact
  sustainability: {
    daily_energy_wh: number;
    monthly_co2e_kg: number;
    phone_charges_equivalent: number;
    household_hours_equivalent: number;
  };
  
  // Business Intelligence
  insights: {
    cost_efficiency_rank: number;
    sustainability_rank: number;
    performance_rank: number;
    overall_recommendation: 'highly_recommended' | 'recommended' | 'consider_alternatives' | 'not_recommended';
    optimization_suggestions: string[];
  };
}

/**
 * Provider-level Analytics for BI Dashboard
 */
export interface ProviderAnalytics {
  provider: Provider;
  models_count: number;
  total_cost: number;
  avg_cost_per_token: number;
  cost_range: {
    min_cost_per_1k_tokens: number;
    max_cost_per_1k_tokens: number;
  };
  sustainability_score: number;
  market_share_by_requests: number;
  market_share_by_cost: number;
  strengths: string[];
  use_case_fit: string[];
}

/**
 * Search and Filtering Interfaces
 */
export interface ModelSearchFilters {
  providers?: Provider[];
  categories?: ModelCategory[];
  capabilities?: ModelCapability[];
  max_cost_per_1k_tokens?: number;
  min_context_window?: number;
  include_deprecated?: boolean;
  text_search?: string;
  sort_by?: 'cost' | 'performance' | 'popularity' | 'release_date' | 'sustainability';
  sort_order?: 'asc' | 'desc';
}

export interface ModelSearchResult {
  models: AIModel[];
  total_count: number;
  filters_applied: ModelSearchFilters;
  suggestions: {
    alternative_providers: Provider[];
    similar_models: string[];
    cost_optimization_opportunities: string[];
  };
}

/**
 * Model Management Events for Store Integration
 */
export interface ModelEvent {
  type: 'model_added' | 'model_updated' | 'model_deleted' | 'model_searched' | 'models_compared';
  timestamp: string;
  model_ids: string[];
  user_context?: any;
  analytics_data?: any;
}