// routes/AICostCalculator.tsx
// Main AI Cost Calculator Business Intelligence Application

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AI_MODEL_DATABASE } from '../models/database';
import { ModelBrowser } from '../ui/ModelBrowser';
import { ScenarioBuilder } from '../ui/ScenarioBuilder';
import { ResultsDashboard } from '../ui/ResultsDashboard';
import { StunningVisualizer } from '../engine/stunning-visualizer';
import { EnhancedVizEngine, TimeSimulationSettings } from '../engine/enhanced-viz';
import { TrafficSimulationControls } from '../components/visualizations/TrafficSimulationControls';
import { EnhancedCostCalculator } from '../calc/enhanced-pricing';
import { EnhancedExportEngine, ExportUtils } from '../export/enhanced-reports';
import { TokenScenario } from '../models';
import { EnhancedCostResult } from '../calc/enhanced-pricing';
import { HardwareConfigModal } from '../components/hardware/HardwareConfigModal';
import { ModelEditor } from '../components/models/ModelEditor';
import { modelManager, CustomModel } from '../models/model-manager';
import { AIModel } from '../models';

interface AnalysisSession {
  id: string;
  name: string;
  scenario: TokenScenario;
  selectedModels: string[];
  results: EnhancedCostResult[];
  timestamp: string;
}

