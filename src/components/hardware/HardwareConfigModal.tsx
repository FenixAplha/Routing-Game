// components/hardware/HardwareConfigModal.tsx
// Advanced Hardware Configuration for Custom AI Deployments

import React, { useState, useMemo } from 'react';

interface GPUSpec {
  id: string;
  name: string;
  vendor: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Google' | 'Custom';
  architecture: string;
  memory_gb: number;
  memory_bandwidth_gbps: number;
  tensor_performance_tops: number;
  tdp_watts: number;
  launch_price_usd: number;
  current_price_usd: number;
  availability: 'available' | 'limited' | 'discontinued';
  use_cases: string[];
  efficiency_score: number; // TOPS/Watt
}

interface CloudProvider {
  name: string;
  regions: string[];
  gpu_instances: {
    [key: string]: {
      gpu_spec: string;
      gpu_count: number;
      hourly_cost_usd: number;
      memory_gb: number;
      vcpus: number;
      network_performance: string;
    };
  };
}

const GPU_DATABASE: GPUSpec[] = [
  {
    id: 'h100-sxm5-80gb',
    name: 'H100 SXM5 80GB',
    vendor: 'NVIDIA',
    architecture: 'Hopper',
    memory_gb: 80,
    memory_bandwidth_gbps: 3350,
    tensor_performance_tops: 1979,
    tdp_watts: 700,
    launch_price_usd: 30000,
    current_price_usd: 25000,
    availability: 'available',
    use_cases: ['Large Language Models', 'Training', 'High-throughput Inference'],
    efficiency_score: 2.83
  },
  {
    id: 'a100-sxm4-80gb',
    name: 'A100 SXM4 80GB',
    vendor: 'NVIDIA',
    architecture: 'Ampere',
    memory_gb: 80,
    memory_bandwidth_gbps: 2039,
    tensor_performance_tops: 624,
    tdp_watts: 400,
    launch_price_usd: 15000,
    current_price_usd: 10000,
    availability: 'available',
    use_cases: ['ML Training', 'Inference', 'Scientific Computing'],
    efficiency_score: 1.56
  },
  {
    id: 'rtx-4090',
    name: 'GeForce RTX 4090',
    vendor: 'NVIDIA',
    architecture: 'Ada Lovelace',
    memory_gb: 24,
    memory_bandwidth_gbps: 1008,
    tensor_performance_tops: 165,
    tdp_watts: 450,
    launch_price_usd: 1599,
    current_price_usd: 1200,
    availability: 'available',
    use_cases: ['Consumer AI', 'Small Models', 'Development'],
    efficiency_score: 0.37
  },
  {
    id: 'tpu-v4',
    name: 'TPU v4',
    vendor: 'Google',
    architecture: 'TPU v4',
    memory_gb: 32,
    memory_bandwidth_gbps: 1200,
    tensor_performance_tops: 275,
    tdp_watts: 200,
    launch_price_usd: 8000,
    current_price_usd: 6000,
    availability: 'limited',
    use_cases: ['Google Cloud', 'TensorFlow Optimization'],
    efficiency_score: 1.38
  }
];

const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    name: 'AWS',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    gpu_instances: {
      'p4d.24xlarge': {
        gpu_spec: 'a100-sxm4-80gb',
        gpu_count: 8,
        hourly_cost_usd: 32.77,
        memory_gb: 1152,
        vcpus: 96,
        network_performance: '400 Gbps'
      },
      'p5.48xlarge': {
        gpu_spec: 'h100-sxm5-80gb',
        gpu_count: 8,
        hourly_cost_usd: 98.32,
        memory_gb: 2048,
        vcpus: 192,
        network_performance: '3200 Gbps'
      }
    }
  },
  {
    name: 'GCP',
    regions: ['us-central1', 'us-west1', 'europe-west4'],
    gpu_instances: {
      'a2-highgpu-8g': {
        gpu_spec: 'a100-sxm4-80gb',
        gpu_count: 8,
        hourly_cost_usd: 28.50,
        memory_gb: 680,
        vcpus: 96,
        network_performance: '200 Gbps'
      }
    }
  }
];

