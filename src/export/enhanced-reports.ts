// export/enhanced-reports.ts
// Enhanced Export System with Beautiful PDF Reports for BI Application

import { 
  AIModel, 
  TokenScenario, 
  Provider,
  PROVIDER_COLORS,
  ModelUtils
} from '../models';
import { EnhancedCostResult } from '../calc/enhanced-pricing';

/**
 * Export Configuration Options
 */
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  include_charts: boolean;
  include_raw_data: boolean;
  template: 'executive' | 'technical' | 'detailed' | 'summary';
  branding?: {
    company_name?: string;
    company_logo?: string;
    primary_color?: string;
  };
  filters?: {
    providers?: Provider[];
    cost_tier?: string[];
    time_period?: string;
  };
}

/**
 * Comprehensive Export Data Structure
 */
export interface ExportData {
  metadata: {
    export_timestamp: string;
    scenario_name: string;
    analysis_period: string;
    total_models_analyzed: number;
    data_source: 'AI Cost Calculator';
    version: string;
  };
  scenario: TokenScenario;
  results: EnhancedCostResult[];
  analytics: {
    cost_summary: {
      total_cost: number;
      cost_per_request: number;
      cost_per_token: number;
      cost_breakdown_by_provider: Array<{
        provider: Provider;
        cost: number;
        percentage: number;
        requests: number;
      }>;
    };
    performance_analysis: {
      fastest_model: string;
      most_efficient_model: string;
      quality_leader: string;
      best_value_model: string;
    };
    sustainability_report: {
      total_energy_wh: number;
      total_co2e_kg: number;
      most_sustainable_provider: Provider;
      efficiency_score: number;
    };
    optimization_recommendations: Array<{
      type: string;
      description: string;
      potential_savings: number;
      implementation_effort: string;
    }>;
  };
}

/**
 * Enhanced Export Engine for Beautiful Reports
 */
export class EnhancedExportEngine {
  /**
   * Generate comprehensive export data
   */
  static generateExportData(
    scenario: TokenScenario,
    results: EnhancedCostResult[]
  ): ExportData {
    const totalCost = results.reduce((sum, r) => sum + r.costs.total_cost, 0);
    const totalRequests = results.reduce((sum, r) => sum + r.request.requests_count, 0);
    const totalTokens = results.reduce((sum, r) => 
      sum + r.request.input_tokens + r.request.output_tokens, 0);
    const totalEnergy = results.reduce((sum, r) => sum + r.sustainability.energy_consumption_wh, 0);
    const totalCO2e = results.reduce((sum, r) => sum + r.sustainability.co2e_kg, 0);

    // Provider breakdown
    const providerBreakdown = new Map<Provider, { cost: number; requests: number }>();
    results.forEach(result => {
      const provider = result.model.provider;
      const existing = providerBreakdown.get(provider) || { cost: 0, requests: 0 };
      existing.cost += result.costs.total_cost;
      existing.requests += result.request.requests_count;
      providerBreakdown.set(provider, existing);
    });

    // Performance analysis
    const sortedByCost = [...results].sort((a, b) => a.costs.total_cost - b.costs.total_cost);
    const sortedByLatency = [...results].sort((a, b) => 
      (a.model.performance.latency_p50_ms || 999) - (b.model.performance.latency_p50_ms || 999));
    const sortedByEfficiency = [...results].sort((a, b) => 
      b.performance.efficiency_score - a.performance.efficiency_score);
    const sortedByQuality = [...results].sort((a, b) => 
      (b.model.performance.quality_score || 0) - (a.model.performance.quality_score || 0));

    return {
      metadata: {
        export_timestamp: new Date().toISOString(),
        scenario_name: scenario.name,
        analysis_period: 'Single Analysis',
        total_models_analyzed: results.length,
        data_source: 'AI Cost Calculator',
        version: '2.0.0'
      },
      scenario,
      results,
      analytics: {
        cost_summary: {
          total_cost: totalCost,
          cost_per_request: totalCost / totalRequests,
          cost_per_token: totalCost / totalTokens * 1000,
          cost_breakdown_by_provider: Array.from(providerBreakdown.entries()).map(([provider, data]) => ({
            provider,
            cost: data.cost,
            percentage: (data.cost / totalCost) * 100,
            requests: data.requests
          }))
        },
        performance_analysis: {
          fastest_model: sortedByLatency[0]?.model.name || 'N/A',
          most_efficient_model: sortedByEfficiency[0]?.model.name || 'N/A',
          quality_leader: sortedByQuality[0]?.model.name || 'N/A',
          best_value_model: sortedByCost[0]?.model.name || 'N/A'
        },
        sustainability_report: {
          total_energy_wh: totalEnergy,
          total_co2e_kg: totalCO2e,
          most_sustainable_provider: this.getMostSustainableProvider(results),
          efficiency_score: totalTokens / Math.max(totalEnergy, 0.001)
        },
        optimization_recommendations: this.generateOptimizationRecommendations(results, scenario)
      }
    };
  }

