/**
 * Utility for haptic feedback on mobile devices.
 * Uses the Vibration API where available.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const vibrationPatterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 30,
    heavy: 50,
    success: [20, 50, 20], // Short-pause-short
    error: [50, 100, 50, 100, 50], // Error pattern
};

/**
 * Triggers haptic feedback if supported.
 * @param style - The type of haptic feedback to trigger.
 */
export const triggerHaptic = (style: HapticStyle = 'medium'): void => {
    if ('vibrate' in navigator) {
        const pattern = vibrationPatterns[style];
        navigator.vibrate(pattern);
    }
};
