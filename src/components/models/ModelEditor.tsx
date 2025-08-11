// components/models/ModelEditor.tsx
// Professional Model Editor for Adding/Editing AI Models

import React, { useState, useEffect } from 'react';
import { AIModel, Provider, ModelCategory, ModelCapability } from '../../models/types';
import { modelManager, CustomModel } from '../../models/model-manager';

interface ModelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: CustomModel) => void;
  editingModel?: AIModel | null;
  mode: 'create' | 'edit' | 'clone';
}

export const ModelEditor: React.FC<ModelEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  editingModel,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'Custom' as Provider,
    category: 'text' as ModelCategory,
    input_price_per_1k_tokens: 0,
    output_price_per_1k_tokens: 0,
    context_window: 4000,
    capabilities: ['chat'] as ModelCapability[]
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingModel && (mode === 'edit' || mode === 'clone')) {
      setFormData({
        name: mode === 'clone' ? `${editingModel.name} (Copy)` : editingModel.name,
        provider: editingModel.provider,
        category: editingModel.category,
        input_price_per_1k_tokens: editingModel.pricing.input_price_per_1k_tokens,
        output_price_per_1k_tokens: editingModel.pricing.output_price_per_1k_tokens,
        context_window: editingModel.specs.context_window,
        capabilities: editingModel.capabilities
      });
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        provider: 'Custom',
        category: 'text',
        input_price_per_1k_tokens: 0,
        output_price_per_1k_tokens: 0,
        context_window: 4000,
        capabilities: ['chat']
      });
    }
    setErrors([]);
  }, [editingModel, mode, isOpen]);

  const handleSave = () => {
    const validationResult = modelManager.addCustomModel({
      name: formData.name,
      provider: formData.provider,
      category: formData.category,
      pricing: {
        input_price_per_1k_tokens: formData.input_price_per_1k_tokens,
        output_price_per_1k_tokens: formData.output_price_per_1k_tokens
      },
      specs: {
        context_window: formData.context_window,
        max_output_tokens: Math.floor(formData.context_window * 0.25),
        supports_streaming: true,
        supports_function_calling: true
      },
      capabilities: formData.capabilities,
      performance: {
        quality_score: 7,
        latency_p50_ms: 1000,
        throughput_tokens_per_second: 50
      },
      sustainability: {
        energy_per_1k_tokens_wh: 0.5,
        carbon_intensity_g_co2_per_kwh: 400,
        compute_efficiency_score: 7
      },
      metadata: {
        release_date: new Date().toISOString().split('T')[0],
        is_deprecated: false,
        is_beta: false,
        popularity_rank: 999
      }
    });

    if (validationResult.success && validationResult.model) {
      onSave(validationResult.model);
      onClose();
    } else {
      setErrors(validationResult.errors || ['Failed to save model']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? 'Add Custom Model' : 
             mode === 'edit' ? 'Edit Model' : 
             'Clone Model'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h4 className="font-medium text-red-300 mb-2">Validation Errors:</h4>
            <ul className="text-sm text-red-200 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter model name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as Provider }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="Custom">Custom</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Anthropic">Anthropic</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Mistral">Mistral</option>
                <option value="Cohere">Cohere</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ModelCategory }))}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="text">Text</option>
              <option value="multimodal">Multimodal</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="code">Code</option>
              <option value="embedding">Embedding</option>
            </select>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Input Price ($/1K tokens) *
              </label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={formData.input_price_per_1k_tokens}
                onChange={(e) => setFormData(prev => ({ ...prev, input_price_per_1k_tokens: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Output Price ($/1K tokens) *
              </label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={formData.output_price_per_1k_tokens}
                onChange={(e) => setFormData(prev => ({ ...prev, output_price_per_1k_tokens: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Context Window */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Context Window (tokens) *
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={formData.context_window}
              onChange={(e) => setFormData(prev => ({ ...prev, context_window: parseInt(e.target.value) || 4000 }))}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capabilities *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['chat', 'completion', 'vision', 'function-calling', 'code-generation'] as ModelCapability[]).map(capability => (
                <label key={capability} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(capability)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          capabilities: [...prev.capabilities, capability]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          capabilities: prev.capabilities.filter(c => c !== capability)
                        }));
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {capability.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {mode === 'create' ? 'Add Model' : mode === 'edit' ? 'Save Changes' : 'Clone Model'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};