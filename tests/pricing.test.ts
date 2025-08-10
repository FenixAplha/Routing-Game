import { expect, test } from 'vitest';
import { baseCostUSD, commissionUSD, calculateRequestCost } from '../src/calc/pricing';
import { Model, Router } from '../src/calc/types';

test('calculates base cost correctly', () => {
  const model: Model = {
    id: 'test',
    name: 'Test Model',
    pricePer1kTokensUSD: 1.0,
  };

  expect(baseCostUSD(1000, model)).toBe(1.0);
  expect(baseCostUSD(500, model)).toBe(0.5);
  expect(baseCostUSD(1500, model)).toBe(1.5);
});

test('calculates additive commission correctly', () => {
  const routers: Router[] = [
    { id: '1', layer: 0, name: 'R1', feePct: 0.05, enabled: true },
    { id: '2', layer: 1, name: 'R2', feePct: 0.075, enabled: true },
    { id: '3', layer: 2, name: 'R3', feePct: 0.1, enabled: false }, // disabled
  ];

  const baseCost = 1.0;
  const commission = commissionUSD(baseCost, routers);
  
  // Should sum enabled routers: 5% + 7.5% = 12.5%
  expect(commission).toBeCloseTo(0.125);
});

test('caps commission at 95%', () => {
  const routers: Router[] = [
    { id: '1', layer: 0, name: 'R1', feePct: 0.5, enabled: true },
    { id: '2', layer: 1, name: 'R2', feePct: 0.5, enabled: true },
    { id: '3', layer: 2, name: 'R3', feePct: 0.5, enabled: true },
  ];

  const baseCost = 1.0;
  const commission = commissionUSD(baseCost, routers);
  
  // Should cap at 95% even though sum is 150%
  expect(commission).toBe(0.95);
});

test('calculates complete request cost', () => {
  const model: Model = {
    id: 'test',
    name: 'Test Model',
    pricePer1kTokensUSD: 2.0,
  };

  const routers: Router[] = [
    { id: '1', layer: 0, name: 'R1', feePct: 0.1, enabled: true },
  ];

  const result = calculateRequestCost(1000, model, routers);
  
  expect(result.baseCost).toBe(2.0);
  expect(result.commission).toBe(0.2); // 10% of 2.0
  expect(result.totalCost).toBe(2.2);
  expect(result.commissionRate).toBe(0.1);
});
