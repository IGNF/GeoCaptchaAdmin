import { onBeforeUnmount, shallowRef, type Ref } from "vue";
import 'ol/ol.css'
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import Heatmap from "ol/layer/Heatmap";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import {createPlanIgnLayer, FRANCE_CENTER} from "@/utils/geo/ign";
import { HEATMAP_GRADIENT } from "@/utils/geocaptcha/heatmap";
import {points} from "@turf/turf";

/**
 * Sets up an OpenLayers map showing the IGN base map under a heatmap layer.
 *
 * @param target - Template ref of the element which hosts the map.
 * @returns
 * - `init`: creates the map in `target`. Call it once the element is mounted. Idempotent.
 * - `setPoints`: replaces the heatmap points. Each point is `[lon, lat]` in WGS84.
 *
 * @remarks The map is disposed of automatically when the component unmounts.
 */
export function useHeatmapMap(target: Ref<HTMLElement | null>) {
    const map = shallowRef<Map | null>(null);
    const source = new VectorSource();

    function init() {
        if (map.value || !target.value) return;

        map.value = new Map({
            target: target.value,
            layers: [
                createPlanIgnLayer(),
                new Heatmap({
                    source,
                    blur: 15,
                    radius: 10,
                    gradient: [...HEATMAP_GRADIENT],
                }),
            ],
            view: new View({
                center: fromLonLat(FRANCE_CENTER),
                zoom: 5.75,
                maxZoom: 15,
            }),
        });
    }

    function setPoints(points: Array<[number, number]>) {
        source.clear(true);
        source.addFeatures(points.map((lonLat) => new Feature(new Point(fromLonLat(lonLat)))));
    }

    function dispose() {
        map.value?.setTarget(undefined);
        map.value = null;
    }

    onBeforeUnmount(dispose);

    return { init, setPoints };
}