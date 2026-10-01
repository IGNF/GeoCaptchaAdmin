import * as turf from '@turf/turf'
import type {
    Feature,
    FeatureCollection,
    MultiPolygon,
    Polygon,
} from "geojson";
import { LonLat } from "@/utils/geo/coordinates";
import { getJson } from "@/utils/getJson";

const API = 'https://geo.api.gouv.fr'

/**
 * Properties requested from the API.
 */
const FIELDS = 'nom,code,codeDepartement,codesPostaux'

/**
 * Properties returned for a commune.
 */
export interface Commune {
    /** Commune name. */
    nom: string
    /** INSEE commune code. */
    code: string
    /** INSEE department code. */
    codeDepartement: string
    /** Postal codes associated with the commune. */
    codesPostaux: string[]
}

/**
 * GeoJSON feature representing a commune.
 */
export type CommuneFeature = Feature<Polygon | MultiPolygon, Commune>

/**
 * GeoJSON feature collection containing communes.
 */
export type CommuneCollection = FeatureCollection<Polygon | MultiPolygon, Commune>

/**
 * Finds the commune containing a geographic point using the API's reverse-geocoding endpoint.
 *
 * Useful when the commune is not already available locally.
 *
 * @param point - Geographic point as `[longitude, latitude]`.
 * @reurns The containing commune or `null` when the point is not associated with a commune (e.g. a
 * point at sea or outside the API's covered territory).
 */
export async function fetchCommuneAt([lon, lat]: LonLat): Promise<Commune | null> {
    const list = await getJson<Commune[]>(
        `${API}/communes?lat=${lat}&lon=${lon}&fields=${FIELDS}`,
    );
    return list[0] ?? null;
}

/**
 * Cache of department commune requests.
 *
 * Commune GeoJSON responses are relatively large and the same department may be queried, so the
 * requests are cached by department code.
 *
 * The promise itself is cached rather than only the resolved collection, which also deduplicates
 * concurrent requests for the same department.
 */
const departmentCache = new Map<string, Promise<CommuneCollection>>();

/**
 * Fetches all communes in a department as GeoJson.
 *
 * Results are cached by department code. Failed requests are removed from the cache so that a
 * subsequent call can retry the request.
 *
 * Each feature  also receives a precomputed `bbox` when one is not already present. Turf can use
 * this bounding box to quickly reject points which are outside a feature before performing the
 * more expensive point-in-polygone check.
 *
 * @param code - INSEE department code.
 * @returns A Promise resolving to the department's commune collection.
 * @throws {Error} If the API request fails.
 */
export function fetchDepartmentCommunes(code: string): Promise<CommuneCollection> {
    let promise = departmentCache.get(code);
    if (!promise) {
        promise = getJson<CommuneCollection>(
            `${API}/communes?codeDepartement=${code}&format=geojson&geometry=contour&fields=${FIELDS}`,
        ).then(collection => {
            // Precompute bounding boxzs to speed up repeated spatial lookup with Turf.
            collection.features.forEach(f => { f.bbox ??= turf.bbox(f) })
            return collection
        })
        // Do not permanently cache failed requests; allow a later call to retry.
        promise.catch(() => departmentCache.delete(code))
        departmentCache.set(code, promise)
    }
    return promise;
}

/**
 * Finds the commune containing a geographic point within an already loaded collection.
 *
 * @param collection - Collection of commune geometries to search.
 * @param point - Geographic point as  `[longitude, latitude]`.
 * @returns The containing commune feature, or `undefined` if no commune contains the point.
 */
export function findCommuneAt(
    collection: CommuneCollection,
    [lon, lat]: LonLat,
): CommuneFeature | undefined {
    const pt = turf.point([lon, lat]);
    return collection.features.find(f => turf.booleanPointInPolygon(pt, f))
}

/**
 * Resolves commune information for a point.
 *
 * If a commune features with postal-code information is already available, its properties are
 * returned directly without making another API required. Otherwise, the point is reverse-geocoded
 * through the API.
 *
 * @param point - Geographic point as `[longitude, latitude]`.
 * @param feature - Optional commune feature already containing the point.
 * @returns The resolved commune, or `null` if no commune can be found.
 */
export async function resolveCommune(
    point: LonLat,
    feature?: CommuneFeature,
): Promise<Commune | null> {
    if (feature?.properties?.codesPostaux?.length) return feature.properties
    return fetchCommuneAt(point);
}