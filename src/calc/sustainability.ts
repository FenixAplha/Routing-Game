// calc/sustainability.ts
//
// This module contains helper functions for converting energy usage
// (in watt‑hours) into various sustainability metrics. These values
// allow the rest of the application to compute environmental impact
// equivalents such as CO₂ emissions, number of phone charges and
// household energy consumption hours. It also exposes utilities
// for determining a human friendly display unit for energy (Wh vs kWh
// vs MWh) and for formatting the equivalents for UI presentation.

import { Model, SustainAssumptions } from './types';

/**
 * Default sustainability conversion assumptions.
 *
 * These baseline values come from comments in src/calc/types.ts:
 *  - phoneChargeWh: 12 Wh per full smartphone charge
 *  - householdKWhPerDay: 10 kWh/day average household consumption
 *  - gridKgCO2ePerKWh: 0.40 kg CO₂e per kWh of electricity
 *
 * Consumers of this function can override these defaults by supplying
 * their own SustainAssumptions object in configuration.
 */
export function getDefaultSustainAssumptions(): SustainAssumptions {
  return {
    phoneChargeWh: 12,
    householdKWhPerDay: 10,
    gridKgCO2ePerKWh: 0.4,
  };
}

/**
 * Compute the energy consumption of a single request in watt‑hours.
 *
 * Energy consumption is modeled as a sum of two components:
 *  - per‑token energy, proportional to the number of tokens in the request
 *  - per‑request energy, representing fixed overhead for any request
 *
 * Models may specify either or both energyPerTokenWh and energyPerRequestWh
 * fields. Missing values default to 0.
 *
 * @param tokens Total number of tokens for the request
 * @param model The model definition including energy parameters
 * @returns Energy usage in Wh for the request
 */
export function calculateEnergyWh(tokens: number, model: Model): number {
  const perTokenWh = model.energyPerTokenWh ?? 0;
  const perRequestWh = model.energyPerRequestWh ?? 0;
  return tokens * perTokenWh + perRequestWh;
}

/**
 * Structure representing sustainability equivalents derived from an
 * energy consumption value. All fields are returned as raw numbers
 * (not formatted) so they can be further processed or formatted by
 * the UI.
 */
export interface EnergyEquivalents {
  co2eKg: number;
  phoneCharges: number;
  householdHours: number;
}

/**
 * Convert a watt‑hour energy value into several human‑readable
 * equivalents: CO₂e in kilograms, number of smartphone charges,
 * and number of hours of household energy consumption.
 *
 * @param energyWh The energy consumption in watt‑hours
 * @param assumptions Conversion assumptions (see SustainAssumptions)
 * @returns Object containing derived equivalents
 */
export function calculateEquivalents(
  energyWh: number,
  assumptions: SustainAssumptions
): EnergyEquivalents {
  const { phoneChargeWh, householdKWhPerDay, gridKgCO2ePerKWh } = assumptions;

  // Convert energy to kWh for CO₂ calculation
  const energyKWh = energyWh / 1000;
  const co2eKg = energyKWh * gridKgCO2ePerKWh;

  // How many phone charges could this energy supply?
  // Avoid division by zero if phoneChargeWh is 0 or undefined.
  const phoneCharges = phoneChargeWh > 0 ? energyWh / phoneChargeWh : 0;

  // Convert household consumption (kWh/day) into Wh per hour
  const householdWhPerDay = householdKWhPerDay * 1000;
  const householdWhPerHour = householdWhPerDay / 24;
  const householdHours = householdWhPerHour > 0 ? energyWh / householdWhPerHour : 0;

  return {
    co2eKg,
    phoneCharges,
    householdHours,
  };
}

/**
 * Determine an appropriate unit for displaying energy. Given an
 * energy value in watt‑hours, this function will convert it to
 * kilowatt‑hours or megawatt‑hours if the value is large enough.
 *
 * The returned object contains the converted value and the unit
 * suffix. Values are left unchanged (unit = 'Wh') for small inputs.
 *
 * @param energyWh Energy in watt‑hours
 * @param baseUnit Optional base unit hint (currently unused but
 *   reserved for future extension)
 * @returns Object with the converted value and unit string
 */
export function getDisplayUnit(
  energyWh: number,
  baseUnit: 'Wh' | 'kWh' = 'Wh'
): { value: number; unit: string } {
  // Use megawatt‑hours if energy exceeds 1,000,000 Wh
  if (energyWh >= 1_000_000) {
    return { value: energyWh / 1_000_000, unit: 'MWh' };
  }
  // Use kilowatt‑hours if energy exceeds 1,000 Wh
  if (energyWh >= 1_000) {
    return { value: energyWh / 1_000, unit: 'kWh' };
  }
  // Default to watt‑hours
  return { value: energyWh, unit: 'Wh' };
}

/**
 * Format sustainability equivalents for display. Returns a new
 * object with the same keys but values formatted as strings or
 * rounded numbers, suitable for presentation in the UI.
 *
 * The formatting strategy is:
 *  - CO₂e: show up to three decimal places for small numbers and
 *    reduce to one decimal place for larger numbers.
 *  - Phone charges / household hours: for very large values round
 *    to the nearest integer; for mid‑range values show a single
 *    decimal; for small values show two decimals.
 *
 * Consumers of this function should treat the return type as opaque
 * and avoid performing further mathematical operations on the
 * formatted strings.
 *
 * @param eq Raw equivalents from calculateEquivalents
 * @returns Formatted equivalents
 */
export function formatSustainability(eq: EnergyEquivalents): {
  co2eKg: string;
  phoneCharges: string;
  householdHours: string;
} {
  const { co2eKg, phoneCharges, householdHours } = eq;

  // Format CO₂e. Preserve three decimals for values < 100, drop
  // trailing zeros, and use one decimal for larger numbers.
  let co2eFormatted: string;
  if (co2eKg >= 100) {
    co2eFormatted = co2eKg.toFixed(1);
  } else {
    co2eFormatted = co2eKg
      .toFixed(3)
      .replace(/\.0+$/, '')
      .replace(/0+$/, '');
  }

  // Helper to format phone charges and household hours.
  const formatCount = (num: number): string => {
    if (num >= 100) {
      return Math.round(num).toLocaleString();
    }
    if (num >= 10) {
      return num.toFixed(1).replace(/\.0$/, '').toLocaleString();
    }
    return num.toFixed(2).replace(/\.0+$/, '').toLocaleString();
  };

  return {
    co2eKg: co2eFormatted,
    phoneCharges: formatCount(phoneCharges),
    householdHours: formatCount(householdHours),
  };
}
