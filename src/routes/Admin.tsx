// routes/Admin.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RunSetup } from './admin/RunSetup';
import { PricingTokens } from './admin/PricingTokens';
import { Sustainability } from './admin/Sustainability';
import { Commission } from './admin/Commission';
import { Presets } from './admin/Presets';
import { Records } from './admin/Records';
import { Advanced } from './admin/Advanced';

type TabId = 'setup' | 'pricing' | 'sustainability' | 'commission' | 'presets' | 'records' | 'advanced';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'setup', label: 'Run Setup', icon: '⚙️' },
  { id: 'pricing', label: 'Pricing & Tokens', icon: '💰' },
  { id: 'sustainability', label: 'Sustainability', icon: '🌱' },
  { id: 'commission', label: 'Commission', icon: '📊' },
  { id: 'presets', label: 'Presets', icon: '📋' },
  { id: 'records', label: 'Records', icon: '📁' },
  { id: 'advanced', label: 'Advanced', icon: '🔧' },
];

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('setup');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return <RunSetup />;
      case 'pricing':
        return <PricingTokens />;
      case 'sustainability':
        return <Sustainability />;
      case 'commission':
        return <Commission />;
      case 'presets':
        return <Presets />;
      case 'records':
        return <Records />;
      case 'advanced':
        return <Advanced />;
      default:
        return <RunSetup />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="border-b border-dark-border bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Routing Viz Admin</h1>
              <p className="text-gray-400 text-sm">
                Configuration, analytics, and data management
              </p>
            </div>
            
            <Link
              to="/capture"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Capture
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-dark-border bg-dark-surface h-screen sticky top-0">
          <nav className="p-4">
            <ul className="space-y-1">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
