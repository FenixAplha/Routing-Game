// models/validator.ts
// Model Data Validation for Business Intelligence Application

import { z } from 'zod';
import { AIModel, Provider, ModelCategory, ModelCapability } from './types';

/**
 * Zod Schemas for Comprehensive Model Validation
 */
export const ProviderSchema = z.enum([
  'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Cohere',
  'Perplexity', 'Together', 'Replicate', 'Custom'
]);

export const ModelCategorySchema = z.enum([
  'text', 'image', 'audio', 'video', 'multimodal', 'embedding', 'code'
]);

export const ModelCapabilitySchema = z.enum([
  'chat', 'completion', 'function-calling', 'vision', 'audio-generation',
  'image-generation', 'code-generation', 'embedding', 'fine-tuning'
]);

export const TokenDistributionSchema = z.object({
  mean: z.number().min(1, 'Mean must be positive'),
  variance: z.number().min(0, 'Variance cannot be negative'),
  min: z.number().min(0, 'Minimum cannot be negative'),
  max: z.number().min(1, 'Maximum must be positive'),
  distribution_type: z.enum(['normal', 'lognormal', 'uniform', 'custom'])
});

export const AIModelSchema = z.object({
  // Identification
  id: z.string().min(1, 'Model ID is required'),
  name: z.string().min(1, 'Model name is required'),
  display_name: z.string().optional(),
  provider: ProviderSchema,
  category: ModelCategorySchema,
  capabilities: z.array(ModelCapabilitySchema).min(1, 'At least one capability required'),
  
  // Pricing Structure
  pricing: z.object({
    input_price_per_1k_tokens: z.number().min(0, 'Input price cannot be negative'),
    output_price_per_1k_tokens: z.number().min(0, 'Output price cannot be negative'),
    image_price_per_image: z.number().min(0).optional(),
    audio_price_per_minute: z.number().min(0).optional(),
    video_price_per_minute: z.number().min(0).optional(),
    batch_discount: z.number().min(0).max(1).optional(),
    fine_tuning_price_per_1k_tokens: z.number().min(0).optional(),
    embedding_price_per_1k_tokens: z.number().min(0).optional()
  }).refine(
    (pricing) => {
      // Ensure at least input or output pricing is provided
      return pricing.input_price_per_1k_tokens > 0 || pricing.output_price_per_1k_tokens > 0;
    },
    { message: 'Either input or output pricing must be provided' }
  ),
  
  // Technical Specifications
  specs: z.object({
    context_window: z.number().min(1, 'Context window must be positive'),
    max_output_tokens: z.number().min(1).optional(),
    supports_streaming: z.boolean().optional(),
    supports_function_calling: z.boolean().optional(),
    supports_vision: z.boolean().optional(),
    supports_json_mode: z.boolean().optional(),
    training_data_cutoff: z.string().optional()
  }),
  
  // Performance Characteristics
  performance: z.object({
    latency_p50_ms: z.number().min(0).optional(),
    latency_p95_ms: z.number().min(0).optional(),
    throughput_tokens_per_second: z.number().min(0).optional(),
    quality_score: z.number().min(0).max(10).optional()
  }),
  
  // Sustainability Metrics
  sustainability: z.object({
    energy_per_1k_tokens_wh: z.number().min(0).optional(),
    energy_per_request_wh: z.number().min(0).optional(),
    carbon_intensity_g_co2_per_kwh: z.number().min(0).optional(),
    compute_efficiency_score: z.number().min(0).max(10).optional()
  }),
  
  // Business Intelligence Metadata
  metadata: z.object({
    release_date: z.string().optional(),
    deprecation_date: z.string().optional(),
    is_deprecated: z.boolean().optional(),
    is_beta: z.boolean().optional(),
    popularity_rank: z.number().min(1).optional(),
    use_case_recommendations: z.array(z.string()).optional(),
    competitive_advantages: z.array(z.string()).optional(),
    limitations: z.array(z.string()).optional(),
    notes: z.string().optional()
  }),
  
  // Visualization Properties
  visualization: z.object({
    brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Brand color must be a valid hex color'),
    icon_url: z.string().url().optional(),
    node_size_multiplier: z.number().min(0.1).max(5).optional(),
    animation_speed_multiplier: z.number().min(0.1).max(5).optional()
  })
}).refine(
  (model) => {
    // Custom validation: Vision capability should match specs
    const hasVisionCapability = model.capabilities.includes('vision');
    const supportsVision = model.specs.supports_vision;
    return hasVisionCapability === supportsVision;
  },
  { 
    message: 'Vision capability must match specs.supports_vision',
    path: ['capabilities']
  }
);

/**
 * Token Scenario Validation Schema
 */
export const TokenScenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required'),
  description: z.string().min(1, 'Scenario description is required'),
  input_tokens: TokenDistributionSchema,
  output_tokens: TokenDistributionSchema,
  requests_per_day: z.number().min(1, 'Requests per day must be positive'),
  peak_concurrency: z.number().min(1).optional(),
  cache_hit_rate: z.number().min(0).max(1).optional(),
  retry_rate: z.number().min(0).max(1).optional()
}).refine(
  (scenario) => {
    // Ensure min <= mean <= max for token distributions
    const inputValid = scenario.input_tokens.min <= scenario.input_tokens.mean && 
                      scenario.input_tokens.mean <= scenario.input_tokens.max;
    const outputValid = scenario.output_tokens.min <= scenario.output_tokens.mean && 
                       scenario.output_tokens.mean <= scenario.output_tokens.max;
    return inputValid && outputValid;
  },
  { 
    message: 'Token distribution min <= mean <= max constraint violated',
    path: ['input_tokens', 'output_tokens']
  }
);

/**
 * Model Validation Functions
 */
