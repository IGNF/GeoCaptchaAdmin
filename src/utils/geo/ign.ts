import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

const PLAN_IGN_URL = [
    'https://data.geopf.fr/wmts?',
    'SERVICE=WMTS',
    '&REQUEST=GetTile&VERSION=1.0.0',
    '&TILEMATRIXSET=PM',
    '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
    '&STYLE=normal&FORMAT=image/png',
    '&TILECOL={x}',
    '&TILEROW={y}',
    '&TILEMATRIX={z}',
].join('');

/** Approximate geographic center of France, as `[lon, lat]`. */
export const FRANCE_CENTER: [number, number] = [2.45407, 46.80335];

/** Creates a tile layer showing the IGN "Plan IGN v2" base map. */
export function createPlanIgnLayer() {
    return new TileLayer({
        source: new XYZ({
            url: PLAN_IGN_URL,
            attributions: 'Carte © IGN/Geoplateforme',
        }),
    })
}