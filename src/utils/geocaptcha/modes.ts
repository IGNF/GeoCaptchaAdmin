/**
 * Available GeoCaptcha map modes.
 *
 * Each mode defines the value used internally and the human-readable label displayed to the user.
 */
export const GEOCAPTCHA_MODES = [
    { value: 'ortho', text: 'Ortho' },
    { value: 'plan-sur-plan', text: 'Plan' },
    { value: 'scan', text: 'Scan' },
] as const

/**
 * Identifier of a supported GeoCaptcha map mode.
 *
 * This type is derived from {@link GEOCAPTCHA_MODES}, so adding or removing a mode from the list
 * automatically updates the type.
 */
export type GeoCaptchaMode = (typeof GEOCAPTCHA_MODES)[number]['value'];

/**
 * Select a GeoCaptcha map mode at random.
 *
 * @returns One of the mode defined {@link GEOCAPTCHA_MODES}.
 */

export const pickRandomMode = (): GeoCaptchaMode =>
    GEOCAPTCHA_MODES[Math.floor(Math.random() * GEOCAPTCHA_MODES.length)].value;