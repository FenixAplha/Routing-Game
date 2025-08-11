// calc/enhanced-pricing.ts
// Enhanced Cost Calculator for Business Intelligence Application

import { AIModel, TokenScenario, CostAnalysisResult } from '../models';
import { Router } from './types';
import { calculateEquivalents } from './sustainability';

/**
 * Enhanced Cost Request for comprehensive analysis
 */
export interface EnhancedCostRequest {
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  requests_count: number;
  
  // Multimodal content
  images_count?: number;
  audio_minutes?: number;
  video_minutes?: number;
  
  // Business parameters
  cache_hit_rate?: number; // 0-1
  retry_rate?: number; // 0-1
  batch_processing?: boolean;
  
  // Router configuration for legacy compatibility
  router_path?: Router[];
}

/**
 * Comprehensive Cost Result for BI Analytics
 */
export interface EnhancedCostResult {
  model: AIModel;
  request: EnhancedCostRequest;
  
  // Detailed Cost Breakdown
  costs: {
    input_tokens_cost: number;
    output_tokens_cost: number;
    images_cost: number;
    audio_cost: number;
    video_cost: number;
    base_subtotal: number;
    batch_discount: number;
    cache_savings: number;
    retry_penalty: number;
    router_commission: number;
    total_cost: number;
  };
  
  // Per-unit Analysis
  per_unit: {
    cost_per_request: number;
    cost_per_input_token: number;
    cost_per_output_token: number;
    cost_per_total_token: number;
  };
  
  // Time-based Projections
  projections: {
    hourly_cost: number;
    daily_cost: number;
    weekly_cost: number;
    monthly_cost: number;
    annual_cost: number;
  };
  
  // Performance Estimates
  performance: {
    estimated_latency_ms: number;
    estimated_throughput_rps: number;
    quality_adjusted_cost: number; // cost / quality_score
    efficiency_score: number; // tokens per dollar
  };
  
  // Sustainability Impact
  sustainability: {
    energy_consumption_wh: number;
    co2e_kg: number;
    phone_charges_equivalent: number;
    household_hours_equivalent: number;
    sustainability_score: number;
  };
  
  // Business Intelligence
  insights: {
    cost_tier: 'budget' | 'mid-tier' | 'premium' | 'enterprise';
    optimization_opportunities: string[];
    risk_factors: string[];
    comparative_ranking: number; // vs other models in category
  };
}

/**
 * Enhanced Cost Calculator for Business Intelligence
 */
export class EnhancedCostCalculator {
  private models: Map<string, AIModel>;
  private sustainAssumptions: any;

  constructor(models: AIModel[], sustainAssumptions?: any) {
    this.models = new Map(models.map(m => [m.id, m]));
    this.sustainAssumptions = sustainAssumptions || {
      phoneChargeWh: 12,
      householdKWhPerDay: 10,
      gridKgCO2ePerKWh: 0.40
    };
  }

