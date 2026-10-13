/** Largest id the backend accept is 100 000; stay just bellow to avoid errors */
const MAX_ID = 99_999

/**
 * Generates an identifier for a GeoCaptcha.
 *
 * Call it once per preview and reuse the result when saving, so the previewed captcha and the
 * saved one share the same id.
 *
 * @returns A numeric string of up to 10 digits (a random 32-bit unsigned integer).
 */
export function generateGeoCaptchaId(): string {
    // NOTE: `crypto.randomUUID()` could be more adapted to avoid collision.
    const value = crypto.getRandomValues(new Uint32Array(1))[0];
    return String((value % MAX_ID) + 1)
}