export class ModelValidator {
  /**
   * Validate a single AI model
   */
  static validateModel(model: unknown): { isValid: boolean; errors: string[]; data?: AIModel } {
    try {
      const validatedModel = AIModelSchema.parse(model);
      return { isValid: true, errors: [], data: validatedModel };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate array of models
   */
  static validateModels(models: unknown[]): { 
    isValid: boolean; 
    errors: Array<{ index: number; errors: string[] }>; 
    validModels: AIModel[] 
  } {
    const results = models.map((model, index) => ({ 
      index, 
      ...this.validateModel(model) 
    }));

    const errors = results.filter(r => !r.isValid).map(r => ({
      index: r.index,
      errors: r.errors
    }));

    const validModels = results.filter(r => r.isValid).map(r => r.data!);

    return {
      isValid: errors.length === 0,
      errors,
      validModels
    };
  }

  /**
   * Validate token scenario
   */
  static validateTokenScenario(scenario: unknown): { 
    isValid: boolean; 
    errors: string[]; 
    data?: any 
  } {
    try {
      const validatedScenario = TokenScenarioSchema.parse(scenario);
      return { isValid: true, errors: [], data: validatedScenario };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate pricing data integrity
   */
  static validatePricingIntegrity(model: AIModel): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for reasonable pricing ranges
    if (model.pricing.input_price_per_1k_tokens > 50) {
      warnings.push(`Input pricing seems very high: $${model.pricing.input_price_per_1k_tokens}/1k tokens`);
    }
    
    if (model.pricing.output_price_per_1k_tokens > 100) {
      warnings.push(`Output pricing seems very high: $${model.pricing.output_price_per_1k_tokens}/1k tokens`);
    }
    
    // Output pricing should typically be higher than input pricing
    if (model.pricing.output_price_per_1k_tokens < model.pricing.input_price_per_1k_tokens) {
      warnings.push('Output pricing is lower than input pricing, which is unusual');
    }
    
    // Check for extremely low pricing that might be errors
    if (model.pricing.input_price_per_1k_tokens < 0.001 && model.pricing.input_price_per_1k_tokens > 0) {
      warnings.push('Input pricing seems extremely low, please verify');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Validate model compatibility with use cases
   */
  static validateUseCaseCompatibility(model: AIModel): { 
    isValid: boolean; 
    suggestions: string[] 
  } {
    const suggestions: string[] = [];
    
    // Check multimodal capabilities vs category
    if (model.category === 'multimodal' && !model.capabilities.includes('vision')) {
      suggestions.push('Multimodal model should have vision capability');
    }
    
    // Check function calling support
    if (model.capabilities.includes('function-calling') && !model.specs.supports_function_calling) {
      suggestions.push('Function calling capability should match specs');
    }
    
    // Check context window vs use cases
    if (model.specs.context_window < 4000 && 
        model.metadata.use_case_recommendations?.some(uc => uc.includes('document'))) {
      suggestions.push('Small context window may not be suitable for document analysis');
    }
    
    return {
      isValid: suggestions.length === 0,
      suggestions
    };
  }

  /**
   * Generate model quality score based on completeness
   */
  static calculateCompletenessScore(model: AIModel): number {
    let score = 0;
    let maxScore = 0;
    
    // Required fields (base score)
    maxScore += 40;
    if (model.id && model.name && model.provider) score += 40;
    
    // Pricing completeness
    maxScore += 20;
    if (model.pricing.input_price_per_1k_tokens > 0 && model.pricing.output_price_per_1k_tokens > 0) {
      score += 20;
    }
    
    // Performance data
    maxScore += 15;
    if (model.performance.quality_score && model.performance.latency_p50_ms) {
      score += 15;
    }
    
    // Sustainability data
    maxScore += 10;
    if (model.sustainability.energy_per_1k_tokens_wh) {
      score += 10;
    }
    
    // Metadata richness
    maxScore += 15;
    const metadataFields = [
      model.metadata.use_case_recommendations?.length,
      model.metadata.competitive_advantages?.length,
      model.metadata.popularity_rank,
      model.metadata.release_date
    ].filter(Boolean).length;
    score += (metadataFields / 4) * 15;
    
    return Math.round((score / maxScore) * 100);
  }
}

/**
 * Business Rules Validation
 */
export class BusinessRulesValidator {
  /**
   * Validate model against business logic rules
   */
  static validateBusinessRules(model: AIModel): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Rule: OpenAI models should have specific naming patterns
    if (model.provider === 'OpenAI' && !model.id.toLowerCase().includes('gpt')) {
      violations.push('OpenAI models should typically include "gpt" in the ID');
    }
    
    // Rule: Deprecated models should have deprecation dates
    if (model.metadata.is_deprecated && !model.metadata.deprecation_date) {
      violations.push('Deprecated models must have a deprecation date');
    }
    
    // Rule: Beta models should not be marked as top popularity
    if (model.metadata.is_beta && (model.metadata.popularity_rank || 999) <= 5) {
      violations.push('Beta models should not be in top 5 popularity');
    }
    
    // Rule: Quality score should align with pricing tier
    if (model.performance.quality_score && model.pricing.input_price_per_1k_tokens) {
      const quality = model.performance.quality_score;
      const price = model.pricing.input_price_per_1k_tokens;
      
      // High quality (8+) models should not be ultra-cheap
      if (quality >= 8 && price < 0.1) {
        violations.push('High quality models typically have higher pricing');
      }
      
      // Low quality (<6) models should not be expensive
      if (quality < 6 && price > 5) {
        violations.push('Lower quality models should not be premium priced');
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

/**
 * Export validation utilities
 */
export const validateModel = ModelValidator.validateModel;
export const validateModels = ModelValidator.validateModels;
export const validateTokenScenario = ModelValidator.validateTokenScenario;