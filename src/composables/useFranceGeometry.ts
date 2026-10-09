import { shallowRef } from "vue";
import * as turf from "@turf/turf";
import type {
    FeatureCollection,
    Polygon,
    MultiPolygon
} from "geojson";
import type {
    BBox,
    LonLat
} from "@/utils/geo/coordinates";
import { randomPointWhere } from "@/utils/geo/random";

/**
 * GeoJSON collection containing the polygons and multi-polygons used to represent France,
 * including its overseas territories.
 */
type FranceCollection = FeatureCollection<Polygon | MultiPolygon>

/**
 * Lazily loaded France geometry.
 *
 * `shallowRef` is sufficient here because the GeoJSON is treated as immutable after loading.
 */
const franceGeoJson = shallowRef<FranceCollection | null>(null)

/**
 * Shared loading promise used to prevent multiple concurrent requests for the same GeoJSON resource.
 */
let loading: Promise<void> | null = null

/**
 * Provides access to France's geographic boundaries and helpers for testing and generating points
 * within them.
 *
 * The GeoJSON data is loaded lazily by calling {@link load}. The loading request is cached, so
 * concurrent calls to `load()` share the same promise. If loading fails, the cached promise is
 * cleared to allow a subsequent call for retry.
 *
 * @returns Function for loading the geometry, testing points, and generating random points within
 * France.
 */
export function useFranceGeometry() {
    /**
     * Loads the France GeoJson geometry.
     *
     * Calling this function multiple times while the geometry is loading reuses the same
     * in-flight request. Once loaded, subsequent calls resolve using the cached geometry without
     * fetching it again.
     *
     * @throws {Error} If the GeoJSON resource cannot be fetched.
     */
    function load(): Promise<void> {
        loading ??= fetch('/regions-avec-outre-mer.geojson')
            .then(res => {
                if (!res.ok) throw new Error('GeoJSON not found.')
                return res.json()
            })
            .then((data: FranceCollection) => {
                franceGeoJson.value = data
            })
            .catch(err => {
                loading = null // allows retry
                throw err
            })
        return loading
    }

    /**
     * Determines whether a geographic point lies within France's loaded geometry.
     *
     * The point is expected in `[longitude, latitude]` order.
     * Both mainland and overseas territories are considered, provided they are present in the
     * local GeoJSON.
     *
     * @param point - Geographic point as `[longitude, latitude]`.
     * @returns `ture` if the point is inside one of the France polygons; otherwise `false`.
     * Returns `false` is the geometry has not yet been loaded.
     */
    function isPointInFrance([lon, lat]: LonLat): boolean {
        if (!franceGeoJson.value) return false
        const pt = turf.point([lon, lat])
        return franceGeoJson.value.features.some(f => turf.booleanPointInPolygon(pt, f))
    }

    /**
     * Generates a random point within both the supplied bounding box and the loaded France
     * geometry.
     *
     * The function makes a finite number of attempts and returns `null` if no matching point is
     * found.
     *
     * @param bbox - Bounding box in the form `[minLon, minLat, maxLon, maxLat]`.
     * @returns A random point inside France and `bbox`, or null if no suitable point is found
     * within the allowed number of attempts.
     *
     * @remarks
     * Call {@link load} and await it before using this function.
     * If the geometry has not been loaded, every point will be rejected.
     */
    function randomPointInFrance(bbox: BBox): LonLat | null {
        return randomPointWhere(bbox, isPointInFrance)
    }

    return { load, isPointInFrance, randomPointInFrance }
}