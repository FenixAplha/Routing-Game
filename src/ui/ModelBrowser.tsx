// ui/ModelBrowser.tsx
// Stunning AI Model Browser for Business Intelligence Application

import React, { useState, useMemo, useEffect } from 'react';
import { 
  AIModel, 
  Provider, 
  ModelCategory, 
  ModelCapability, 
  ModelSearchFilters,
  modelSearchEngine,
  PROVIDER_COLORS,
  ModelUtils
} from '../models';

interface ModelBrowserProps {
  models: AIModel[];
  onModelSelect?: (model: AIModel) => void;
  onEditModel?: (model: AIModel) => void;
  onCloneModel?: (model: AIModel) => void;
  onCompareModels?: (models: AIModel[]) => void;
  selectedModels?: string[];
  maxSelections?: number;
  showComparison?: boolean;
  showManagement?: boolean;
}

type ViewMode = 'grid' | 'list' | 'comparison';
type SortOption = 'cost' | 'performance' | 'popularity' | 'release_date' | 'sustainability';

export const ModelBrowser: React.FC<ModelBrowserProps> = ({
  models,
  onModelSelect,
  onEditModel,
  onCloneModel,
  onCompareModels,
  selectedModels = [],
  maxSelections = 5,
  showComparison = true,
  showManagement = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ModelSearchFilters>({
    include_deprecated: false,
    sort_by: 'popularity',
    sort_order: 'asc'
  });
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>(selectedModels);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter models
  const searchResults = useMemo(() => {
    const results = modelSearchEngine.search({
      ...filters,
      text_search: searchQuery || undefined
    });
    // Use provided models if available, otherwise use search results
    return {
      ...results,
      models: models.length > 0 ? models.filter(model => 
        results.models.some(r => r.id === model.id)
      ) : results.models
    };
  }, [searchQuery, filters, models]);

  // Update selected models when prop changes
  useEffect(() => {
    setSelectedForComparison(selectedModels);
  }, [selectedModels]);

  const handleModelSelect = (model: AIModel) => {
    onModelSelect?.(model);
  };

  const handleCompareToggle = (modelId: string) => {
    const newSelection = selectedForComparison.includes(modelId)
      ? selectedForComparison.filter(id => id !== modelId)
      : selectedForComparison.length < maxSelections
      ? [...selectedForComparison, modelId]
      : selectedForComparison;
    
    setSelectedForComparison(newSelection);
  };

  const handleCompareModels = () => {
    const models = selectedForComparison.map(id => 
      searchResults.models.find(m => m.id === id)
    ).filter(Boolean) as AIModel[];
    onCompareModels?.(models);
  };

  const updateFilter = <K extends keyof ModelSearchFilters>(
    key: K, 
    value: ModelSearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      include_deprecated: false,
      sort_by: 'popularity',
      sort_order: 'asc'
    });
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Model Browser</h2>
          <p className="text-gray-400 mt-1">
            Discover and compare {searchResults.total_count} AI models from leading providers
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex rounded-lg bg-dark-surface border border-dark-border p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-1">⊞</span> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-1">☰</span> List
          </button>
          {showComparison && (
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              disabled={selectedForComparison.length < 2}
            >
              <span className="mr-1">⚖</span> Compare ({selectedForComparison.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search models by name, provider, capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <span className="mr-1">⚙</span> Filters
          </button>

          {/* Clear All */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Provider Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Providers</label>
              <select
                multiple
                className="w-full h-32 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                value={filters.providers || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value) as Provider[];
                  updateFilter('providers', values.length > 0 ? values : undefined);
                }}
              >
                {['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Cohere'].map(provider => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
              <select
                multiple
                className="w-full h-32 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                value={filters.categories || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value) as ModelCategory[];
                  updateFilter('categories', values.length > 0 ? values : undefined);
                }}
              >
                {['text', 'multimodal', 'image', 'audio', 'code', 'embedding'].map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Capabilities Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Capabilities</label>
              <select
                multiple
                className="w-full h-32 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                value={filters.capabilities || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value) as ModelCapability[];
                  updateFilter('capabilities', values.length > 0 ? values : undefined);
                }}
              >
                {['chat', 'completion', 'function-calling', 'vision', 'code-generation'].map(capability => (
                  <option key={capability} value={capability}>
                    {capability.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting and Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.sort_by || 'popularity'}
                  onChange={(e) => updateFilter('sort_by', e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                >
                  <option value="popularity">Popularity</option>
                  <option value="cost">Cost (Low to High)</option>
                  <option value="performance">Performance</option>
                  <option value="sustainability">Sustainability</option>
                  <option value="release_date">Release Date</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Cost ($/1K tokens)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="No limit"
                  value={filters.max_cost_per_1k_tokens || ''}
                  onChange={(e) => updateFilter('max_cost_per_1k_tokens', 
                    e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-deprecated"
                  checked={filters.include_deprecated || false}
                  onChange={(e) => updateFilter('include_deprecated', e.target.checked)}
                  className="rounded mr-2"
                />
                <label htmlFor="include-deprecated" className="text-sm text-gray-300">
                  Include deprecated
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Found {searchResults.total_count} models
          {filters.providers && filters.providers.length > 0 && (
            <span> from {filters.providers.join(', ')}</span>
          )}
        </div>

        {/* Comparison Panel Toggle */}
        {showComparison && selectedForComparison.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {selectedForComparison.length} selected for comparison
            </span>
            <button
              onClick={handleCompareModels}
              disabled={selectedForComparison.length < 2}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              Compare Selected
            </button>
          </div>
        )}
      </div>

      {/* Model Grid/List */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.models.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedForComparison.includes(model.id)}
              onSelect={() => handleModelSelect(model)}
              onEdit={showManagement && onEditModel ? () => onEditModel(model) : undefined}
              onClone={showManagement && onCloneModel ? () => onCloneModel(model) : undefined}
              onCompareToggle={showComparison ? () => handleCompareToggle(model.id) : undefined}
              showComparison={showComparison}
              showManagement={showManagement}
            />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
          <ModelTable
            models={searchResults.models}
            selectedForComparison={selectedForComparison}
            onSelect={handleModelSelect}
            onCompareToggle={showComparison ? handleCompareToggle : undefined}
            showComparison={showComparison}
          />
        </div>
      )}

      {/* Smart Suggestions */}
      {searchResults.suggestions && (
        <SmartSuggestions
          suggestions={searchResults.suggestions}
          onProviderFilter={(provider) => updateFilter('providers', [provider])}
          onSuggestionClick={(suggestion) => setSearchQuery(suggestion)}
        />
      )}

      {/* Empty State */}
      {searchResults.models.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No models found</div>
          <p className="text-gray-400 text-sm mb-4">
            Try adjusting your search criteria or clearing filters
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Model Card Component
interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onCompareToggle?: () => void;
  showComparison?: boolean;
  showManagement?: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  onSelect,
  onEdit,
  onClone,
  onCompareToggle,
  showComparison = false,
  showManagement = false
}) => {
  const avgCost = (model.pricing.input_price_per_1k_tokens + model.pricing.output_price_per_1k_tokens) / 2;
  const costTier = avgCost < 1 ? 'budget' : avgCost < 5 ? 'mid-tier' : 'premium';
  
  return (
    <div 
      className={`bg-dark-surface border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg ${
        isSelected ? 'border-primary-500 bg-primary-900/20' : 'border-dark-border hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
            />
            <span className="text-xs text-gray-400">{model.provider}</span>
          </div>
          <h3 className="font-semibold text-white truncate">{model.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{model.category}</p>
        </div>
        
        {showComparison && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle?.();
            }}
            className={`w-6 h-6 rounded border-2 transition-colors ${
              isSelected 
                ? 'bg-primary-600 border-primary-600 text-white' 
                : 'border-gray-600 hover:border-primary-500'
            }`}
          >
            {isSelected && <span className="text-xs">✓</span>}
          </button>
        )}
      </div>

      {/* Pricing */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">
            ${model.pricing.input_price_per_1k_tokens.toFixed(3)}
          </span>
          <span className="text-xs text-gray-400">→</span>
          <span className="text-sm font-medium text-white">
            ${model.pricing.output_price_per_1k_tokens.toFixed(3)}
          </span>
        </div>
        <div className="text-xs text-gray-500">per 1K tokens</div>
        <div className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
          costTier === 'budget' ? 'bg-green-900 text-green-300' :
          costTier === 'mid-tier' ? 'bg-yellow-900 text-yellow-300' :
          'bg-red-900 text-red-300'
        }`}>
          {costTier}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Context Window</span>
          <span className="text-gray-300">
            {model.specs.context_window.toLocaleString()}
          </span>
        </div>
        {model.performance.quality_score && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Quality Score</span>
            <span className="text-gray-300">
              {model.performance.quality_score}/10
            </span>
          </div>
        )}
        {model.performance.latency_p50_ms && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Latency</span>
            <span className="text-gray-300">
              {model.performance.latency_p50_ms}ms
            </span>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1 mb-3">
        {model.capabilities.slice(0, 3).map(capability => (
          <span 
            key={capability}
            className="text-xs px-2 py-1 bg-dark-bg rounded text-gray-300"
          >
            {capability.replace('-', ' ')}
          </span>
        ))}
        {model.capabilities.length > 3 && (
          <span className="text-xs text-gray-500">
            +{model.capabilities.length - 3} more
          </span>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs">
        {model.metadata.is_deprecated && (
          <span className="text-red-400">Deprecated</span>
        )}
        {model.metadata.is_beta && (
          <span className="text-yellow-400">Beta</span>
        )}
        {model.metadata.popularity_rank && model.metadata.popularity_rank <= 10 && (
          <span className="text-green-400">Popular</span>
        )}
        
        <span className="text-gray-500">
          #{model.metadata.popularity_rank || '—'}
        </span>
      </div>
    </div>
  );
};

// Model Table Component
interface ModelTableProps {
  models: AIModel[];
  selectedForComparison: string[];
  onSelect: (model: AIModel) => void;
  onCompareToggle?: (modelId: string) => void;
  showComparison?: boolean;
}

const ModelTable: React.FC<ModelTableProps> = ({
  models,
  selectedForComparison,
  onSelect,
  onCompareToggle,
  showComparison = false
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-border">
            {showComparison && <th className="w-12 p-4"></th>}
            <th className="text-left p-4 text-sm font-medium text-gray-300">Model</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Provider</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Input Price</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Output Price</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Context</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Quality</th>
            <th className="text-left p-4 text-sm font-medium text-gray-300">Rank</th>
          </tr>
        </thead>
        <tbody>
          {models.map(model => (
            <tr 
              key={model.id}
              onClick={() => onSelect(model)}
              className={`border-b border-dark-border/30 hover:bg-dark-bg cursor-pointer transition-colors ${
                selectedForComparison.includes(model.id) ? 'bg-primary-900/20' : ''
              }`}
            >
              {showComparison && (
                <td className="p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompareToggle?.(model.id);
                    }}
                    className={`w-5 h-5 rounded border-2 transition-colors ${
                      selectedForComparison.includes(model.id)
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-gray-600 hover:border-primary-500'
                    }`}
                  >
                    {selectedForComparison.includes(model.id) && (
                      <span className="text-xs">✓</span>
                    )}
                  </button>
                </td>
              )}
              <td className="p-4">
                <div className="font-medium text-white">{model.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {model.capabilities.slice(0, 2).join(', ')}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
                  />
                  <span className="text-sm text-gray-300">{model.provider}</span>
                </div>
              </td>
              <td className="p-4 text-sm text-gray-300 capitalize">{model.category}</td>
              <td className="p-4 text-sm text-gray-300">
                ${model.pricing.input_price_per_1k_tokens.toFixed(3)}
              </td>
              <td className="p-4 text-sm text-gray-300">
                ${model.pricing.output_price_per_1k_tokens.toFixed(3)}
              </td>
              <td className="p-4 text-sm text-gray-300">
                {model.specs.context_window.toLocaleString()}
              </td>
              <td className="p-4 text-sm text-gray-300">
                {model.performance.quality_score || '—'}/10
              </td>
              <td className="p-4 text-sm text-gray-300">
                #{model.metadata.popularity_rank || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Smart Suggestions Component
interface SmartSuggestionsProps {
  suggestions: {
    alternative_providers: string[];
    similar_models: string[];
    cost_optimization_opportunities: string[];
  };
  onProviderFilter: (provider: Provider) => void;
  onSuggestionClick: (suggestion: string) => void;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onProviderFilter,
  onSuggestionClick
}) => {
  if (!suggestions.alternative_providers.length && 
      !suggestions.similar_models.length && 
      !suggestions.cost_optimization_opportunities.length) {
    return null;
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
      <h3 className="font-semibold text-white mb-4">💡 Smart Suggestions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.alternative_providers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Alternative Providers</h4>
            <div className="space-y-1">
              {suggestions.alternative_providers.map(provider => (
                <button
                  key={provider}
                  onClick={() => onProviderFilter(provider as Provider)}
                  className="block w-full text-left px-2 py-1 text-sm text-blue-400 hover:bg-dark-bg rounded transition-colors"
                >
                  Try {provider}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {suggestions.similar_models.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Similar Models</h4>
            <div className="space-y-1">
              {suggestions.similar_models.map(model => (
                <button
                  key={model}
                  onClick={() => onSuggestionClick(model)}
                  className="block w-full text-left px-2 py-1 text-sm text-green-400 hover:bg-dark-bg rounded transition-colors"
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {suggestions.cost_optimization_opportunities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Cost Optimization</h4>
            <div className="space-y-1">
              {suggestions.cost_optimization_opportunities.map(opportunity => (
                <div
                  key={opportunity}
                  className="px-2 py-1 text-sm text-yellow-400 bg-yellow-900/20 rounded"
                >
                  {opportunity}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};