  /**
   * Calculate comprehensive cost analysis for a request
   */
  calculate(request: EnhancedCostRequest): EnhancedCostResult {
    const model = this.models.get(request.model_id);
    if (!model) {
      throw new Error(`Model '${request.model_id}' not found`);
    }

    // Base token costs
    const input_tokens_cost = (request.input_tokens * model.pricing.input_price_per_1k_tokens) / 1000;
    const output_tokens_cost = (request.output_tokens * model.pricing.output_price_per_1k_tokens) / 1000;
    
    // Multimodal costs
    const images_cost = (request.images_count || 0) * (model.pricing.image_price_per_image || 0);
    const audio_cost = (request.audio_minutes || 0) * (model.pricing.audio_price_per_minute || 0);
    const video_cost = (request.video_minutes || 0) * (model.pricing.video_price_per_minute || 0);
    
    const base_subtotal = input_tokens_cost + output_tokens_cost + images_cost + audio_cost + video_cost;
    
    // Apply discounts and penalties
    const batch_discount = request.batch_processing ? 
      base_subtotal * (model.pricing.batch_discount || 0) : 0;
    
    const cache_savings = (request.cache_hit_rate || 0) * output_tokens_cost * 0.5; // 50% savings on cached outputs
    
    const retry_penalty = (request.retry_rate || 0) * base_subtotal; // Full cost for retries
    
    // Router commission (legacy compatibility)
    const router_commission = request.router_path ? 
      this.calculateRouterCommission(base_subtotal, request.router_path) : 0;
    
    const total_cost = Math.max(0, 
      base_subtotal - batch_discount - cache_savings + retry_penalty + router_commission
    ) * request.requests_count;

    // Per-unit calculations
    const total_tokens = request.input_tokens + request.output_tokens;
    const cost_per_request = total_cost / request.requests_count;
    const cost_per_input_token = input_tokens_cost / (request.input_tokens || 1);
    const cost_per_output_token = output_tokens_cost / (request.output_tokens || 1);
    const cost_per_total_token = (input_tokens_cost + output_tokens_cost) / (total_tokens || 1);

    // Performance estimates
    const estimated_latency_ms = model.performance.latency_p50_ms || 1000;
    const estimated_throughput_rps = model.performance.throughput_tokens_per_second || 50;
    const quality_adjusted_cost = (model.performance.quality_score || 1) > 0 ? 
      cost_per_request / (model.performance.quality_score || 1) : cost_per_request;
    const efficiency_score = total_cost > 0 ? (total_tokens * request.requests_count) / total_cost : 0;

    // Sustainability calculations
    const energy_per_request = ((model.sustainability.energy_per_1k_tokens_wh || 0.1) * total_tokens / 1000) +
      (model.sustainability.energy_per_request_wh || 0);
    const energy_consumption_wh = energy_per_request * request.requests_count;
    const equivalents = calculateEquivalents(energy_consumption_wh, this.sustainAssumptions);

    // Business intelligence insights
    const avgCost = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
    const cost_tier: 'budget' | 'mid-tier' | 'premium' | 'enterprise' = 
      avgCost < 1 ? 'budget' : 
      avgCost < 5 ? 'mid-tier' : 
      avgCost < 15 ? 'premium' : 'enterprise';

    const optimization_opportunities = this.generateOptimizationOpportunities(model, request, {
      total_cost,
      cost_per_request,
      energy_consumption_wh
    });

    const risk_factors = this.identifyRiskFactors(model, request);

    return {
      model,
      request,
      costs: {
        input_tokens_cost: input_tokens_cost * request.requests_count,
        output_tokens_cost: output_tokens_cost * request.requests_count,
        images_cost: images_cost * request.requests_count,
        audio_cost: audio_cost * request.requests_count,
        video_cost: video_cost * request.requests_count,
        base_subtotal: base_subtotal * request.requests_count,
        batch_discount: batch_discount * request.requests_count,
        cache_savings: cache_savings * request.requests_count,
        retry_penalty: retry_penalty * request.requests_count,
        router_commission: router_commission * request.requests_count,
        total_cost
      },
      per_unit: {
        cost_per_request,
        cost_per_input_token,
        cost_per_output_token,
        cost_per_total_token
      },
      projections: {
        hourly_cost: total_cost * (3600 / (estimated_latency_ms / 1000)), // Rough estimate
        daily_cost: total_cost * 24, // If run continuously
        weekly_cost: total_cost * 24 * 7,
        monthly_cost: total_cost * 24 * 30,
        annual_cost: total_cost * 24 * 365
      },
      performance: {
        estimated_latency_ms,
        estimated_throughput_rps,
        quality_adjusted_cost,
        efficiency_score
      },
      sustainability: {
        energy_consumption_wh,
        co2e_kg: equivalents.co2eKg,
        phone_charges_equivalent: equivalents.phoneCharges,
        household_hours_equivalent: equivalents.householdHours,
        sustainability_score: model.sustainability.compute_efficiency_score || 5
      },
      insights: {
        cost_tier,
        optimization_opportunities,
        risk_factors,
        comparative_ranking: model.metadata.popularity_rank || 999
      }
    };
  }

  /**
   * Calculate costs for multiple models (comparison)
   */
  compareModels(modelIds: string[], scenario: TokenScenario): EnhancedCostResult[] {
    return modelIds.map(modelId => {
      const request: EnhancedCostRequest = {
        model_id: modelId,
        input_tokens: scenario.input_tokens.mean,
        output_tokens: scenario.output_tokens.mean,
        requests_count: scenario.requests_per_day,
        cache_hit_rate: scenario.cache_hit_rate,
        retry_rate: scenario.retry_rate
      };
      
      return this.calculate(request);
    }).sort((a, b) => a.costs.total_cost - b.costs.total_cost);
  }

