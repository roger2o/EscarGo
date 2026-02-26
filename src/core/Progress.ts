const STORAGE_KEY = 'escargo-progress';

export interface ProgressData {
  currentLevel: number;
  bestStars: Record<number, number>;
}

function defaultProgress(): ProgressData {
  return { currentLevel: 0, bestStars: {} };
}

export function getProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const data = JSON.parse(raw);
    return {
      currentLevel: data.currentLevel ?? 0,
      bestStars: data.bestStars ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(level: number, stars: number): void {
  const progress = getProgress();
  const prev = progress.bestStars[level] ?? 0;
  if (stars > prev) {
    progress.bestStars[level] = stars;
  }
  if (level + 1 > progress.currentLevel) {
    progress.currentLevel = level + 1;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}
