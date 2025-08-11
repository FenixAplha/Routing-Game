// models/model-manager.ts
// Comprehensive Model Management System with Persistence

import { AIModel, Provider, ModelCategory, ModelCapability } from './types';
import { AI_MODEL_DATABASE } from './database';

export interface CustomModel extends AIModel {
  is_custom: true;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ModelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ModelManager {
  private static instance: ModelManager;
  private models: Map<string, AIModel> = new Map();
  private customModels: Map<string, CustomModel> = new Map();
  private storageKey = 'ai-cost-calculator-models';

  constructor() {
    this.loadModels();
    this.loadCustomModels();
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private loadModels(): void {
    // Load built-in models
    AI_MODEL_DATABASE.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  private loadCustomModels(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const customModels = JSON.parse(stored) as CustomModel[];
        customModels.forEach(model => {
          this.customModels.set(model.id, model);
          this.models.set(model.id, model);
        });
      }
    } catch (error) {
      console.error('Failed to load custom models:', error);
    }
  }

  private saveCustomModels(): void {
    try {
      const customModelsArray = Array.from(this.customModels.values());
      localStorage.setItem(this.storageKey, JSON.stringify(customModelsArray));
    } catch (error) {
      console.error('Failed to save custom models:', error);
    }
  }

  // Get all models (built-in + custom)
  getAllModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  // Get only custom models
  getCustomModels(): CustomModel[] {
    return Array.from(this.customModels.values());
  }

  // Get model by ID
  getModel(id: string): AIModel | null {
    return this.models.get(id) || null;
  }

  // Validate model data
  validateModel(model: Partial<AIModel>): ModelValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!model.id) errors.push('Model ID is required');
    if (!model.name) errors.push('Model name is required');
    if (!model.provider) errors.push('Provider is required');
    if (!model.category) errors.push('Category is required');

    // ID uniqueness check (excluding current model in update scenarios)
    if (model.id && this.models.has(model.id)) {
      const existing = this.models.get(model.id);
      if (!existing || !this.customModels.has(model.id)) {
        errors.push('Model ID already exists');
      }
    }

    // Pricing validation
    if (model.pricing) {
      if (model.pricing.input_price_per_1k_tokens < 0) {
        errors.push('Input price cannot be negative');
      }
      if (model.pricing.output_price_per_1k_tokens < 0) {
        errors.push('Output price cannot be negative');
      }
      if (model.pricing.input_price_per_1k_tokens > 100) {
        warnings.push('Input price seems unusually high');
      }
      if (model.pricing.output_price_per_1k_tokens > 100) {
        warnings.push('Output price seems unusually high');
      }
    } else {
      errors.push('Pricing information is required');
    }

    // Specs validation
    if (model.specs) {
      if (model.specs.context_window < 1) {
        errors.push('Context window must be at least 1');
      }
      if (model.specs.context_window > 2000000) {
        warnings.push('Context window seems unusually large');
      }
    } else {
      errors.push('Model specifications are required');
    }

    // Performance validation
    if (model.performance?.quality_score !== undefined) {
      if (model.performance.quality_score < 0 || model.performance.quality_score > 10) {
        errors.push('Quality score must be between 0 and 10');
      }
    }

