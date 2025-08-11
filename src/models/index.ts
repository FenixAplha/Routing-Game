// models/index.ts
// Model System Exports for Business Intelligence Application

// Types - Only export what's actually used
export type {
  AIModel,
  Provider,
  TokenScenario,
  CostAnalysisResult,
  ModelCategory,
  ModelCapability,
  ModelSearchFilters,
  TokenDistribution
} from './types';

// Database - Only export what's actually used
export {
  PROVIDER_COLORS
} from './database';

// Search Engine - Only export what's actually used
export {
  modelSearchEngine
} from './search';

// Validation - Only export what's actually used
export {
  validateTokenScenario
} from './validator';

// Import types and functions for ModelUtils
import type { AIModel, TokenScenario } from './types';
import { AI_MODEL_DATABASE, getModelById } from './database';

/**
 * Quick access functions for common operations
 */
export const ModelUtils = {
  // Get model by ID with error handling
  getModel: (id: string) => {
    const model = getModelById(id);
    if (!model) {
      throw new Error(`Model with ID '${id}' not found`);
    }
    return model;
  },

  // Get cost-effective alternatives to a model
  getCostEffectiveAlternatives: (modelId: string, maxAlternatives = 3) => {
    const model = getModelById(modelId);
    if (!model) return [];
    
    const currentCost = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
    
    return AI_MODEL_DATABASE
      .filter(m => 
        m.id !== modelId &&
        m.category === model.category &&
        ((m.pricing.input_price_per_1k_tokens + m.pricing.output_price_per_1k_tokens) / 2) < currentCost
      )
      .sort((a, b) => {
        const aCost = (a.pricing.input_price_per_1k_tokens + a.pricing.output_price_per_1k_tokens) / 2;
        const bCost = (b.pricing.input_price_per_1k_tokens + b.pricing.output_price_per_1k_tokens) / 2;
        const aQuality = a.performance.quality_score || 5;
        const bQuality = b.performance.quality_score || 5;
        
        // Sort by quality/cost ratio
        return (bQuality / bCost) - (aQuality / aCost);
      })
      .slice(0, maxAlternatives);
  },

  // Calculate total cost for a scenario
  calculateScenarioCost: (model: AIModel, scenario: TokenScenario): number => {
    const inputCost = (scenario.input_tokens.mean * scenario.requests_per_day * model.pricing.input_price_per_1k_tokens) / 1000;
    const outputCost = (scenario.output_tokens.mean * scenario.requests_per_day * model.pricing.output_price_per_1k_tokens) / 1000;
    return inputCost + outputCost;
  },

  // Get provider market share
  getProviderMarketShare: () => {
    const providerCounts = AI_MODEL_DATABASE.reduce((acc, model) => {
      acc[model.provider] = (acc[model.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(providerCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(providerCounts).map(([provider, count]) => ({
      provider,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  },

  // Get category distribution
  getCategoryDistribution: () => {
    const categoryCounts = AI_MODEL_DATABASE.reduce((acc, model) => {
      acc[model.category] = (acc[model.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  },

  // Get pricing statistics
  getPricingStats: () => {
    const inputPrices = AI_MODEL_DATABASE.map(m => m.pricing.input_price_per_1k_tokens);
    const outputPrices = AI_MODEL_DATABASE.map(m => m.pricing.output_price_per_1k_tokens);
    
    return {
      input: {
        min: Math.min(...inputPrices),
        max: Math.max(...inputPrices),
        avg: inputPrices.reduce((sum, price) => sum + price, 0) / inputPrices.length,
        median: inputPrices.sort((a, b) => a - b)[Math.floor(inputPrices.length / 2)]
      },
      output: {
        min: Math.min(...outputPrices),
        max: Math.max(...outputPrices),
        avg: outputPrices.reduce((sum, price) => sum + price, 0) / outputPrices.length,
        median: outputPrices.sort((a, b) => a - b)[Math.floor(outputPrices.length / 2)]
      }
    };
  }
};