  /**
   * Export as Beautiful HTML Report (for PDF conversion)
   */
  static async exportHTML(
    exportData: ExportData,
    options: ExportOptions
  ): Promise<string> {
    const { scenario, analytics, metadata } = exportData;
    
    // Generate CSS styles
    const styles = this.generateReportStyles(options.branding);
    
    // Generate report sections
    const executiveSummary = this.generateExecutiveSummary(analytics);
    const costAnalysis = this.generateCostAnalysisSection(analytics, exportData.results);
    const performanceSection = this.generatePerformanceSection(analytics, exportData.results);
    const sustainabilitySection = this.generateSustainabilitySection(analytics);
    const recommendationsSection = this.generateRecommendationsSection(analytics.optimization_recommendations);
    const technicalAppendix = options.include_raw_data ? 
      this.generateTechnicalAppendix(exportData.results) : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Cost Analysis Report - ${scenario.name}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <header class="report-header">
            <div class="header-content">
                <div class="company-branding">
                    ${options.branding?.company_name ? 
                      `<h1 class="company-name">${options.branding.company_name}</h1>` : 
                      '<h1 class="company-name">AI Cost Analysis Report</h1>'
                    }
                    <div class="report-subtitle">Comprehensive AI Model Cost Intelligence</div>
                </div>
                <div class="report-meta">
                    <div class="meta-item">
                        <strong>Scenario:</strong> ${scenario.name}
                    </div>
                    <div class="meta-item">
                        <strong>Generated:</strong> ${new Date(metadata.export_timestamp).toLocaleString()}
                    </div>
                    <div class="meta-item">
                        <strong>Models Analyzed:</strong> ${metadata.total_models_analyzed}
                    </div>
                </div>
            </div>
        </header>

        <!-- Executive Summary -->
        <section class="report-section">
            <h2 class="section-title">Executive Summary</h2>
            ${executiveSummary}
        </section>

        <!-- Cost Analysis -->
        <section class="report-section">
            <h2 class="section-title">Cost Analysis</h2>
            ${costAnalysis}
        </section>

        <!-- Performance Analysis -->
        <section class="report-section">
            <h2 class="section-title">Performance Analysis</h2>
            ${performanceSection}
        </section>

        <!-- Sustainability Impact -->
        <section class="report-section">
            <h2 class="section-title">Sustainability Impact</h2>
            ${sustainabilitySection}
        </section>

        <!-- Recommendations -->
        <section class="report-section">
            <h2 class="section-title">Optimization Recommendations</h2>
            ${recommendationsSection}
        </section>

        ${technicalAppendix}

        <!-- Footer -->
        <footer class="report-footer">
            <div class="footer-content">
                <p>Generated by AI Cost Calculator v${metadata.version} • ${metadata.data_source}</p>
                <p class="footer-disclaimer">
                    This report is based on current model pricing and performance data. 
                    Actual costs may vary based on usage patterns and provider changes.
                </p>
            </div>
        </footer>
    </div>
</body>
</html>`;

    return htmlContent;
  }

  /**
   * Export as Enhanced CSV
   */
  static exportCSV(exportData: ExportData): string {
    const headers = [
      'Model Name',
      'Provider',
      'Category',
      'Total Cost (USD)',
      'Cost per Request (USD)',
      'Cost per 1K Tokens (USD)',
      'Requests',
      'Input Tokens',
      'Output Tokens',
      'Energy Consumption (Wh)',
      'CO2e Emissions (kg)',
      'Quality Score',
      'Efficiency Score',
      'Cost Tier',
      'Latency (ms)',
      'Context Window',
      'Capabilities'
    ];

    const rows = exportData.results.map(result => [
      result.model.name,
      result.model.provider,
      result.model.category,
      result.costs.total_cost.toFixed(4),
      result.per_unit.cost_per_request.toFixed(6),
      result.per_unit.cost_per_total_token.toFixed(4),
      result.request.requests_count,
      result.request.input_tokens,
      result.request.output_tokens,
      result.sustainability.energy_consumption_wh.toFixed(2),
      result.sustainability.co2e_kg.toFixed(6),
      result.model.performance.quality_score || 'N/A',
      result.performance.efficiency_score.toFixed(2),
      result.insights.cost_tier,
      result.model.performance.latency_p50_ms || 'N/A',
      result.model.specs.context_window,
      result.model.capabilities.join('; ')
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export as JSON
   */
  static exportJSON(exportData: ExportData, options: ExportOptions): string {
    const exportObject = {
      ...exportData,
      export_options: options,
      charts_data: options.include_charts ? this.generateChartsData(exportData) : undefined
    };

    return JSON.stringify(exportObject, null, 2);
  }

  /**
   * Generate report CSS styles
   */
  private static generateReportStyles(branding?: ExportOptions['branding']): string {
    const primaryColor = branding?.primary_color || '#6366f1';
    
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: #ffffff;
      }
      
      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      
      .report-header {
        background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);
        color: white;
        padding: 40px;
        border-radius: 12px;
        margin-bottom: 40px;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .company-name {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .report-subtitle {
        font-size: 1.2rem;
        opacity: 0.9;
      }
      
      .report-meta {
        text-align: right;
      }
      
      .meta-item {
        margin-bottom: 8px;
        font-size: 0.95rem;
      }
      
      .report-section {
        margin-bottom: 50px;
      }
      
      .section-title {
        font-size: 2rem;
        font-weight: 600;
        color: ${primaryColor};
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 3px solid ${primaryColor}20;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .metric-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 24px;
        text-align: center;
      }
      
      .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 8px;
      }
      
      .metric-label {
        font-size: 0.95rem;
        color: #64748b;
        font-weight: 500;
      }
      
      .provider-breakdown {
        background: #f8fafc;
        border-radius: 8px;
        padding: 24px;
        margin: 20px 0;
      }
      
      .provider-item {
        display: flex;
        align-items: center;
        justify-content: between;
        padding: 12px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .provider-item:last-child {
        border-bottom: none;
      }
      
      .provider-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 12px;
      }
      
      .recommendation-card {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
      }
      
      .recommendation-title {
        font-weight: 600;
        color: #16a34a;
        margin-bottom: 8px;
      }
      
      .recommendation-savings {
        font-size: 1.2rem;
        font-weight: 700;
        color: #15803d;
        margin-top: 8px;
      }
      
      .table-container {
        overflow-x: auto;
        margin: 20px 0;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      
      .data-table th,
      .data-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .data-table th {
        background: #f1f5f9;
        font-weight: 600;
        color: #475569;
      }
      
      .report-footer {
        margin-top: 60px;
        padding-top: 30px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        color: #64748b;
        font-size: 0.9rem;
      }
      
      .footer-disclaimer {
        margin-top: 12px;
        font-style: italic;
      }
      
      @media print {
        body { font-size: 12px; }
        .report-container { padding: 20px; }
        .section-title { break-after: avoid; }
        .metric-card { break-inside: avoid; }
      }
    `;
  }

