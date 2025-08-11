// components/Navigation.tsx
// Global Navigation Component for AI Cost Calculator BI Application

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = "" }) => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/ai-cost-calculator',
      label: 'AI Cost Calculator',
      icon: '🤖',
      description: 'Business Intelligence Dashboard'
    },
    {
      path: '/capture',
      label: 'Routing Capture',
      icon: '📊',
      description: 'Network Visualization'
    },
    {
      path: '/admin',
      label: 'Admin Panel',
      icon: '⚙️',
      description: 'Configuration & Analysis'
    }
  ];

  return (
    <nav className={`bg-dark-surface border-b border-dark-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Enterprise AI Analytics
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-dark-bg'
                  }`}
                  title={item.description}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block mr-2"></span>
              System Active
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};