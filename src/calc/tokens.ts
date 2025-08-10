// calc/tokens.ts
import { Profile } from './types';
import { SeededRandom } from '../engine/rng';

/**
 * Sample tokens for a request based on profile
 */
export function sampleTokens(
  profile: Profile,
  rng: SeededRandom
): {
  prompt: number;
  completion: number;
  total: number;
} {
  let prompt: number;
  let completion: number;

  switch (profile.distribution) {
    case 'fixed':
      prompt = profile.promptTokenMean;
      completion = profile.completionTokenMean;
      break;
      
    case 'poisson':
      prompt = Math.max(1, rng.poisson(profile.promptTokenMean));
      completion = Math.max(1, rng.poisson(profile.completionTokenMean));
      break;
      
    case 'bounded-normal':
      const promptStd = profile.distributionParams?.promptStd || profile.promptTokenMean * 0.3;
      const completionStd = profile.distributionParams?.completionStd || profile.completionTokenMean * 0.3;
      
      prompt = Math.max(1, Math.round(rng.normal(profile.promptTokenMean, promptStd)));
      completion = Math.max(1, Math.round(rng.normal(profile.completionTokenMean, completionStd)));
      break;
      
    case 'custom':
      // For now, fall back to bounded normal
      // In the future, this could load from CSV or use custom parameters
      prompt = Math.max(1, Math.round(rng.normal(profile.promptTokenMean, profile.promptTokenMean * 0.5)));
      completion = Math.max(1, Math.round(rng.normal(profile.completionTokenMean, profile.completionTokenMean * 0.5)));
      break;
      
    default:
      prompt = profile.promptTokenMean;
      completion = profile.completionTokenMean;
  }

  // Apply ratio if specified
  if (profile.promptCompletionRatio) {
    const total = prompt + completion;
    prompt = Math.round(total / (1 + profile.promptCompletionRatio));
    completion = total - prompt;
  }

  return {
    prompt: Math.max(1, prompt),
    completion: Math.max(1, completion),
    total: prompt + completion,
  };
}

/**
 * Calculate request rate for a group
 */
export function getGroupRate(groupSize: number, profileRps: number): number {
  return Math.min(10, groupSize) * profileRps;
}

/**
 * Sample number of requests for a time interval using distribution
 */
export function sampleRequests(
  rate: number,
  deltaTime: number,
  distribution: Profile['distribution'],
  rng: SeededRandom
): number {
  const expected = rate * deltaTime;
  
  switch (distribution) {
    case 'fixed':
      return Math.floor(expected);
      
    case 'poisson':
      return rng.poisson(expected);
      
    case 'bounded-normal':
      const std = Math.sqrt(expected); // Variance equals mean for Poisson-like
      return Math.max(0, Math.round(rng.normal(expected, std)));
      
    case 'custom':
      // For now, use Poisson
      return rng.poisson(expected);
      
    default:
      return Math.floor(expected);
  }
}
