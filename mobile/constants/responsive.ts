import { Dimensions, PixelRatio, Platform } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Base design dimensions (iPhone 14 / 390pt width)
const BASE_WIDTH = 390
const BASE_HEIGHT = 844

/**
 * Scale a value proportionally to the screen width relative to the base design.
 * For horizontal dimensions: widths, paddings, margins, font sizes.
 */
export function wp(size: number): number {
  const scaled = (SCREEN_WIDTH / BASE_WIDTH) * size
  return Math.round(PixelRatio.roundToNearestPixel(scaled))
}

/**
 * Scale a value proportionally to the screen height relative to the base design.
 * For vertical dimensions: heights, vertical paddings.
 */
export function hp(size: number): number {
  const scaled = (SCREEN_HEIGHT / BASE_HEIGHT) * size
  return Math.round(PixelRatio.roundToNearestPixel(scaled))
}

/**
 * Moderate scale — scales less aggressively than wp().
 * Good for font sizes and icon sizes where full scaling looks too extreme on tablets.
 * factor: 0 = no scaling, 1 = full wp() scaling. Default 0.5.
 */
export function ms(size: number, factor = 0.5): number {
  return Math.round(PixelRatio.roundToNearestPixel(size + (wp(size) - size) * factor))
}

// Breakpoints
export const isSmallPhone = SCREEN_WIDTH < 375   // iPhone SE / older Android
export const isTablet = SCREEN_WIDTH >= 768       // iPad / large Android tablets
export const isLargeTablet = SCREEN_WIDTH >= 1024 // iPad Pro landscape

/**
 * Returns number of columns for grid layouts based on screen width.
 */
export function gridColumns(minItemWidth = 160): number {
  const usable = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH) - wp(32)
  return Math.max(1, Math.floor(usable / minItemWidth))
}

/**
 * Maximum content width — prevents text lines from becoming too long on tablets.
 * Content should be centered within this constraint.
 */
export const MAX_CONTENT_WIDTH = 600

/**
 * Returns horizontal padding needed to center content within MAX_CONTENT_WIDTH.
 * On phones, returns the base padding. On tablets, adds extra padding.
 */
export function contentPadding(basePadding = 16): number {
  if (SCREEN_WIDTH <= MAX_CONTENT_WIDTH + basePadding * 2) {
    return wp(basePadding)
  }
  return Math.round((SCREEN_WIDTH - MAX_CONTENT_WIDTH) / 2)
}

export { SCREEN_WIDTH, SCREEN_HEIGHT }

/**
 * React hook version — listens for dimension changes (rotation, split-screen).
 * Import useWindowDimensions from react-native instead for live updates.
 */
export function getResponsiveInfo() {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmallPhone,
    isTablet,
    isLargeTablet,
  }
}
