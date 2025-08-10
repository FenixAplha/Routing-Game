// engine/rng.ts

/**
 * Mulberry32 - Simple, fast, high-quality seeded RNG
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create seeded random utilities
 */
export function createSeededRandom(seed: number) {
  const rng = mulberry32(seed);
  
  return {
    random: rng,
    randomRange: (min: number, max: number) => min + rng() * (max - min),
    randomInt: (min: number, max: number) => Math.floor(min + rng() * (max - min + 1)),
    choice: <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)],
    weighted: <T>(items: T[], weights: number[]): T => {
      const total = weights.reduce((sum, w) => sum + w, 0);
      let rand = rng() * total;
      for (let i = 0; i < items.length; i++) {
        rand -= weights[i];
        if (rand <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    poisson: (lambda: number): number => {
      // Knuth's algorithm for Poisson sampling
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= rng();
      } while (p > L);
      return k - 1;
    },
    normal: (mean: number, stdDev: number): number => {
      // Box-Muller transform
      const u1 = rng();
      const u2 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + z0 * stdDev;
    },
  };
}

export type SeededRandom = ReturnType<typeof createSeededRandom>;