  /**
   * Generate executive summary section
   */
  private static generateExecutiveSummary(analytics: ExportData['analytics']): string {
    const { cost_summary, performance_analysis, sustainability_report } = analytics;
    
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">$${cost_summary.total_cost.toFixed(2)}</div>
          <div class="metric-label">Total Analysis Cost</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">$${cost_summary.cost_per_request.toFixed(4)}</div>
          <div class="metric-label">Average Cost per Request</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${sustainability_report.total_energy_wh.toFixed(1)} Wh</div>
          <div class="metric-label">Total Energy Consumption</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${performance_analysis.best_value_model}</div>
          <div class="metric-label">Best Value Model</div>
        </div>
      </div>
      
      <div class="provider-breakdown">
        <h3 style="margin-bottom: 20px;">Cost Distribution by Provider</h3>
        ${cost_summary.cost_breakdown_by_provider.map(provider => `
          <div class="provider-item">
            <div style="display: flex; align-items: center; flex: 1;">
              <div class="provider-color" style="background-color: ${PROVIDER_COLORS[provider.provider]};"></div>
              <span style="font-weight: 500;">${provider.provider}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600;">$${provider.cost.toFixed(2)}</div>
              <div style="font-size: 0.85rem; color: #64748b;">${provider.percentage.toFixed(1)}%</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate cost analysis section
   */
  private static generateCostAnalysisSection(analytics: ExportData['analytics'], results: EnhancedCostResult[]): string {
    const sortedResults = [...results].sort((a, b) => b.costs.total_cost - a.costs.total_cost);
    
    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Provider</th>
              <th>Total Cost</th>
              <th>Cost/Request</th>
              <th>Cost Tier</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            ${sortedResults.slice(0, 10).map(result => `
              <tr>
                <td><strong>${result.model.name}</strong></td>
                <td>${result.model.provider}</td>
                <td>$${result.costs.total_cost.toFixed(2)}</td>
                <td>$${result.per_unit.cost_per_request.toFixed(4)}</td>
                <td><span style="text-transform: capitalize;">${result.insights.cost_tier}</span></td>
                <td>${result.performance.efficiency_score.toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate performance section
   */
  private static generatePerformanceSection(analytics: ExportData['analytics'], results: EnhancedCostResult[]): string {
    const { performance_analysis } = analytics;
    
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${performance_analysis.fastest_model}</div>
          <div class="metric-label">Fastest Model</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${performance_analysis.quality_leader}</div>
          <div class="metric-label">Highest Quality</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${performance_analysis.most_efficient_model}</div>
          <div class="metric-label">Most Efficient</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${performance_analysis.best_value_model}</div>
          <div class="metric-label">Best Value</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate sustainability section
   */
  private static generateSustainabilitySection(analytics: ExportData['analytics']): string {
    const { sustainability_report } = analytics;
    
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${sustainability_report.total_energy_wh.toFixed(1)} Wh</div>
          <div class="metric-label">Total Energy Consumed</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${(sustainability_report.total_co2e_kg * 1000).toFixed(1)}g</div>
          <div class="metric-label">CO₂e Emissions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${sustainability_report.most_sustainable_provider}</div>
          <div class="metric-label">Most Sustainable Provider</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${sustainability_report.efficiency_score.toFixed(0)}</div>
          <div class="metric-label">Efficiency Score</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate recommendations section
   */
  private static generateRecommendationsSection(recommendations: ExportData['analytics']['optimization_recommendations']): string {
    return recommendations.map(rec => `
      <div class="recommendation-card">
        <div class="recommendation-title">${rec.description}</div>
        <div>Implementation Effort: <strong>${rec.implementation_effort}</strong></div>
        <div class="recommendation-savings">Potential Savings: $${rec.potential_savings.toFixed(2)}</div>
      </div>
    `).join('');
  }

  /**
   * Generate technical appendix
   */
  private static generateTechnicalAppendix(results: EnhancedCostResult[]): string {
    return `
      <section class="report-section">
        <h2 class="section-title">Technical Appendix</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Input Price ($/1K)</th>
                <th>Output Price ($/1K)</th>
                <th>Context Window</th>
                <th>Quality Score</th>
                <th>Energy (Wh/1K tokens)</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(result => `
                <tr>
                  <td><strong>${result.model.name}</strong></td>
                  <td>$${result.model.pricing.input_price_per_1k_tokens.toFixed(4)}</td>
                  <td>$${result.model.pricing.output_price_per_1k_tokens.toFixed(4)}</td>
                  <td>${result.model.specs.context_window.toLocaleString()}</td>
                  <td>${result.model.performance.quality_score || 'N/A'}</td>
                  <td>${(result.model.sustainability.energy_per_1k_tokens_wh || 0).toFixed(3)}</td>
                  <td>${result.model.capabilities.slice(0, 3).join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /**
   * Helper methods
   */
  private static getMostSustainableProvider(results: EnhancedCostResult[]): Provider {
    const providerEfficiency = new Map<Provider, number>();
    
    results.forEach(result => {
      const provider = result.model.provider;
      const efficiency = result.model.sustainability.compute_efficiency_score || 5;
      const existing = providerEfficiency.get(provider) || 0;
      providerEfficiency.set(provider, Math.max(existing, efficiency));
    });
    
    let bestProvider: Provider = 'OpenAI';
    let bestScore = 0;
    
    providerEfficiency.forEach((score, provider) => {
      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    });
    
    return bestProvider;
  }

  private static generateOptimizationRecommendations(
    results: EnhancedCostResult[], 
    scenario: TokenScenario
  ): ExportData['analytics']['optimization_recommendations'] {
    const recommendations = [];
    
    // Model switching recommendation
    const mostExpensive = results.sort((a, b) => b.costs.total_cost - a.costs.total_cost)[0];
    if (mostExpensive) {
      recommendations.push({
        type: 'model-optimization',
        description: `Consider switching from ${mostExpensive.model.name} to a more cost-effective alternative`,
        potential_savings: mostExpensive.costs.total_cost * 0.3,
        implementation_effort: 'Low'
      });
    }
    
    // Caching recommendation
    if ((scenario.cache_hit_rate || 0) < 0.3) {
      recommendations.push({
        type: 'caching',
        description: 'Implement response caching to reduce redundant API calls',
        potential_savings: results.reduce((sum, r) => sum + r.costs.total_cost, 0) * 0.2,
        implementation_effort: 'Medium'
      });
    }
    
    return recommendations;
  }

  private static generateChartsData(exportData: ExportData): any {
    // Generate data structures for charts (would be used by frontend charting libraries)
    return {
      cost_by_provider: exportData.analytics.cost_summary.cost_breakdown_by_provider,
      performance_comparison: exportData.results.map(r => ({
        model: r.model.name,
        cost: r.costs.total_cost,
        quality: r.model.performance.quality_score || 5,
        efficiency: r.performance.efficiency_score
      }))
    };
  }
}

/**
 * Utility functions for enhanced exports
 */
export const ExportUtils = {
  /**
   * Download file with given content
   */
  downloadFile: (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Generate filename with timestamp
   */
  generateFilename: (baseName: string, extension: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseName}-${timestamp}.${extension}`;
  }
};