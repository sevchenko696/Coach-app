import { wp, ms, isTablet } from './responsive'

export const colors = {
  primary: '#16a34a',
  primaryLight: '#dcfce7',
  primaryDark: '#15803d',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#f3f4f6',
  error: '#ef4444',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  success: '#16a34a',
  successLight: '#dcfce7',
  pink: '#ec4899',
  pinkLight: '#fce7f3',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
} as const

// Spacing scales with screen width (wp) for consistent proportions
export const spacing = {
  xs: wp(4),
  sm: wp(8),
  md: wp(12),
  lg: wp(16),
  xl: wp(20),
  '2xl': wp(24),
  '3xl': wp(32),
} as const

// Font sizes use moderate scaling (ms) so text doesn't grow too large on tablets
export const fontSize = {
  xs: ms(10),
  sm: ms(12),
  base: ms(14),
  md: ms(16),
  lg: ms(18),
  xl: ms(20),
  '2xl': ms(24),
  '3xl': ms(30),
} as const

// Border radius scales with screen
export const borderRadius = {
  sm: wp(8),
  md: wp(12),
  lg: wp(16),
  xl: wp(20),
  full: 9999,
} as const

// Element sizes that vary by device class
export const elementSize = {
  avatar: isTablet ? 88 : wp(64),
  avatarSmall: isTablet ? 44 : wp(32),
  logo: isTablet ? 80 : wp(56),
  logoSmall: isTablet ? 44 : wp(32),
  dayBadge: isTablet ? 52 : wp(40),
  iconMd: ms(18),
  iconLg: ms(24),
  iconXl: ms(32),
  buttonHeight: isTablet ? 52 : wp(44),
  inputHeight: isTablet ? 48 : wp(42),
  videoHeight: isTablet ? 360 : wp(200),
  chartHeight: isTablet ? 160 : wp(100),
  tabBarIcon: ms(22),
} as const
