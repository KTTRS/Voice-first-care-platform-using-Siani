/**
 * Luxury Theme Configuration
 *
 * Design Philosophy: "Old Money" Aesthetic
 * - Not flashy or trendy
 * - Timeless, elevated, exclusive
 * - Subtle luxury through materials and craftsmanship
 * - Feels cultural and personal, not clinical
 */

export const colors = {
  // Primary palette (muted, sophisticated)
  background: "#F9F7F4", // Off-white with warm undertone
  surface: "#FFFFFF", // Pure white for elevated cards
  text: {
    primary: "#1F1F1F", // Deep charcoal (not pure black)
    secondary: "#4A4540", // Warm gray
    tertiary: "#6B6560", // Muted brown-gray
    disabled: "#8B8680", // Light gray-brown
  },

  // Accent colors (rare gold touches)
  accent: {
    gold: "#DAA520", // Classic gold
    deepGold: "#B8860B", // Dark goldenrod
    paleGold: "#F0E68C", // Khaki (subtle gold)
  },

  // Semantic colors (muted, not clinical)
  semantic: {
    success: "#8BC34A", // Soft green
    warning: "#FF9800", // Warm amber
    error: "#EF5350", // Soft red
    info: "#42A5F5", // Calm blue
  },

  // Border and dividers
  border: {
    light: "#E8E3D9",
    medium: "#D4CFC4",
    dark: "#ACA7A0",
  },

  // Shadows
  shadow: {
    default: "rgba(0, 0, 0, 0.08)",
    elevated: "rgba(0, 0, 0, 0.12)",
  },
};

export const typography = {
  // Font families (Inter for mobile, would use serif for web)
  fonts: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
  },

  // Font sizes (scaled for readability)
  sizes: {
    xs: 11,
    sm: 13,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing (subtle tracking)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};

/**
 * Animation timing (slow, deliberate)
 */
export const animation = {
  duration: {
    fast: 200,
    normal: 400,
    slow: 600,
    breath: 3000, // For Siani's breathing animation
  },
  easing: {
    default: "ease-in-out",
    entrance: "ease-out",
    exit: "ease-in",
  },
};

/**
 * Haptic feedback patterns
 */
export const haptics = {
  light: "Light", // Subtle tap
  medium: "Medium", // Standard press
  heavy: "Heavy", // Important action
  selection: "Selection", // Item selection
  success: "NotificationSuccess",
  warning: "NotificationWarning",
  error: "NotificationError",
};

/**
 * Component-specific styling
 */
export const components = {
  button: {
    primary: {
      backgroundColor: colors.text.primary,
      color: colors.background,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
    },
    secondary: {
      backgroundColor: "transparent",
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.medium,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.text.secondary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
    },
  },
  card: {
    default: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.md,
    },
    elevated: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.lg,
    },
  },
};

/**
 * Layout constraints
 */
export const layout = {
  maxWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
  },
  containerPadding: spacing.lg,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  haptics,
  components,
  layout,
};
