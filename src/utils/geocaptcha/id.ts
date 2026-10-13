/** Largest id the backend accept is 100 000; stay just bellow to avoid errors */
const MAX_ID = 99_999

/**
 * Generates an identifier for a GeoCaptcha.
 *
 * Call it once per preview and reuse the result when saving, so the previewed captcha and the
 * saved one share the same id.
 *
 * @returns A uniformly distributed numeric string between 1 and 100,000.
 */
export function generateGeoCaptchaId(): string {
    const range = 2 ** 32;
    const limit = range - (range % MAX_ID);

    let value: number;
    do {
        value = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= limit);

    return String((value % MAX_ID) + 1);
}