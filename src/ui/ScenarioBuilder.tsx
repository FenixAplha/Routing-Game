// ui/ScenarioBuilder.tsx  
// Comprehensive Scenario Creation Interface for Business Intelligence

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TokenScenario, 
  TokenDistribution,
  AIModel,
  ModelSearchFilters,
  modelSearchEngine,
  PROVIDER_COLORS,
  validateTokenScenario
} from '../models';
import { EnhancedCostCalculator, EnhancedCostRequest } from '../calc/enhanced-pricing';
import { EnhancedCostResult } from '../calc/enhanced-pricing';

interface ScenarioBuilderProps {
  models: AIModel[];
  onScenarioSave?: (scenario: TokenScenario) => void;
  onScenarioTest?: (scenario: TokenScenario, selectedModels: string[]) => void;
  initialScenario?: TokenScenario;
  isOpen: boolean;
  onClose: () => void;
}

interface ModelMixItem {
  model_id: string;
  weight: number;
  fallback_priority: number;
}

interface ScenarioFormData {
  name: string;
  description: string;
  
  // Traffic characteristics
  requests_per_day: number;
  peak_concurrency: number;
  request_pattern: 'steady' | 'bursty' | 'business-hours' | 'custom';
  
  // Token patterns
  input_tokens: TokenDistribution;
  output_tokens: TokenDistribution;
  
  // Model selection strategy
  model_mix: ModelMixItem[];
  routing_strategy: 'cost-optimized' | 'latency-optimized' | 'balanced' | 'custom';
  
  // Advanced settings
  cache_hit_rate: number;
  retry_rate: number;
  scaling_factor: number;
  
  // Multimodal content
  images_per_request: number;
  audio_minutes_per_request: number;
  
  // Business context
  category: 'customer-support' | 'content-creation' | 'code-generation' | 'document-analysis' | 'research' | 'custom';
  priority: 'cost' | 'quality' | 'speed' | 'balanced';
}

const defaultFormData: ScenarioFormData = {
  name: '',
  description: '',
  requests_per_day: 1000,
  peak_concurrency: 10,
  request_pattern: 'steady',
  input_tokens: {
    mean: 150,
    variance: 50,
    min: 50,
    max: 500,
    distribution_type: 'normal'
  },
  output_tokens: {
    mean: 100,
    variance: 30,
    min: 20,
    max: 300,
    distribution_type: 'normal'
  },
  model_mix: [],
  routing_strategy: 'balanced',
  cache_hit_rate: 0.2,
  retry_rate: 0.05,
  scaling_factor: 1.0,
  images_per_request: 0,
  audio_minutes_per_request: 0,
  category: 'custom',
  priority: 'balanced'
};

