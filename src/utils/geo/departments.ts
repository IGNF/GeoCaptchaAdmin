import {getJson} from "@/utils/getJson";

/**
 * An administrative department.
 */
export interface Department {
    code: string;
    nom: string;
}

/**
 * Fetches the list of French departments from the government's geographic API.
 *
 * Only the department name and INSEE codes are requested.
 *
 * @returns A promise resolving to the list of departments.
 * @throws {Error} If the API request fails.
 */
export async function fetchDepartments(): Promise<Department[]> {
    return getJson<Department[]>(
        'https://geo.api.gouv.fr/departements?fields=nom,code'
    )
}