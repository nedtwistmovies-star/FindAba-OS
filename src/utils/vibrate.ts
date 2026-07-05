/**
 * FindAba OS - Industrial Haptic Vibration Engine
 * Provides physical feedback patterns for touch interactions under various OS conditions.
 */

// Vibration pattern types
export const VIBRATE_PATTERNS = {
  // Ultra-short tick for normal button presses / toggles
  TICK: 15,
  // Double-tap pulse for favorites / status toggle
  FAVORITE: [15, 40, 15],
  // Success pulse for order completion, transaction confirmation, checkouts
  SUCCESS: [40, 60, 40, 60, 80],
  // Warning pulse for validations, error inputs
  ERROR: [80, 100, 80, 100, 120],
  // Persistent radar pattern for warnings / long-press menus
  MENU_OPEN: 25,
};

/**
 * Triggers a device physical vibration pattern.
 * Safe to call on any platform; silently fails if unsupported.
 */
export const triggerVibration = (pattern: keyof typeof VIBRATE_PATTERNS | number | number[] = 'TICK') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      let activePattern: number | number[];
      if (typeof pattern === 'string' && pattern in VIBRATE_PATTERNS) {
        activePattern = VIBRATE_PATTERNS[pattern as keyof typeof VIBRATE_PATTERNS];
      } else {
        activePattern = pattern as number | number[];
      }
      navigator.vibrate(activePattern);
    } catch (e) {
      console.warn('[Haptic Engine] Vibration blocked or unsupported:', e);
    }
  }
};