  /**
   * Calculate batch costs for scenario analysis
   */
  calculateBatch(requests: EnhancedCostRequest[]): EnhancedCostResult[] {
    return requests.map(request => this.calculate(request));
  }

  /**
   * Estimate monthly costs from usage patterns
   */
  estimateMonthly(
    modelId: string, 
    daily_requests: number, 
    token_estimate: { input_mean: number; output_mean: number }
  ): EnhancedCostResult {
    const request: EnhancedCostRequest = {
      model_id: modelId,
      input_tokens: token_estimate.input_mean,
      output_tokens: token_estimate.output_mean,
      requests_count: daily_requests * 30 // Monthly estimate
    };
    
    return this.calculate(request);
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationOpportunities(
    model: AIModel, 
    request: EnhancedCostRequest, 
    results: { total_cost: number; cost_per_request: number; energy_consumption_wh: number }
  ): string[] {
    const opportunities: string[] = [];
    
    // Cost optimization
    if (results.cost_per_request > 0.10) {
      opportunities.push('Consider using a smaller model for simple queries');
    }
    
    if (!request.batch_processing && request.requests_count > 100) {
      opportunities.push('Enable batch processing to reduce costs');
    }
    
    if ((request.cache_hit_rate || 0) < 0.3) {
      opportunities.push('Implement response caching to reduce repeat costs');
    }
    
    // Performance optimization
    if (model.performance.latency_p50_ms && model.performance.latency_p50_ms > 2000) {
      opportunities.push('Consider faster models for time-sensitive applications');
    }
    
    // Sustainability optimization
    if (results.energy_consumption_wh > 100) {
      opportunities.push('Switch to more energy-efficient models for sustainability');
    }
    
    return opportunities;
  }

  /**
   * Identify potential risk factors
   */
  private identifyRiskFactors(model: AIModel, request: EnhancedCostRequest): string[] {
    const risks: string[] = [];
    
    if (model.metadata.is_deprecated) {
      risks.push('Model is deprecated and may be discontinued');
    }
    
    if (model.metadata.is_beta) {
      risks.push('Beta model may have stability issues');
    }
    
    if ((request.retry_rate || 0) > 0.1) {
      risks.push('High retry rate indicates potential reliability issues');
    }
    
    if (request.requests_count > 10000) {
      risks.push('High volume usage may hit rate limits');
    }
    
    return risks;
  }

  /**
   * Calculate router commission (legacy compatibility)
   */
  private calculateRouterCommission(baseCost: number, routers: Router[]): number {
    const totalFeePct = routers
      .filter(r => r.enabled)
      .reduce((sum, r) => sum + r.feePct, 0);
    
    // Cap total commission at 95%
    const cappedRate = Math.min(0.95, Math.max(0, totalFeePct));
    
    return baseCost * cappedRate;
  }
}

/**
 * Utility functions for enhanced pricing
 */
export const EnhancedPricingUtils = {
  /**
   * Format cost with appropriate precision
   */
  formatCost: (cost: number): string => {
    if (cost < 0.001) return `$${(cost * 1000000).toFixed(2)}µ`;
    if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}m`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    if (cost < 100) return `$${cost.toFixed(2)}`;
    return `$${Math.round(cost).toLocaleString()}`;
  },

  /**
   * Calculate cost efficiency score
   */
  calculateEfficiency: (cost: number, quality: number, tokens: number): number => {
    return quality * tokens / Math.max(cost, 0.0001);
  },

  /**
   * Determine cost tier from pricing
   */
  getCostTier: (avgCostPer1kTokens: number): 'budget' | 'mid-tier' | 'premium' | 'enterprise' => {
    if (avgCostPer1kTokens < 1) return 'budget';
    if (avgCostPer1kTokens < 5) return 'mid-tier';
    if (avgCostPer1kTokens < 15) return 'premium';
    return 'enterprise';
  }
};

