// localStorage wrapper that never throws (private mode, blocked storage...).
const PREFIX = 'lsd.';

export const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, String(value));
    } catch {
      /* ignore */
    }
  },
};

// The spec asks for a plain `tutorialCompleted` key, so it is stored without prefix.
export function isTutorialCompleted() {
  try {
    return localStorage.getItem('tutorialCompleted') === 'true';
  } catch {
    return false;
  }
}

export function setTutorialCompleted() {
  try {
    localStorage.setItem('tutorialCompleted', 'true');
  } catch {
    /* ignore */
  }
}
