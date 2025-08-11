// models/search.ts
// Advanced Model Search and Filtering for Business Intelligence

import { AIModel, ModelSearchFilters, ModelSearchResult, Provider, ModelCategory, ModelCapability } from './types';
import { AI_MODEL_DATABASE } from './database';

/**
 * Advanced Model Search Engine for BI Application
 * Supports complex filtering, sorting, and intelligent suggestions
 */
export class ModelSearchEngine {
  private models: AIModel[];

  constructor(models: AIModel[] = AI_MODEL_DATABASE) {
    this.models = models;
  }

  /**
   * Execute advanced search with filters and intelligent ranking
   */
  search(filters: ModelSearchFilters = {}): ModelSearchResult {
    let filteredModels = this.applyFilters(this.models, filters);
    
    // Apply text search if provided
    if (filters.text_search) {
      filteredModels = this.applyTextSearch(filteredModels, filters.text_search);
    }

    // Sort results
    if (filters.sort_by) {
      filteredModels = this.sortModels(filteredModels, filters.sort_by, filters.sort_order || 'asc');
    }

    // Generate intelligent suggestions
    const suggestions = this.generateSuggestions(filteredModels, filters);

    return {
      models: filteredModels,
      total_count: filteredModels.length,
      filters_applied: filters,
      suggestions
    };
  }

  /**
   * Apply all filters to model list
   */
  private applyFilters(models: AIModel[], filters: ModelSearchFilters): AIModel[] {
    let filtered = [...models];

    // Provider filter
    if (filters.providers && filters.providers.length > 0) {
      filtered = filtered.filter(model => filters.providers!.includes(model.provider));
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(model => filters.categories!.includes(model.category));
    }

    // Capabilities filter
    if (filters.capabilities && filters.capabilities.length > 0) {
      filtered = filtered.filter(model => 
        filters.capabilities!.some(cap => model.capabilities.includes(cap))
      );
    }

    // Cost filter
    if (filters.max_cost_per_1k_tokens !== undefined) {
      filtered = filtered.filter(model => 
        Math.max(model.pricing.input_price_per_1k_tokens, model.pricing.output_price_per_1k_tokens) 
        <= filters.max_cost_per_1k_tokens!
      );
    }

    // Context window filter
    if (filters.min_context_window !== undefined) {
      filtered = filtered.filter(model => 
        model.specs.context_window >= filters.min_context_window!
      );
    }

    // Deprecated filter
    if (filters.include_deprecated === false) {
      filtered = filtered.filter(model => !model.metadata.is_deprecated);
    }

    return filtered;
  }

  /**
   * Apply intelligent text search across model fields
   */
  private applyTextSearch(models: AIModel[], searchText: string): AIModel[] {
    const search = searchText.toLowerCase().trim();
    if (!search) return models;

    return models.filter(model => {
      // Search in name and display name
      if (model.name.toLowerCase().includes(search) || 
          model.display_name?.toLowerCase().includes(search)) {
        return true;
      }

      // Search in provider
      if (model.provider.toLowerCase().includes(search)) {
        return true;
      }

      // Search in capabilities
      if (model.capabilities.some(cap => cap.toLowerCase().includes(search))) {
        return true;
      }

      // Search in use cases
      if (model.metadata.use_case_recommendations?.some(useCase => 
          useCase.toLowerCase().includes(search))) {
        return true;
      }

      // Search in advantages
      if (model.metadata.competitive_advantages?.some(advantage => 
          advantage.toLowerCase().includes(search))) {
        return true;
      }

      return false;
    }).sort((a, b) => {
      // Boost exact name matches
      const aNameMatch = a.name.toLowerCase().includes(search);
      const bNameMatch = b.name.toLowerCase().includes(search);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Then sort by popularity
      return (a.metadata.popularity_rank || 999) - (b.metadata.popularity_rank || 999);
    });
  }

