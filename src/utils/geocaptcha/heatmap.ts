/**
 * Color ramp of the heatmap, from transparent (no data) to red (highest density).
 *
 * Single source of truth: used by the OpenLayers and by the legend.
 */
export const HEATMAP_GRADIENT = [
    'rgba(0, 0, 255, 0)',
    'rgba(0, 0, 255, 0.5)',
    'rgba(0, 255, 255, 0.7)',
    'rgba(0, 255, 0, 0.7)',
    'rgba(255, 255, 0, 0.7)',
    'rgba(255, 128, 0, 0.7)',
    'rgba(255, 0, 0, 0.9)',
] as const;