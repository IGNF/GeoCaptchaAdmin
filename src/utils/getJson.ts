/**
 * Fetches and parse a JSON response.
 *
 * @param url - URL to request
 * @returns The decoded JSON response.
 * @throws {Error} If the HTTP response is not successful.
 */
export async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url} : ${res.status}`)
    return res.json() as Promise<T>
}