interface HardwareConfig {
  deployment_type: 'cloud' | 'on_premise' | 'hybrid';
  cloud_config?: {
    provider: string;
    region: string;
    instance_type: string;
    instance_count: number;
    reserved_instances: boolean;
    spot_instances: boolean;
  };
  on_premise_config?: {
    gpu_spec: string;
    gpu_count: number;
    power_cost_per_kwh: number;
    cooling_pue: number;
    utilization_rate: number;
  };
}

interface HardwareConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: HardwareConfig) => void;
  initialConfig?: HardwareConfig;
}

export const HardwareConfigModal: React.FC<HardwareConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<HardwareConfig>(initialConfig || {
    deployment_type: 'cloud',
    cloud_config: {
      provider: 'AWS',
      region: 'us-east-1',
      instance_type: 'p4d.24xlarge',
      instance_count: 1,
      reserved_instances: false,
      spot_instances: false
    }
  });

  // Calculate estimated costs and performance
  const costAnalysis = useMemo(() => {
    if (config.deployment_type === 'cloud' && config.cloud_config) {
      const provider = CLOUD_PROVIDERS.find(p => p.name === config.cloud_config!.provider);
      const instance = provider?.gpu_instances[config.cloud_config.instance_type];
      
      if (instance) {
        const hourlyCost = instance.hourly_cost_usd * config.cloud_config.instance_count;
        const spotDiscount = config.cloud_config.spot_instances ? 0.7 : 1; // 30% discount for spot
        const reservedDiscount = config.cloud_config.reserved_instances ? 0.65 : 1; // 35% discount for reserved
        
        const effectiveHourlyCost = hourlyCost * spotDiscount * reservedDiscount;
        
        return {
          hourly_cost: effectiveHourlyCost,
          daily_cost: effectiveHourlyCost * 24,
          monthly_cost: effectiveHourlyCost * 24 * 30,
          annual_cost: effectiveHourlyCost * 24 * 365,
          total_gpus: instance.gpu_count * config.cloud_config.instance_count,
          total_memory_gb: instance.memory_gb * config.cloud_config.instance_count,
          gpu_spec: GPU_DATABASE.find(g => g.id === instance.gpu_spec)
        };
      }
    } else if (config.deployment_type === 'on_premise' && config.on_premise_config) {
      const gpuSpec = GPU_DATABASE.find(g => g.id === config.on_premise_config!.gpu_spec);
      if (gpuSpec) {
        const powerConsumption = gpuSpec.tdp_watts * config.on_premise_config.gpu_count * config.on_premise_config.utilization_rate;
        const coolingPower = powerConsumption * (config.on_premise_config.cooling_pue - 1);
        const totalPowerKw = (powerConsumption + coolingPower) / 1000;
        
        const hourlyCost = totalPowerKw * config.on_premise_config.power_cost_per_kwh;
        const hardwareCost = gpuSpec.current_price_usd * config.on_premise_config.gpu_count;
        
        return {
          hourly_cost: hourlyCost,
          daily_cost: hourlyCost * 24,
          monthly_cost: hourlyCost * 24 * 30,
          annual_cost: hourlyCost * 24 * 365,
          hardware_investment: hardwareCost,
          total_gpus: config.on_premise_config.gpu_count,
          power_consumption_kw: totalPowerKw,
          gpu_spec: gpuSpec
        };
      }
    }
    
    return null;
  }, [config]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div>
            <h2 className="text-xl font-bold text-white">Hardware Configuration</h2>
            <p className="text-gray-400 text-sm mt-1">
              Configure custom compute infrastructure for AI workloads
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Deployment Type Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Deployment Type</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'cloud', name: 'Cloud', icon: '☁️', desc: 'AWS, GCP, Azure instances' },
              { id: 'on_premise', name: 'On-Premise', icon: '🏢', desc: 'Your own hardware' },
              { id: 'hybrid', name: 'Hybrid', icon: '🔄', desc: 'Mix of cloud and on-premise' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setConfig(prev => ({ ...prev, deployment_type: type.id as any }))}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  config.deployment_type === type.id
                    ? 'border-primary-500 bg-primary-900/20'
                    : 'border-dark-border hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-medium text-white">{type.name}</div>
                <div className="text-xs text-gray-400">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cloud Configuration */}
        {config.deployment_type === 'cloud' && (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cloud Configuration</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cloud Provider
                </label>
                <select
                  value={config.cloud_config?.provider || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, provider: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                >
                  {CLOUD_PROVIDERS.map(provider => (
                    <option key={provider.name} value={provider.name}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <select
                  value={config.cloud_config?.region || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, region: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                >
                  {CLOUD_PROVIDERS
                    .find(p => p.name === config.cloud_config?.provider)
                    ?.regions.map(region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instance Type
                </label>
                <select
                  value={config.cloud_config?.instance_type || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, instance_type: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                >
                  {Object.entries(
                    CLOUD_PROVIDERS
                      .find(p => p.name === config.cloud_config?.provider)
                      ?.gpu_instances || {}
                  ).map(([type, spec]) => (
                    <option key={type} value={type}>
                      {type} - {spec.gpu_count}x GPU - ${spec.hourly_cost_usd}/hr
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instance Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.cloud_config?.instance_count || 1}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, instance_count: parseInt(e.target.value) || 1 }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                />
              </div>
            </div>

            {/* Pricing Options */}
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.cloud_config?.spot_instances || false}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, spot_instances: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-white">Use Spot Instances (up to 70% savings, may be interrupted)</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.cloud_config?.reserved_instances || false}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cloud_config: { ...prev.cloud_config!, reserved_instances: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-white">Reserved Instances (up to 35% savings, 1-year commitment)</span>
              </label>
            </div>
          </div>
        )}

        {/* On-Premise Configuration */}
        {config.deployment_type === 'on_premise' && (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-white mb-4">On-Premise Configuration</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GPU Model
                </label>
                <select
                  value={config.on_premise_config?.gpu_spec || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    on_premise_config: { ...prev.on_premise_config!, gpu_spec: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                >
                  {GPU_DATABASE.map(gpu => (
                    <option key={gpu.id} value={gpu.id}>
                      {gpu.name} - {gpu.memory_gb}GB - ${gpu.current_price_usd.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GPU Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.on_premise_config?.gpu_count || 1}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    on_premise_config: { ...prev.on_premise_config!, gpu_count: parseInt(e.target.value) || 1 }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Power Cost ($/kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.on_premise_config?.power_cost_per_kwh || 0.12}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    on_premise_config: { ...prev.on_premise_config!, power_cost_per_kwh: parseFloat(e.target.value) || 0.12 }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cooling PUE
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={config.on_premise_config?.cooling_pue || 1.4}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    on_premise_config: { ...prev.on_premise_config!, cooling_pue: parseFloat(e.target.value) || 1.4 }
                  }))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cost Analysis */}
        {costAnalysis && (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cost Analysis</h3>
            <div className="bg-dark-bg rounded-lg p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">${costAnalysis.hourly_cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Hourly Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">${costAnalysis.monthly_cost.toFixed(0)}</div>
                  <div className="text-sm text-gray-400">Monthly Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{costAnalysis.total_gpus}</div>
                  <div className="text-sm text-gray-400">Total GPUs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{costAnalysis.gpu_spec?.efficiency_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">TOPS/Watt</div>
                </div>
              </div>

              {config.deployment_type === 'on_premise' && 'hardware_investment' in costAnalysis && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-400">
                        ${costAnalysis.hardware_investment?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">Hardware Investment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-400">
                        {costAnalysis.power_consumption_kw?.toFixed(1)} kW
                      </div>
                      <div className="text-sm text-gray-400">Power Consumption</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-border">
          <div className="text-sm text-gray-400">
            Configuration will be applied to cost calculations
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