export const AICostCalculator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vizEngineRef = useRef<StunningVisualizer | null>(null);
  const enhancedVizRef = useRef<EnhancedVizEngine | null>(null);
  
  // Traffic simulation state
  const [timeSettings, setTimeSettings] = useState<TimeSimulationSettings>({
    simSpeedMultiplier: 1440, // 1 min = 1 day
    timeRange: 'day',
    realTimeDuration: 60, // 1 minute
    paused: false,
    looping: false,
    currentProgress: 0
  });
  const [isTrafficSimulating, setIsTrafficSimulating] = useState(false);
  const [showTrafficControls, setShowTrafficControls] = useState(false);
  
  // Application state
  const [currentView, setCurrentView] = useState<'browse' | 'analyze' | 'results'>('browse');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [currentScenario, setCurrentScenario] = useState<TokenScenario | null>(null);
  const [analysisResults, setAnalysisResults] = useState<EnhancedCostResult[]>([]);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [showHardwareConfig, setShowHardwareConfig] = useState(false);
  const [hardwareConfig, setHardwareConfig] = useState<any>(null);
  const [showModelEditor, setShowModelEditor] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [modelEditorMode, setModelEditorMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  // Demo mode for continuous visualization
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available models on mount
  useEffect(() => {
    const models = modelManager.getAllModels();
    setAvailableModels(models);
  }, []);

  // Initialize stunning visualization engine
  useEffect(() => {
    if (canvasRef.current && !vizEngineRef.current && availableModels.length > 0) {
      try {
        const engine = new StunningVisualizer(canvasRef.current);
        engine.setupModelNodes(availableModels);
        engine.start();
        vizEngineRef.current = engine;
        
        // Also initialize enhanced viz engine for traffic simulation
        const enhancedEngine = new EnhancedVizEngine(canvasRef.current);
        enhancedEngine.setupModelNodes(availableModels);
        enhancedVizRef.current = enhancedEngine;
        
        console.log('🎨 Visualizers initialized with', availableModels.length, 'models');

        // Cleanup on unmount
        return () => {
          engine.stop();
          enhancedEngine.stop();
        };
      } catch (error) {
        console.error('Failed to initialize visualizers:', error);
      }
    }
  }, [availableModels]);

  // Demo mode effect
  useEffect(() => {
    if (isDemoMode && vizEngineRef.current) {
      demoIntervalRef.current = setInterval(() => {
        // Add random cost signals for demo visualization
        const models = AI_MODEL_DATABASE;
        const fromModel = models[Math.floor(Math.random() * models.length)];
        const toModel = models[Math.floor(Math.random() * models.length)];
        
        if (fromModel.id !== toModel.id) {
          // Create mock cost result for demo
          const mockResult: EnhancedCostResult = {
            model: toModel,
            request: {
              model_id: toModel.id,
              input_tokens: Math.floor(Math.random() * 500 + 100),
              output_tokens: Math.floor(Math.random() * 300 + 50),
              requests_count: 1,
              images_count: 0,
              audio_minutes: 0
            },
            costs: {
              input_tokens_cost: Math.random() * 0.01,
              output_tokens_cost: Math.random() * 0.02,
              images_cost: 0,
              audio_cost: 0,
              video_cost: 0,
              base_subtotal: Math.random() * 0.025,
              batch_discount: 0,
              cache_savings: 0,
              retry_penalty: 0,
              router_commission: 0,
              total_cost: Math.random() * 0.03
            },
            per_unit: {
              cost_per_request: Math.random() * 0.03,
              cost_per_input_token: Math.random() * 0.000001,
              cost_per_output_token: Math.random() * 0.000002,
              cost_per_total_token: Math.random() * 0.000001
            },
            performance: {
              estimated_latency_ms: Math.random() * 1000 + 200,
              estimated_throughput_rps: Math.random() * 100 + 10,
              quality_adjusted_cost: Math.random() * 0.04,
              efficiency_score: Math.random() * 10 + 5
            },
            insights: {
              cost_tier: ['budget', 'mid-tier', 'premium', 'enterprise'][Math.floor(Math.random() * 4)] as any,
              optimization_opportunities: [],
              risk_factors: [],
              comparative_ranking: Math.floor(Math.random() * 50) + 1
            },
            sustainability: {
              energy_consumption_wh: Math.random() * 5,
              co2e_kg: Math.random() * 0.001,
              phone_charges_equivalent: Math.random() * 2,
              household_hours_equivalent: Math.random() * 0.1,
              sustainability_score: Math.random() * 10
            },
            projections: {
              hourly_cost: Math.random() * 1.25,
              daily_cost: Math.random() * 30,
              weekly_cost: Math.random() * 200,
              monthly_cost: Math.random() * 800,
              annual_cost: Math.random() * 10000
            }
          };

          vizEngineRef.current?.addCostSignal(fromModel.id, toModel.id, mockResult);
        }
      }, 800 + Math.random() * 1200); // Random interval between 800-2000ms

      return () => {
        if (demoIntervalRef.current) {
          clearInterval(demoIntervalRef.current);
        }
      };
    }
  }, [isDemoMode]);
  
  // Traffic simulation handlers
  const handleStartTrafficSimulation = useCallback(() => {
    if (enhancedVizRef.current) {
      const timeRangeHours = {
        'hour': 1,
        'day': 24, 
        'week': 168,
        'month': 720,
        'quarter': 2160,
        'year': 8760
      }[timeSettings.timeRange];
      
      const durationSeconds = timeRangeHours * 3600;
      
      enhancedVizRef.current.startSimulation(durationSeconds, timeSettings.simSpeedMultiplier);
      setIsTrafficSimulating(true);
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (enhancedVizRef.current) {
          const progress = enhancedVizRef.current.getCurrentProgress();
          setTimeSettings(prev => ({ ...prev, currentProgress: progress }));
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            setIsTrafficSimulating(false);
            if (timeSettings.looping) {
              setTimeout(() => handleStartTrafficSimulation(), 1000);
            }
          }
        }
      }, 100);
    }
  }, [timeSettings, enhancedVizRef]);
  
  const handlePauseTrafficSimulation = useCallback(() => {
    if (enhancedVizRef.current) {
      enhancedVizRef.current.pauseSimulation();
      setIsTrafficSimulating(false);
    }
  }, [enhancedVizRef]);
  
  const handleStopTrafficSimulation = useCallback(() => {
    if (enhancedVizRef.current) {
      enhancedVizRef.current.stopSimulation();
      setIsTrafficSimulating(false);
      setTimeSettings(prev => ({ ...prev, currentProgress: 0 }));
    }
  }, [enhancedVizRef]);
  
  const handleResetTrafficSimulation = useCallback(() => {
    if (enhancedVizRef.current) {
      enhancedVizRef.current.resetSimulation();
      setIsTrafficSimulating(false);
      setTimeSettings(prev => ({ ...prev, currentProgress: 0 }));
    }
  }, [enhancedVizRef]);

  // Handle model selection
  const handleModelSelect = (model: any) => {
    const modelId = typeof model === 'string' ? model : model.id;
    console.log('🎯 Model selected:', modelId);
    setSelectedModels(prev => {
      const newSelection = prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId];
      console.log('📝 Updated selection:', newSelection);
      return newSelection;
    });
  };

  // Handle model management
  const handleAddModel = () => {
    setEditingModel(null);
    setModelEditorMode('create');
    setShowModelEditor(true);
  };

  const handleEditModel = (model: AIModel) => {
    setEditingModel(model);
    setModelEditorMode('edit');
    setShowModelEditor(true);
  };

  const handleCloneModel = (model: AIModel) => {
    setEditingModel(model);
    setModelEditorMode('clone');
    setShowModelEditor(true);
  };

  const handleModelSave = (model: CustomModel) => {
    console.log('💾 Model saved:', model);
    const updatedModels = modelManager.getAllModels();
    setAvailableModels(updatedModels);
    
    // Update visualization engine
    if (vizEngineRef.current) {
      vizEngineRef.current.setupModelNodes(updatedModels);
    }
  };

  // Handle scenario creation and analysis
  const handleScenarioSave = async (scenario: TokenScenario) => {
    console.log('💾 Scenario saved:', scenario);
    console.log('🎯 Selected models for analysis:', selectedModels);
    setCurrentScenario(scenario);
    setShowScenarioBuilder(false);
    
    if (selectedModels.length > 0) {
      await runAnalysis(scenario, selectedModels);
    } else {
      console.warn('⚠️ No models selected for analysis');
    }
  };

  const handleScenarioTest = async (scenario: TokenScenario, modelIds: string[]) => {
    console.log('🧪 Scenario test triggered:', scenario);
    console.log('🎯 Test models:', modelIds);
    setCurrentScenario(scenario);
    setSelectedModels(modelIds);
    setShowScenarioBuilder(false);
    await runAnalysis(scenario, modelIds);
  };

  // Quick test with default scenario
  const handleQuickTest = async () => {
    console.log('⚡ Quick test triggered');
    const quickScenario: TokenScenario = {
      name: 'Quick Cost Analysis',
      description: `Comparing ${selectedModels.length} selected models for typical business workload`,
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
      requests_per_day: 1000,
      peak_concurrency: 10,
      cache_hit_rate: 0.2,
      retry_rate: 0.05
    };
    
    await runAnalysis(quickScenario, selectedModels);
  };

  // Quick start demo with popular models
  const handleQuickStart = async () => {
    console.log('🚀 Quick start demo triggered');
    const demoModels = ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1-5-flash'];
    setSelectedModels(demoModels);
    
    const demoScenario: TokenScenario = {
      name: 'Demo: Popular AI Models Comparison',
      description: 'Cost comparison of the most popular AI models for typical business use cases',
      input_tokens: {
        mean: 200,
        variance: 75,
        min: 50,
        max: 800,
        distribution_type: 'normal'
      },
      output_tokens: {
        mean: 150,
        variance: 50,
        min: 30,
        max: 500,
        distribution_type: 'normal'
      },
      requests_per_day: 2000,
      peak_concurrency: 15,
      cache_hit_rate: 0.25,
      retry_rate: 0.03
    };
    
    await runAnalysis(demoScenario, demoModels);
  };

  // Run cost analysis
  const runAnalysis = async (scenario: TokenScenario, modelIds: string[]) => {
    console.log('🔍 Starting analysis:', { scenario: scenario.name, modelIds });
    setIsAnalyzing(true);
    setCurrentView('results');

    try {
      const calculator = new EnhancedCostCalculator(availableModels);
      const results: EnhancedCostResult[] = [];

      console.log('🤖 Processing models:', modelIds.length);

      for (const modelId of modelIds) {
        const model = availableModels.find(m => m.id === modelId);
        console.log(`🔍 Processing model: ${modelId}`, model ? '✅ Found' : '❌ Not found');
        
        if (model) {
          const request = {
            model_id: modelId,
            input_tokens: scenario.input_tokens.mean,
            output_tokens: scenario.output_tokens.mean,
            requests_count: scenario.requests_per_day,
            images_count: 0,
            audio_minutes: 0,
            cache_hit_rate: scenario.cache_hit_rate || 0.2,
            retry_rate: scenario.retry_rate || 0.05
          };

          console.log(`📊 Calculating costs for ${model.name}:`, request);

          try {
            const result = calculator.calculate(request);
            console.log(`✅ Cost calculated for ${model.name}:`, result.costs.total_cost);
            results.push(result);

            // Add to visualization (use first model as 'from' for demo)
            if (vizEngineRef.current && results.length > 1) {
              const fromModelId = results[0].model.id;
              vizEngineRef.current.addCostSignal(fromModelId, modelId, result);
            }
          } catch (error) {
            console.error(`❌ Analysis failed for model ${modelId}:`, error);
          }
        } else {
          console.error(`❌ Model not found: ${modelId}`);
        }
      }

      console.log('📈 Analysis complete. Results:', results.length);
      setAnalysisResults(results);

      // Save session
      const session: AnalysisSession = {
        id: `session_${Date.now()}`,
        name: scenario.name,
        scenario,
        selectedModels: modelIds,
        results,
        timestamp: new Date().toISOString()
      };
      setSessions(prev => [session, ...prev]);

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!currentScenario || analysisResults.length === 0) return;

    try {
      const exportData = EnhancedExportEngine.generateExportData(currentScenario, analysisResults);
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (format) {
        case 'pdf':
          const htmlContent = await EnhancedExportEngine.exportHTML(exportData, {
            format: 'pdf',
            template: 'executive',
            include_charts: true,
            include_raw_data: true,
            branding: {
              company_name: 'AI Cost Intelligence',
              primary_color: '#6366f1'
            }
          });
          ExportUtils.downloadFile(htmlContent, 
            ExportUtils.generateFilename(`${currentScenario.name}-report`, 'html'), 
            'text/html'
          );
          break;
          
        case 'csv':
          const csvContent = EnhancedExportEngine.exportCSV(exportData);
          ExportUtils.downloadFile(csvContent, 
            ExportUtils.generateFilename(`${currentScenario.name}-data`, 'csv'), 
            'text/csv'
          );
          break;
          
        case 'json':
          const jsonContent = EnhancedExportEngine.exportJSON(exportData, {
            format: 'json',
            template: 'detailed',
            include_charts: true,
            include_raw_data: true
          });
          ExportUtils.downloadFile(jsonContent, 
            ExportUtils.generateFilename(`${currentScenario.name}-analysis`, 'json'), 
            'application/json'
          );
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Cost Calculator
              </h1>
              <p className="text-gray-400 mt-1">
                World-Class Business Intelligence for AI Model Cost Analysis
              </p>
            </div>
            
            {/* Demo Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Demo Mode:</span>
                <button
                  onClick={() => setIsDemoMode(!isDemoMode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isDemoMode 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {isDemoMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-1 mt-4 p-1 bg-dark-surface rounded-lg w-fit">
            {[
              { id: 'browse', label: 'Browse Models', icon: '🤖' },
              { id: 'analyze', label: 'Cost Analysis', icon: '📊' },
              { id: 'results', label: 'BI Dashboard', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
          {/* Left Panel - Navigation and Controls */}
          <div className="xl:col-span-1">
            {currentView === 'browse' && (
              <div className="space-y-6">
                <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Selected Models ({selectedModels.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedModels.map(modelId => {
                      const model = AI_MODEL_DATABASE.find(m => m.id === modelId);
                      return model ? (
                        <div key={modelId} className="flex items-center justify-between text-sm">
                          <span>{model.name}</span>
                          <button
                            onClick={() => handleModelSelect(modelId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowScenarioBuilder(true)}
                    disabled={selectedModels.length === 0}
                    className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Create Custom Scenario ({selectedModels.length} models)
                  </button>
                  
                  <button
                    onClick={() => setShowHardwareConfig(true)}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    🔧 Hardware Configuration
                  </button>
                  
                  <button
                    onClick={handleAddModel}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    ➕ Add Custom Model
                  </button>
                  
                  {selectedModels.length > 0 && (
                    <button
                      onClick={handleQuickTest}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      🚀 Quick Test Selected Models
                    </button>
                  )}
                  
                  {selectedModels.length === 0 && (
                    <button
                      onClick={handleQuickStart}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      ⚡ Quick Start Demo
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentView === 'results' && currentScenario && (
              <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Current Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Scenario:</strong> {currentScenario.name}</div>
                  <div><strong>Models:</strong> {selectedModels.length}</div>
                  <div><strong>Daily Requests:</strong> {currentScenario.requests_per_day.toLocaleString()}</div>
                  <div><strong>Results:</strong> {analysisResults.length} cost analyses</div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    📄 Export Report (PDF)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    📊 Export Data (CSV)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center Panel - Main Content */}
          <div className="xl:col-span-2">
            {currentView === 'browse' && (
              <ModelBrowser
                models={availableModels}
                onModelSelect={handleModelSelect}
                onEditModel={handleEditModel}
                onCloneModel={handleCloneModel}
                selectedModels={selectedModels}
                maxSelections={10}
                showComparison={true}
                showManagement={true}
              />
            )}

            {currentView === 'analyze' && (
              <div className="space-y-6">
                {/* Traffic Simulation Controls */}
                <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">⏱️ Traffic Simulation</h3>
                    <button
                      onClick={() => setShowTrafficControls(!showTrafficControls)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showTrafficControls ? 'Hide Controls' : 'Show Controls'}
                    </button>
                  </div>
                  
                  {showTrafficControls && (
                    <TrafficSimulationControls
                      settings={timeSettings}
                      onSettingsChange={setTimeSettings}
                      isRunning={isTrafficSimulating}
                      onStart={handleStartTrafficSimulation}
                      onPause={handlePauseTrafficSimulation}
                      onStop={handleStopTrafficSimulation}
                      onReset={handleResetTrafficSimulation}
                    />
                  )}
                </div>
                
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">🎨 Enhanced AI Model Network</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowTrafficControls(!showTrafficControls)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          showTrafficControls 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        ⏱️ Traffic Controls
                      </button>
                      
                      {/* Visualization Controls */}
                    <select
                      onChange={(e) => {
                        const quality = e.target.value === 'high';
                        vizEngineRef.current?.updateSettings({ highQuality: quality });
                      }}
                      className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-white"
                    >
                      <option value="standard">Standard Quality</option>
                      <option value="high">High Quality</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        const metrics = vizEngineRef.current?.getPerformanceMetrics();
                        if (metrics) {
                          console.log('Performance Metrics:', metrics);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      title="Show performance metrics"
                    >
                      📊 Metrics
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <canvas 
                    ref={canvasRef}
                    className="w-full border border-dark-border rounded-lg bg-gradient-to-br from-slate-900 to-slate-800"
                    style={{ height: '600px' }}
                  />
                  {isDemoMode && (
                    <div className="absolute top-4 right-4 bg-green-900/80 text-green-200 px-3 py-1 rounded-full text-sm animate-pulse">
                      🔴 Live Demo Mode
                    </div>
                  )}
                  
                  {isTrafficSimulating && (
                    <div className="absolute top-4 left-4 bg-blue-900/80 text-blue-200 px-3 py-1 rounded-full text-sm animate-pulse">
                      ⏱️ Traffic Simulation: {timeSettings.timeRange.toUpperCase()} ({Math.round(timeSettings.currentProgress)}%)
                    </div>
                  )}
                  
                  {/* Visualization Legend */}
                  <div className="absolute bottom-4 left-4 bg-dark-surface/90 border border-dark-border rounded-lg p-3 text-xs">
                    <div className="font-medium text-white mb-2">Legend</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-gray-300">Budget ($)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="text-gray-300">Mid-tier ($$)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="text-gray-300">Premium ($$$)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span className="text-gray-300">Enterprise ($$$$)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <p className="text-gray-400 text-sm">
                    {isTrafficSimulating
                      ? `⏱️ Simulating ${timeSettings.timeRange} of traffic patterns with realistic load distribution`
                      : isDemoMode 
                        ? '🎭 Demo mode: Simulated cost flows across AI model network'
                        : '🔬 Interactive visualization: Drag nodes, click to explore cost flows'
                    }
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    GPU-accelerated • 60fps • {availableModels.length} models • Traffic Simulation Ready
                  </div>
                </div>
              </div>
              </div>
            )}

            {currentView === 'results' && (
              <div>
                {isAnalyzing ? (
                  <div className="bg-dark-surface border border-dark-border rounded-lg p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-lg font-medium mb-2">Running Cost Analysis</div>
                    <div className="text-gray-400">Analyzing {selectedModels.length} models...</div>
                  </div>
                ) : currentScenario && analysisResults.length > 0 ? (
                  <ResultsDashboard
                    scenario={currentScenario}
                    models={availableModels.filter(m => selectedModels.includes(m.id))}
                    results={analysisResults}
                    hardwareConfig={hardwareConfig}
                    onExport={handleExport}
                  />
                ) : (
                  <div className="bg-dark-surface border border-dark-border rounded-lg p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-lg font-medium mb-2">No Analysis Results</div>
                    <div className="text-gray-400 mb-4">Select models and create a scenario to see BI analytics</div>
                    <button
                      onClick={() => setCurrentView('browse')}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analysis History */}
        {sessions.length > 0 && (
          <div className="p-6 border-t border-dark-border">
            <h3 className="font-semibold mb-4">Recent Analysis Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map(session => (
                <div key={session.id} className="bg-dark-surface border border-dark-border rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">{session.name}</div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>{session.selectedModels.length} models analyzed</div>
                    <div>{new Date(session.timestamp).toLocaleDateString()}</div>
                    <div className="text-green-400">
                      Total: ${session.results.reduce((sum, r) => sum + r.costs.total_cost, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scenario Builder Modal */}
      <ScenarioBuilder
        models={availableModels}
        onScenarioSave={handleScenarioSave}
        onScenarioTest={handleScenarioTest}
        isOpen={showScenarioBuilder}
        onClose={() => setShowScenarioBuilder(false)}
      />

      {/* Hardware Configuration Modal */}
      <HardwareConfigModal
        isOpen={showHardwareConfig}
        onClose={() => setShowHardwareConfig(false)}
        onSave={(config) => {
          console.log('🔧 Hardware configuration saved:', config);
          setHardwareConfig(config);
          setShowHardwareConfig(false);
        }}
        initialConfig={hardwareConfig}
      />

      {/* Model Editor Modal */}
      <ModelEditor
        isOpen={showModelEditor}
        onClose={() => setShowModelEditor(false)}
        onSave={handleModelSave}
        editingModel={editingModel}
        mode={modelEditorMode}
      />
    </div>
  );
};