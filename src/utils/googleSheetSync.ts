const LAST_KNOWN_NON_ZERO_STARS_KEY = 'kidhero_last_known_nonzero_stars_v1';

/**
 * Reads the last known non-zero cumulative star balance from localStorage
 * so a temporary reload never resets the child's stars to 0.
 */
export function getLastKnownNonZeroStars(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = Number(localStorage.getItem(LAST_KNOWN_NON_ZERO_STARS_KEY) || 0);
    return Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  } catch {
    return 0;
  }
}

export function saveLastKnownNonZeroStars(stars: number, allowOverwrite: boolean = false): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = Math.max(0, Math.round(Number(stars) || 0));
    if (allowOverwrite) {
      if (clean > 0) {
        localStorage.setItem(LAST_KNOWN_NON_ZERO_STARS_KEY, String(clean));
      } else {
        localStorage.removeItem(LAST_KNOWN_NON_ZERO_STARS_KEY);
      }
      return;
    }
    if (clean > 0) {
      localStorage.setItem(LAST_KNOWN_NON_ZERO_STARS_KEY, String(clean));
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearLastKnownNonZeroStarsOnExplicitReset(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LAST_KNOWN_NON_ZERO_STARS_KEY);
  } catch {
    // Ignore
  }
}
