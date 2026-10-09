import type { Commune } from "@/utils/geo/communes";
import type { LonLat } from "@/utils/geo/coordinates";

/**
 * Geographic location associated with a GeoCaptcha challenge.
 */
export interface GeoCaptchaLocation {
    /** Latitude in decimal degrees. */
    latitude: number;
    /** Longitude in decimal degrees */
    longitude: number;
    /** Postal code associated with the location */
    zipcode: string;
    /** INSEE department code */
    departementCode: string;
    /** Commune name */
    communeName: string;
}

/**
 * Builds a GeoCaptcha location from geographic coordinates and commune information.
 *
 * When a postal code is provided explicitly, it takes precedence. Otherwise, the first postal code
 * associated with the commune is used.
 *
 * @param point - Geographic point as `[longitude, latitude]`.
 * @param commune - Commune containing or associated with the point.
 * @param zipcode - Optional postal code to use for the location.
 * @retruns A normalized {@link GeoCaptchaLocation}.
 */
export function buildLocation(
    [lon, lat]: LonLat,
    commune: Commune,
    zipcode?: string,
): GeoCaptchaLocation {
    return {
        latitude: lat,
        longitude: lon,
        zipcode: zipcode || commune.codesPostaux[0],
        departmentCode: commune.codeDepartement,
        communeName: commune.nom,
    }
}