const SCENARIO_TEMPLATES = {
  'customer-support': {
    name: 'Customer Support',
    description: 'AI-powered customer service with escalation patterns',
    requests_per_day: 1000,
    input_tokens: { mean: 150, variance: 50, min: 50, max: 500, distribution_type: 'normal' as const },
    output_tokens: { mean: 100, variance: 30, min: 20, max: 300, distribution_type: 'normal' as const },
    cache_hit_rate: 0.4,
    priority: 'cost' as const
  },
  'content-creation': {
    name: 'Content Creation',
    description: 'High-quality content generation for marketing and creative workflows',
    requests_per_day: 200,
    input_tokens: { mean: 300, variance: 100, min: 100, max: 1000, distribution_type: 'normal' as const },
    output_tokens: { mean: 800, variance: 200, min: 200, max: 2000, distribution_type: 'normal' as const },
    cache_hit_rate: 0.1,
    priority: 'quality' as const
  },
  'code-generation': {
    name: 'Code Generation',
    description: 'Developer productivity tool with code generation and debugging',
    requests_per_day: 500,
    input_tokens: { mean: 200, variance: 80, min: 50, max: 800, distribution_type: 'normal' as const },
    output_tokens: { mean: 400, variance: 150, min: 50, max: 1500, distribution_type: 'normal' as const },
    cache_hit_rate: 0.25,
    priority: 'quality' as const
  },
  'document-analysis': {
    name: 'Document Analysis',
    description: 'Large document processing and intelligent summarization',
    requests_per_day: 100,
    input_tokens: { mean: 4000, variance: 1000, min: 1000, max: 10000, distribution_type: 'lognormal' as const },
    output_tokens: { mean: 500, variance: 150, min: 100, max: 1000, distribution_type: 'normal' as const },
    cache_hit_rate: 0.3,
    priority: 'balanced' as const
  }
};

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({
  models,
  onScenarioSave,
  onScenarioTest,
  initialScenario,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<ScenarioFormData>(defaultFormData);
  const [currentTab, setCurrentTab] = useState<'basic' | 'traffic' | 'tokens' | 'models' | 'advanced'>('basic');
  const [errors, setErrors] = useState<string[]>([]);
  const [showModelSearch, setShowModelSearch] = useState(false);
  const [selectedModelsForTest, setSelectedModelsForTest] = useState<string[]>([]);
  const [costPreview, setCostPreview] = useState<EnhancedCostResult[]>([]);
  const [isCalculatingPreview, setIsCalculatingPreview] = useState(false);

  // Available models filtered by current category
  const availableModels = useMemo(() => {
    const filters: ModelSearchFilters = {
      sort_by: formData.priority === 'cost' ? 'cost' : 
               formData.priority === 'speed' ? 'performance' : 'popularity'
    };
    
    return modelSearchEngine.search(filters).models.slice(0, 20);
  }, [formData.priority]);

  // Auto-populate model mix based on scenario priority
  useEffect(() => {
    if (formData.model_mix.length === 0 && availableModels.length > 0) {
      const recommendedModels = getRecommendedModels(formData.category, formData.priority);
      setFormData(prev => ({ ...prev, model_mix: recommendedModels }));
    }
  }, [formData.category, formData.priority, availableModels]);

  // Calculate cost preview when form data changes
  useEffect(() => {
    if (formData.model_mix.length > 0 && formData.requests_per_day > 0) {
      calculateCostPreview();
    }
  }, [formData]);

  const updateField = <K extends keyof ScenarioFormData>(field: K, value: ScenarioFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const updateTokenDistribution = (
    type: 'input_tokens' | 'output_tokens',
    field: keyof TokenDistribution,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const applyTemplate = (templateKey: keyof typeof SCENARIO_TEMPLATES) => {
    const template = SCENARIO_TEMPLATES[templateKey];
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      requests_per_day: template.requests_per_day,
      input_tokens: template.input_tokens,
      output_tokens: template.output_tokens,
      cache_hit_rate: template.cache_hit_rate,
      category: templateKey,
      priority: template.priority
    }));
  };

  const getRecommendedModels = (category: string, priority: string): ModelMixItem[] => {
    // Smart model recommendations based on category and priority
    const recommendations: Record<string, Record<string, ModelMixItem[]>> = {
      'customer-support': {
        cost: [
          { model_id: 'gpt-4o-mini', weight: 0.8, fallback_priority: 1 },
          { model_id: 'claude-3-haiku', weight: 0.2, fallback_priority: 2 }
        ],
        quality: [
          { model_id: 'gpt-4o', weight: 0.6, fallback_priority: 1 },
          { model_id: 'claude-3-5-sonnet', weight: 0.4, fallback_priority: 2 }
        ],
        speed: [
          { model_id: 'gpt-4o-mini', weight: 0.7, fallback_priority: 1 },
          { model_id: 'gemini-1-5-flash', weight: 0.3, fallback_priority: 2 }
        ]
      },
      'content-creation': {
        quality: [
          { model_id: 'claude-3-5-sonnet', weight: 0.6, fallback_priority: 1 },
          { model_id: 'gpt-4o', weight: 0.4, fallback_priority: 2 }
        ],
        cost: [
          { model_id: 'claude-3-haiku', weight: 0.5, fallback_priority: 1 },
          { model_id: 'gpt-4o-mini', weight: 0.5, fallback_priority: 2 }
        ]
      },
      'code-generation': {
        quality: [
          { model_id: 'claude-3-5-sonnet', weight: 0.5, fallback_priority: 1 },
          { model_id: 'gpt-4o', weight: 0.3, fallback_priority: 2 },
          { model_id: 'gpt-4o-mini', weight: 0.2, fallback_priority: 3 }
        ]
      },
      'document-analysis': {
        balanced: [
          { model_id: 'gemini-1-5-pro', weight: 0.7, fallback_priority: 1 },
          { model_id: 'claude-3-5-sonnet', weight: 0.3, fallback_priority: 2 }
        ]
      }
    };

    const categoryRecs = recommendations[category];
    if (!categoryRecs) return [];
    
    return categoryRecs[priority] || categoryRecs['balanced'] || [];
  };

  const calculateCostPreview = async () => {
    if (isCalculatingPreview) return;
    
    setIsCalculatingPreview(true);
    try {
      const calculator = new EnhancedCostCalculator(models);
      const previews: EnhancedCostResult[] = [];

      // Calculate for each model in the mix
      for (const mixItem of formData.model_mix.slice(0, 3)) { // Limit to 3 for performance
        const request: EnhancedCostRequest = {
          model_id: mixItem.model_id,
          input_tokens: formData.input_tokens.mean,
          output_tokens: formData.output_tokens.mean,
          requests_count: Math.round(formData.requests_per_day * mixItem.weight),
          images_count: formData.images_per_request,
          audio_minutes: formData.audio_minutes_per_request,
          cache_hit_rate: formData.cache_hit_rate,
          retry_rate: formData.retry_rate
        };

        try {
          const result = calculator.calculate(request);
          previews.push(result);
        } catch (error) {
          console.warn(`Failed to calculate cost for model ${mixItem.model_id}:`, error);
        }
      }

      setCostPreview(previews);
    } catch (error) {
      console.error('Cost preview calculation failed:', error);
    } finally {
      setIsCalculatingPreview(false);
    }
  };

  const addModelToMix = (modelId: string) => {
    if (formData.model_mix.some(m => m.model_id === modelId)) return;
    
    const newWeight = formData.model_mix.length === 0 ? 1.0 : 
      Math.max(0.1, (1.0 - formData.model_mix.reduce((sum, m) => sum + m.weight, 0)));
    
    setFormData(prev => ({
      ...prev,
      model_mix: [...prev.model_mix, {
        model_id: modelId,
        weight: newWeight,
        fallback_priority: prev.model_mix.length + 1
      }]
    }));
  };

  const removeModelFromMix = (index: number) => {
    setFormData(prev => ({
      ...prev,
      model_mix: prev.model_mix.filter((_, i) => i !== index)
    }));
  };

  const updateModelWeight = (index: number, weight: number) => {
    setFormData(prev => ({
      ...prev,
      model_mix: prev.model_mix.map((item, i) => 
        i === index ? { ...item, weight: Math.max(0, Math.min(1, weight)) } : item
      )
    }));
  };

  const handleSave = () => {
    const scenario: TokenScenario = {
      name: formData.name,
      description: formData.description,
      input_tokens: formData.input_tokens,
      output_tokens: formData.output_tokens,
      requests_per_day: formData.requests_per_day,
      peak_concurrency: formData.peak_concurrency,
      cache_hit_rate: formData.cache_hit_rate,
      retry_rate: formData.retry_rate
    };

    const validation = validateTokenScenario(scenario);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onScenarioSave?.(validation.data);
    onClose();
  };

  const handleTest = () => {
    console.log('🧪 ScenarioBuilder handleTest called');
    console.log('📝 Form data:', formData);
    console.log('🎯 Model mix:', formData.model_mix);
    
    const scenario: TokenScenario = {
      name: formData.name || 'Test Scenario',
      description: formData.description || 'Generated test scenario',
      input_tokens: formData.input_tokens,
      output_tokens: formData.output_tokens,
      requests_per_day: formData.requests_per_day,
      peak_concurrency: formData.peak_concurrency,
      cache_hit_rate: formData.cache_hit_rate || 0.2,
      retry_rate: formData.retry_rate || 0.05
    };

    const testModels = formData.model_mix.length > 0 ? 
      formData.model_mix.map(m => m.model_id) : 
      selectedModelsForTest.length > 0 ? selectedModelsForTest :
      ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1-5-flash']; // Smart defaults

    console.log('🚀 Testing scenario:', scenario);
    console.log('🎯 Testing models:', testModels);

    onScenarioTest?.(scenario, testModels);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div>
            <h2 className="text-xl font-bold text-white">AI Cost Scenario Builder</h2>
            <p className="text-gray-400 text-sm mt-1">
              Create comprehensive cost models for AI workload analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-dark-border">
          {[
            { id: 'basic', label: 'Basic Info', icon: '📝' },
            { id: 'traffic', label: 'Traffic Patterns', icon: '📊' },
            { id: 'tokens', label: 'Token Distribution', icon: '🔤' },
            { id: 'models', label: 'Model Mix', icon: '🤖' },
            { id: 'advanced', label: 'Advanced', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                currentTab === tab.id
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex">
          {/* Main Form */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <h4 className="text-red-400 font-medium mb-2">Validation Errors:</h4>
                <ul className="text-red-300 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Info Tab */}
            {currentTab === 'basic' && (
              <div className="space-y-6">
                {/* Quick Templates */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Quick Start Templates</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(SCENARIO_TEMPLATES).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => applyTemplate(key as any)}
                        className="p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-500 transition-colors text-left"
                      >
                        <div className="font-medium text-white text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.requests_per_day.toLocaleString()}/day
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scenario Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., Production Customer Support"
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => updateField('category', e.target.value as any)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="customer-support">Customer Support</option>
                      <option value="content-creation">Content Creation</option>
                      <option value="code-generation">Code Generation</option>
                      <option value="document-analysis">Document Analysis</option>
                      <option value="research">Research</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe the AI workload and use case..."
                      rows={3}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => updateField('priority', e.target.value as any)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="cost">Cost Optimization</option>
                      <option value="quality">Quality First</option>
                      <option value="speed">Speed/Latency</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Continue with other tabs... */}
            {currentTab === 'traffic' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-white mb-3">Traffic Characteristics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Daily Requests <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.requests_per_day}
                      onChange={(e) => updateField('requests_per_day', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Expected requests per day</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Peak Concurrency</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.peak_concurrency}
                      onChange={(e) => updateField('peak_concurrency', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum simultaneous requests</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Request Pattern</label>
                    <select
                      value={formData.request_pattern}
                      onChange={(e) => updateField('request_pattern', e.target.value as any)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="steady">Steady (Even distribution)</option>
                      <option value="bursty">Bursty (Traffic spikes)</option>
                      <option value="business-hours">Business Hours (9-5)</option>
                      <option value="custom">Custom Pattern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Scaling Factor</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={formData.scaling_factor}
                      onChange={(e) => updateField('scaling_factor', parseFloat(e.target.value) || 1.0)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Growth multiplier for projections</p>
                  </div>
                </div>
              </div>
            )}

            {/* Model Mix Tab */}
            {currentTab === 'models' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Model Configuration</h3>
                  <button
                    onClick={() => setShowModelSearch(!showModelSearch)}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
                  >
                    + Add Model
                  </button>
                </div>

                {/* Current Model Mix */}
                <div className="space-y-3">
                  {formData.model_mix.map((mixItem, index) => {
                    const model = models.find(m => m.id === mixItem.model_id);
                    if (!model) return null;

                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.provider}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={mixItem.weight}
                            onChange={(e) => updateModelWeight(index, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-dark-surface border border-dark-border rounded text-white text-sm"
                          />
                          <span className="text-xs text-gray-500">weight</span>
                        </div>
                        <button
                          onClick={() => removeModelFromMix(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  {formData.model_mix.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No models selected. Add models to create your scenario.
                    </div>
                  )}
                </div>

                {/* Model Search Panel */}
                {showModelSearch && (
                  <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Available Models</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {availableModels.map(model => (
                        <button
                          key={model.id}
                          onClick={() => addModelToMix(model.id)}
                          disabled={formData.model_mix.some(m => m.model_id === model.id)}
                          className="flex items-center gap-2 p-2 text-left hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
                          />
                          <div className="flex-1">
                            <div className="text-sm text-white">{model.name}</div>
                            <div className="text-xs text-gray-500">
                              ${((model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2).toFixed(3)}/1k
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cost Preview Panel */}
          <div className="w-80 border-l border-dark-border bg-dark-bg p-4">
            <h3 className="font-semibold text-white mb-4">💰 Cost Preview</h3>
            
            {isCalculatingPreview ? (
              <div className="text-center py-8 text-gray-500">
                Calculating costs...
              </div>
            ) : costPreview.length > 0 ? (
              <div className="space-y-4">
                {costPreview.map((result, index) => (
                  <div key={index} className="bg-dark-surface border border-dark-border rounded-lg p-3">
                    <div className="font-medium text-white text-sm">{result.model.name}</div>
                    <div className="text-xs text-gray-500 mb-2">{result.model.provider}</div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Daily Cost:</span>
                        <span className="text-green-400">${result.costs.total_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly Est.:</span>
                        <span className="text-yellow-400">${result.projections.monthly_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cost/Request:</span>
                        <span className="text-gray-300">${result.per_unit.cost_per_request.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Energy:</span>
                        <span className="text-blue-400">{result.sustainability.energy_consumption_wh.toFixed(1)} Wh</span>
                      </div>
                    </div>
                    
                    <div className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                      result.insights.cost_tier === 'budget' ? 'bg-green-900 text-green-300' :
                      result.insights.cost_tier === 'mid-tier' ? 'bg-yellow-900 text-yellow-300' :
                      result.insights.cost_tier === 'premium' ? 'bg-orange-900 text-orange-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {result.insights.cost_tier}
                    </div>
                  </div>
                ))}
                
                {/* Total Summary */}
                {costPreview.length > 1 && (
                  <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-3">
                    <div className="font-medium text-white text-sm mb-2">Total (Weighted)</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Daily Total:</span>
                        <span className="text-green-400">
                          ${costPreview.reduce((sum, r) => sum + r.costs.total_cost, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly Est.:</span>
                        <span className="text-yellow-400">
                          ${costPreview.reduce((sum, r) => sum + r.projections.monthly_cost, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Configure your scenario to see cost preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-border">
          <div className="text-sm text-gray-400">
            <span className="text-red-400">*</span> Required fields
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            {onScenarioTest && (
              <button
                onClick={handleTest}
                disabled={!formData.name || formData.model_mix.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Test Scenario
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!formData.name || formData.model_mix.length === 0}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Save Scenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};