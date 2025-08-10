// calc/pricing.ts
import { Model, Router } from './types';

/**
 * Calculate base cost from tokens and model pricing
 */
export function baseCostUSD(tokens: number, model: Model): number {
  const billableTokens = Math.max(tokens, model.minBillableTokens || 0);
  return billableTokens * (model.pricePer1kTokensUSD / 1000);
}

/**
 * Calculate additive commission from enabled routers
 * Uses additive approach: sum all router fees, cap at 95%
 */
export function commissionUSD(baseCost: number, routers: Router[]): number {
  const totalFeePct = routers
    .filter(r => r.enabled)
    .reduce((sum, r) => sum + r.feePct, 0);
  
  // Cap total commission at 95%
  const cappedRate = Math.min(0.95, Math.max(0, totalFeePct));
  
  return baseCost * cappedRate;
}

/**
 * Get commission rate from router path
 */
export function getCommissionRate(routerPath: Router[]): number {
  const totalFeePct = routerPath
    .filter(r => r.enabled)
    .reduce((sum, r) => sum + r.feePct, 0);
  
  return Math.min(0.95, Math.max(0, totalFeePct));
}

/**
 * Calculate total cost for a request
 */
export function calculateRequestCost(
  tokens: number,
  model: Model,
  routerPath: Router[]
): {
  baseCost: number;
  commission: number;
  totalCost: number;
  commissionRate: number;
} {
  const baseCost = baseCostUSD(tokens, model);
  const commission = commissionUSD(baseCost, routerPath);
  const commissionRate = getCommissionRate(routerPath);
  
  return {
    baseCost,
    commission,
    totalCost: baseCost + commission,
    commissionRate,
  };
}

/**
 * Format currency to 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format percentage to 1 decimal place
 */
export function formatPercent(rate: number): string {
  return (rate * 100).toFixed(1) + '%';
}
