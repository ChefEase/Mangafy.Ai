// src/utils/seed.ts
export function getOrUpdateSeed(currentScript: string): number {
    const storedScript = localStorage.getItem("lastScript");
    const storedSeed = localStorage.getItem("lastSeed");
  
    let seed: number;
  
    if (storedScript && storedScript === currentScript && storedSeed) {
      // Same script → NEW seed
      seed = Math.floor(Math.random() * 10_000_000);
      localStorage.setItem("lastSeed", seed.toString());
    } else {
      // New script → reuse existing seed if available, else make one
      if (storedSeed) {
        seed = parseInt(storedSeed, 10);
      } else {
        seed = Math.floor(Math.random() * 10_000_000);
        localStorage.setItem("lastSeed", seed.toString());
      }
      localStorage.setItem("lastScript", currentScript);
    }
  
    return seed;
  }
  