    // Capabilities validation
    if (!model.capabilities || model.capabilities.length === 0) {
      warnings.push('At least one capability should be specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Add custom model
  addCustomModel(modelData: Partial<AIModel>): { success: boolean; model?: CustomModel; errors?: string[] } {
    const validation = this.validateModel(modelData);
    
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const now = new Date().toISOString();
    const customModel: CustomModel = {
      ...modelData as AIModel,
      is_custom: true,
      created_at: now,
      updated_at: now,
      metadata: {
        ...modelData.metadata,
        is_custom: true,
        created_timestamp: now,
        updated_timestamp: now
      }
    };

    // Add to maps
    this.customModels.set(customModel.id, customModel);
    this.models.set(customModel.id, customModel);

    // Save to localStorage
    this.saveCustomModels();

    return { success: true, model: customModel };
  }

  // Update custom model
  updateCustomModel(id: string, updates: Partial<AIModel>): { success: boolean; model?: CustomModel; errors?: string[] } {
    const existingModel = this.customModels.get(id);
    if (!existingModel) {
      return { success: false, errors: ['Custom model not found'] };
    }

    const updatedData = { ...existingModel, ...updates };
    const validation = this.validateModel(updatedData);
    
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const updatedModel: CustomModel = {
      ...updatedData as CustomModel,
      updated_at: new Date().toISOString(),
      metadata: {
        ...updatedData.metadata,
        updated_timestamp: new Date().toISOString()
      }
    };

    // Update maps
    this.customModels.set(id, updatedModel);
    this.models.set(id, updatedModel);

    // Save to localStorage
    this.saveCustomModels();

    return { success: true, model: updatedModel };
  }

  // Delete custom model
  deleteCustomModel(id: string): boolean {
    if (!this.customModels.has(id)) {
      return false;
    }

    this.customModels.delete(id);
    this.models.delete(id);
    this.saveCustomModels();

    return true;
  }

  // Import models from JSON
  importModels(modelsData: any[]): { success: boolean; imported: number; errors: string[] } {
    let imported = 0;
    const errors: string[] = [];

    for (const modelData of modelsData) {
      const result = this.addCustomModel(modelData);
      if (result.success) {
        imported++;
      } else {
        errors.push(`Failed to import ${modelData.name || modelData.id}: ${result.errors?.join(', ')}`);
      }
    }

    return { success: imported > 0, imported, errors };
  }

  // Export custom models to JSON
  exportModels(): string {
    return JSON.stringify(Array.from(this.customModels.values()), null, 2);
  }

  // Clone existing model as custom
  cloneModel(id: string, overrides: Partial<AIModel> = {}): { success: boolean; model?: CustomModel; errors?: string[] } {
    const originalModel = this.models.get(id);
    if (!originalModel) {
      return { success: false, errors: ['Original model not found'] };
    }

    // Generate new ID
    const newId = overrides.id || `${originalModel.id}-copy-${Date.now()}`;
    const newName = overrides.name || `${originalModel.name} (Copy)`;

    const cloneData = {
      ...originalModel,
      ...overrides,
      id: newId,
      name: newName
    };

    return this.addCustomModel(cloneData);
  }

  // Get model statistics
  getStatistics() {
    const totalModels = this.models.size;
    const customModels = this.customModels.size;
    const builtInModels = totalModels - customModels;

    const providerStats = new Map<Provider, number>();
    const categoryStats = new Map<ModelCategory, number>();

    for (const model of this.models.values()) {
      providerStats.set(model.provider, (providerStats.get(model.provider) || 0) + 1);
      categoryStats.set(model.category, (categoryStats.get(model.category) || 0) + 1);
    }

    return {
      total: totalModels,
      builtIn: builtInModels,
      custom: customModels,
      providers: Object.fromEntries(providerStats),
      categories: Object.fromEntries(categoryStats)
    };
  }

  // Search models with advanced filtering
  searchModels(query: {
    text?: string;
    providers?: Provider[];
    categories?: ModelCategory[];
    capabilities?: ModelCapability[];
    customOnly?: boolean;
    priceRange?: { min: number; max: number };
  }): AIModel[] {
    let results = Array.from(this.models.values());

    // Filter by custom only
    if (query.customOnly) {
      results = results.filter(model => this.customModels.has(model.id));
    }

    // Text search
    if (query.text) {
      const searchText = query.text.toLowerCase();
      results = results.filter(model => 
        model.name.toLowerCase().includes(searchText) ||
        model.provider.toLowerCase().includes(searchText) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(searchText))
      );
    }

    // Provider filter
    if (query.providers && query.providers.length > 0) {
      results = results.filter(model => query.providers!.includes(model.provider));
    }

    // Category filter
    if (query.categories && query.categories.length > 0) {
      results = results.filter(model => query.categories!.includes(model.category));
    }

    // Capability filter
    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(model => 
        query.capabilities!.some(cap => model.capabilities.includes(cap))
      );
    }

    // Price range filter
    if (query.priceRange) {
      results = results.filter(model => {
        const avgPrice = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
        return avgPrice >= query.priceRange!.min && avgPrice <= query.priceRange!.max;
      });
    }

    return results;
  }

  // Reset to defaults (remove all custom models)
  resetToDefaults(): void {
    this.customModels.clear();
    localStorage.removeItem(this.storageKey);
    this.loadModels(); // Reload only built-in models
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();