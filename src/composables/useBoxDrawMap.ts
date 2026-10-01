import { onBeforeUnmount, shallowRef, type Ref } from "vue"
import 'ol/ol.css'
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import Draw, { createBox } from 'ol/interaction/Draw.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import FullScreen from 'ol/control/FullScreen.js'
import { defaults as defaultControls } from 'ol/control/defaults.js'
import { XYZ } from 'ol/source'
import { fromLonLat, transformExtent } from 'ol/proj'
import type { BBox } from '@/utils/geo/coordinates'

/**
 * IGN Plan IGN WMTS tile source.
 */
const PLAN_IGN_URL =
    'https://data.geopf.fr/wmts?' +
    'SERVICE=WMTS' +
    '&REQUEST=GetTile' +
    '&VERSION=1.0.0' +
    '&TILEMATRIXSET=PM' +
    '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' +
    '&STYLE=normal' +
    '&FORMAT=image/png' +
    '&TILECOL={x}' +
    '&TILEROW={y}' +
    '&TILEMATRIX={z}'

/**
 * Callback invoked by {@link useBoxDrawMap}.
 */
interface Options {
    /**
     * Called when the user finishes drawing a bounding box.
     *
     * The bounding box is provided in geographic coordinates as
     * `[minLon, minLat, maxLon, maxLat]`.
     */
    onBoxDrawn: (bbox: BBox) => void

    /**
     * Called whenever the currently drawn box is cleared.
     */
    onClear?: () => void
}

/**
 * Provides an OpenLayers map for interactively drawing a geographic bounding box.
 *
 * The map uses the IGN Plan IGN base map and allows the user to draw a single rectangular
 * selection at a time. Drawing a new box automatically clears the previous one.
 *
 * The map is created lazily by calling {@link init} and is automatically disposed of when the
 * component using this composable is unmounted.
 *
 * @param target - Vue ref pointing to the HTML element that will contain the map.
 * @param options - Callbacks invoked when a box is drawn or cleared.
 * @returns Map lifecycle and selection controls:
 *      - `init` creates the map.
 *      - `clear` removes the current box.
 *      - `dispose` destroys the map instance.
 */
export function useBoxDrawMap(target: Ref<HTMLElement | null>, { onBoxDrawn, onClear }: Options) {
    const map = shallowRef<Map | null>(null)

    /**
     * Vector source containing the currently drawn bounding box.
     *
     * `wrapX: false` prevents the geometry from being duplicated across the antimeridian.
     */
    const source = new VectorSource({ wrapX: false })

    /**
     * Initializes the OpenLayer map.
     *
     * Initialization is idempotent: calling `init()` when the map already exists, or when the
     * target element is unavailable, has no effect.
     */
    function init() {
        if (map.value || !target.value) return

        map.value = new Map({
            target: target.value,
            controls: defaultControls().extend([new FullScreen()]),
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: PLAN_IGN_URL,
                        attributions: 'Carte © IGN/Geoplateforme'
                    }),
                }),
                new VectorLayer({ source }),
            ],
            view: new View({ center: fromLonLat([2.45407, 46.80335]), zoom: 5, maxZoom: 15 }),
        })

        const draw = new Draw({ source, type: 'Circle', geometryFunction: createBox() })

        // Only one bounding box can be selected at a time.
        draw.on('drawstart', clear)

        draw.on('drawend', (event) => {
            const extent = event.feature.getGeometry()!.getExtent()
            const [minLon, minLat, maxLon, maxLat] = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
            onBoxDrawn([minLon, minLat, maxLon, maxLat])
        })

        map.value.addInteraction(draw)
    }

    /**
     * Clears the currently drawn bounding box.
     *
     * The optional `onClear` callback is invoked after the geometry has been removed.
     */
    function clear() {
        source.clear()
        onClear?.()
    }

    /**
     * Disposes of the OpenLayers map.
     *
     * The map target is detached before the map reference is cleared.
     * This function is also called automatically when the component using the composable is
     * unmounted.
     */
    function dispose() {
        map.value?.setTarget(undefined)
        map.value = null
    }

    onBeforeUnmount(dispose)

    return { init, clear, dispose }
}