/**
 * Centralized theme colors for the app.
 * These values match the CSS variables defined in components/ui/gluestack-ui-provider/config.ts
 *
 * Use Tailwind classes (e.g., bg-background-50, text-typography-800) when possible.
 * Use these hex values only when Tailwind classes aren't applicable (e.g., icon colors, dynamic styles).
 */

export const colors = {
  // Backgrounds
  background: "#FAF7F2", // --color-background-50
  backgroundSecondary: "#F5EFE6", // --color-background-100
  backgroundDark: "#EEE6DA", // --color-background-200

  // Primary (Warm Beige)
  primary: "#D4A574", // --color-primary-500
  primaryLight: "#F7E9D7", // --color-primary-100
  primaryDark: "#A57B4B", // --color-primary-700

  // Secondary (Brown)
  secondary: "#8B7355", // --color-secondary-500
  secondaryLight: "#E6DDD2", // --color-secondary-100
  secondaryDark: "#644F37", // --color-secondary-700

  // Accent/Tertiary (Dark Brown)
  accent: "#4A3728", // --color-tertiary-500

  // Typography
  textPrimary: "#3D2E22", // --color-typography-800
  textSecondary: "#6B5B4F", // --color-typography-600
  textMuted: "#9B8B7F", // --color-typography-400

  // Borders/Outlines
  border: "#E8DED3", // --color-outline-200
  borderDark: "#C9BAAA", // --color-outline-300

  // Semantic
  error: "#D25037", // --color-error-500
  errorLight: "#FDF5F3", // --color-error-0
  success: "#558750", // --color-success-500
  successLight: "#F5FAF5", // --color-success-0
  warning: "#E19B37", // --color-warning-500
  warningLight: "#FFFBF5", // --color-warning-0

  // Cards/Surfaces
  card: "#FFFFFF",
  cardBg: "#FFFFFF", // alias for card
  cardDark: "#F5EFE6",

  // Common
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

/**
 * Tailwind class mappings for common color uses.
 * Use these as reference for which Tailwind classes correspond to the colors above.
 *
 * Background:
 *   - bg-background-50  -> #FAF7F2 (main background)
 *   - bg-background-100 -> #F5EFE6 (secondary background)
 *
 * Text:
 *   - text-typography-800 -> #3D2E22 (primary text)
 *   - text-typography-600 -> #6B5B4F (secondary text)
 *   - text-typography-400 -> #9B8B7F (muted text)
 *
 * Primary:
 *   - bg-primary-500 -> #D4A574
 *   - text-primary-500 -> #D4A574
 *
 * Secondary:
 *   - bg-secondary-500 -> #8B7355
 *   - text-secondary-500 -> #8B7355
 *
 * Borders:
 *   - border-outline-200 -> #E8DED3
 */