  /**
   * Sort models by specified criteria
   */
  private sortModels(models: AIModel[], sortBy: string, order: 'asc' | 'desc'): AIModel[] {
    const sorted = [...models].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'cost':
          const aCost = (a.pricing.input_price_per_1k_tokens + a.pricing.output_price_per_1k_tokens) / 2;
          const bCost = (b.pricing.input_price_per_1k_tokens + b.pricing.output_price_per_1k_tokens) / 2;
          comparison = aCost - bCost;
          break;

        case 'performance':
          const aPerf = a.performance.quality_score || 0;
          const bPerf = b.performance.quality_score || 0;
          comparison = bPerf - aPerf; // Higher quality first
          break;

        case 'popularity':
          const aPopularity = a.metadata.popularity_rank || 999;
          const bPopularity = b.metadata.popularity_rank || 999;
          comparison = aPopularity - bPopularity; // Lower rank number = more popular
          break;

        case 'release_date':
          const aDate = new Date(a.metadata.release_date || '1900-01-01');
          const bDate = new Date(b.metadata.release_date || '1900-01-01');
          comparison = bDate.getTime() - aDate.getTime(); // Newer first
          break;

        case 'sustainability':
          const aEnergy = a.sustainability.energy_per_1k_tokens_wh || 999;
          const bEnergy = b.sustainability.energy_per_1k_tokens_wh || 999;
          comparison = aEnergy - bEnergy; // Lower energy first
          break;

        default:
          comparison = a.name.localeCompare(b.name);
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Generate intelligent suggestions based on search results
   */
  private generateSuggestions(models: AIModel[], filters: ModelSearchFilters) {
    const allModels = this.models;
    
    // Alternative providers if current filter is too restrictive
    const alternative_providers: Provider[] = [];
    if (models.length < 3 && filters.providers && filters.providers.length === 1) {
      const currentProvider = filters.providers[0];
      const otherProviders = [...new Set(allModels.map(m => m.provider))]
        .filter(p => p !== currentProvider)
        .slice(0, 3);
      alternative_providers.push(...otherProviders);
    }

    // Similar models based on capabilities and category
    const similar_models: string[] = [];
    if (models.length > 0 && models.length < 5) {
      const sampleModel = models[0];
      const similarModels = allModels
        .filter(m => 
          m.id !== sampleModel.id &&
          m.category === sampleModel.category &&
          m.capabilities.some(cap => sampleModel.capabilities.includes(cap))
        )
        .sort((a, b) => (a.metadata.popularity_rank || 999) - (b.metadata.popularity_rank || 999))
        .slice(0, 3)
        .map(m => m.name);
      similar_models.push(...similarModels);
    }

    // Cost optimization opportunities
    const cost_optimization_opportunities: string[] = [];
    if (models.length > 0) {
      const avgCost = models.reduce((sum, m) => 
        sum + (m.pricing.input_price_per_1k_tokens + m.pricing.output_price_per_1k_tokens) / 2, 0
      ) / models.length;

      if (avgCost > 5) {
        cost_optimization_opportunities.push('Consider GPT-4o Mini or Claude 3 Haiku for cost savings');
      }
      if (avgCost > 10) {
        cost_optimization_opportunities.push('Gemini 1.5 Flash offers excellent price/performance');
      }
      if (models.every(m => m.provider === 'OpenAI')) {
        cost_optimization_opportunities.push('Anthropic and Google models may offer better value');
      }
    }

    return {
      alternative_providers,
      similar_models,
      cost_optimization_opportunities
    };
  }

  /**
   * Get model recommendations based on use case
   */
  getRecommendationsForUseCase(useCase: string): AIModel[] {
    const useCaseLower = useCase.toLowerCase();
    
    // Define use case to model mappings
    const useCaseMappings: Record<string, string[]> = {
      'customer-support': ['gpt-4o-mini', 'claude-3-haiku', 'gpt-3-5-turbo'],
      'content-creation': ['claude-3-5-sonnet', 'gpt-4o', 'mistral-large'],
      'code-generation': ['claude-3-5-sonnet', 'gpt-4o', 'llama-3-1-70b'],
      'document-analysis': ['gemini-1-5-pro', 'claude-3-5-sonnet', 'gpt-4o'],
      'research': ['claude-3-opus', 'gpt-4o', 'claude-3-5-sonnet'],
      'simple-tasks': ['gpt-4o-mini', 'claude-3-haiku', 'gpt-3-5-turbo'],
      'multimodal': ['gpt-4o', 'gemini-1-5-pro', 'claude-3-5-sonnet'],
      'cost-effective': ['gpt-4o-mini', 'gemini-1-5-flash', 'claude-3-haiku']
    };

    // Find matching use case
    const matchingKey = Object.keys(useCaseMappings).find(key => 
      useCaseLower.includes(key) || key.includes(useCaseLower)
    );

    if (matchingKey) {
      const modelIds = useCaseMappings[matchingKey];
      return modelIds.map(id => this.models.find(m => m.id === id)).filter(Boolean) as AIModel[];
    }

    // Fallback to top models
    return this.getTopModelsByQuality(5);
  }

  /**
   * Get top models by quality score
   */
  getTopModelsByQuality(limit: number = 10): AIModel[] {
    return [...this.models]
      .sort((a, b) => (b.performance.quality_score || 0) - (a.performance.quality_score || 0))
      .slice(0, limit);
  }

  /**
   * Get most cost-effective models
   */
  getMostCostEffective(limit: number = 10): AIModel[] {
    return [...this.models]
      .sort((a, b) => {
        const aCostEfficiency = (a.performance.quality_score || 1) / 
          ((a.pricing.input_price_per_1k_tokens + a.pricing.output_price_per_1k_tokens) / 2);
        const bCostEfficiency = (b.performance.quality_score || 1) / 
          ((b.pricing.input_price_per_1k_tokens + b.pricing.output_price_per_1k_tokens) / 2);
        return bCostEfficiency - aCostEfficiency;
      })
      .slice(0, limit);
  }

  /**
   * Get most sustainable models
   */
  getMostSustainable(limit: number = 10): AIModel[] {
    return [...this.models]
      .filter(m => m.sustainability.energy_per_1k_tokens_wh !== undefined)
      .sort((a, b) => 
        (a.sustainability.energy_per_1k_tokens_wh || 999) - 
        (b.sustainability.energy_per_1k_tokens_wh || 999)
      )
      .slice(0, limit);
  }

  /**
   * Advanced model comparison
   */
  compareModels(modelIds: string[]): AIModel[] {
    return modelIds.map(id => this.models.find(m => m.id === id)).filter(Boolean) as AIModel[];
  }

  /**
   * Get models with similar characteristics
   */
  findSimilarModels(referenceModelId: string, limit: number = 5): AIModel[] {
    const referenceModel = this.models.find(m => m.id === referenceModelId);
    if (!referenceModel) return [];

    return this.models
      .filter(m => m.id !== referenceModelId)
      .map(model => ({
        model,
        similarity: this.calculateSimilarity(referenceModel, model)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.model);
  }

  /**
   * Calculate similarity score between two models
   */
  private calculateSimilarity(model1: AIModel, model2: AIModel): number {
    let score = 0;

    // Same category: +0.3
    if (model1.category === model2.category) score += 0.3;

    // Similar capabilities: +0.2
    const commonCapabilities = model1.capabilities.filter(cap => 
      model2.capabilities.includes(cap)
    ).length;
    score += (commonCapabilities / Math.max(model1.capabilities.length, model2.capabilities.length)) * 0.2;

    // Similar price range: +0.2
    const price1 = (model1.pricing.input_price_per_1k_tokens + model1.pricing.output_price_per_1k_tokens) / 2;
    const price2 = (model2.pricing.input_price_per_1k_tokens + model2.pricing.output_price_per_1k_tokens) / 2;
    const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);
    score += Math.max(0, (1 - priceDiff)) * 0.2;

    // Similar quality: +0.15
    if (model1.performance.quality_score && model2.performance.quality_score) {
      const qualityDiff = Math.abs(model1.performance.quality_score - model2.performance.quality_score) / 10;
      score += Math.max(0, (1 - qualityDiff)) * 0.15;
    }

    // Similar context window: +0.15
    const contextDiff = Math.abs(model1.specs.context_window - model2.specs.context_window) / 
      Math.max(model1.specs.context_window, model2.specs.context_window);
    score += Math.max(0, (1 - contextDiff)) * 0.15;

    return score;
  }
}

/**
 * Global search engine instance
 */
export const modelSearchEngine = new ModelSearchEngine();