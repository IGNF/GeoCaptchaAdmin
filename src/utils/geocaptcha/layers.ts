import type { GeCaptchaMode } from './modes';

/** Imagery leyers a tile can be requested from. */
export type TileLayerName = 'ortho' | 'scan' | 'plan'

/** Layer used for the static background of every GeoCaptcha, whatever the mode. */
export const BACKGROUND_LAYER: TileLayerName = 'plan'

/**
 * Maps a GeoCaptcha mode to the tile layer used for the rotating foreground disc.
 *
 * @param mode - The selected imagery mode.
 * @returns The layer to request. `'plan-sur-plan'` uses the `'plan'` layer.
 */
export const foregroundLayerFor = (mode: GeCaptchaMode): TileLayerName =>
    mode === 'plan-sur-plan' ? 'plan' : mode;