'use client';
import { vars } from 'nativewind';

// Beige Color Theme
// Background:          #FAF7F2  -> 250 247 242
// Background Secondary: #F5EFE6  -> 245 239 230
// Primary:             #D4A574  -> 212 165 116
// Secondary:           #8B7355  -> 139 115 85
// Accent:              #4A3728  -> 74 55 40
// Text Primary:        #3D2E22  -> 61 46 34
// Text Secondary:      #6B5B4F  -> 107 91 79
// Text Muted:          #9B8B7F  -> 155 139 127

export const config = {
  light: vars({
    /* Primary (Warm Beige) - Based on #D4A574 */
    '--color-primary-0': '255 251 247',
    '--color-primary-50': '252 244 235',
    '--color-primary-100': '247 233 215',
    '--color-primary-200': '239 216 185',
    '--color-primary-300': '229 196 150',
    '--color-primary-400': '221 181 133',
    '--color-primary-500': '212 165 116', // #D4A574 - Base primary
    '--color-primary-600': '190 145 95',
    '--color-primary-700': '165 123 75',
    '--color-primary-800': '135 98 58',
    '--color-primary-900': '102 72 40',
    '--color-primary-950': '74 55 40',

    /* Secondary (Brown) - Based on #8B7355 */
    '--color-secondary-0': '250 248 245',
    '--color-secondary-50': '242 237 230',
    '--color-secondary-100': '230 221 210',
    '--color-secondary-200': '210 197 180',
    '--color-secondary-300': '185 167 145',
    '--color-secondary-400': '162 145 120',
    '--color-secondary-500': '139 115 85', // #8B7355 - Base secondary
    '--color-secondary-600': '120 98 70',
    '--color-secondary-700': '100 80 55',
    '--color-secondary-800': '80 62 42',
    '--color-secondary-900': '60 46 32',
    '--color-secondary-950': '45 35 25',

    /* Tertiary (Dark Accent) - Based on #4A3728 */
    '--color-tertiary-0': '248 246 244',
    '--color-tertiary-50': '235 230 225',
    '--color-tertiary-100': '215 205 195',
    '--color-tertiary-200': '180 165 150',
    '--color-tertiary-300': '140 120 105',
    '--color-tertiary-400': '105 85 70',
    '--color-tertiary-500': '74 55 40', // #4A3728 - Base accent
    '--color-tertiary-600': '62 46 34',
    '--color-tertiary-700': '50 37 27',
    '--color-tertiary-800': '38 28 20',
    '--color-tertiary-900': '28 21 15',
    '--color-tertiary-950': '20 15 11',

    /* Error (warm red-brown for cohesion) */
    '--color-error-0': '255 248 246',
    '--color-error-50': '254 237 232',
    '--color-error-100': '252 220 210',
    '--color-error-200': '248 190 175',
    '--color-error-300': '242 155 135',
    '--color-error-400': '230 115 90',
    '--color-error-500': '210 80 55',
    '--color-error-600': '185 60 40',
    '--color-error-700': '155 45 30',
    '--color-error-800': '120 35 22',
    '--color-error-900': '90 25 15',
    '--color-error-950': '65 18 10',

    /* Success (earthy green-brown) */
    '--color-success-0': '245 250 245',
    '--color-success-50': '232 242 230',
    '--color-success-100': '215 230 210',
    '--color-success-200': '185 210 180',
    '--color-success-300': '150 185 145',
    '--color-success-400': '115 160 110',
    '--color-success-500': '85 135 80',
    '--color-success-600': '70 115 65',
    '--color-success-700': '55 95 50',
    '--color-success-800': '42 75 38',
    '--color-success-900': '30 55 28',
    '--color-success-950': '20 38 20',

    /* Warning (warm amber-brown) */
    '--color-warning-0': '255 251 245',
    '--color-warning-50': '255 245 230',
    '--color-warning-100': '254 235 205',
    '--color-warning-200': '252 220 165',
    '--color-warning-300': '248 200 120',
    '--color-warning-400': '240 180 85',
    '--color-warning-500': '225 155 55',
    '--color-warning-600': '200 135 45',
    '--color-warning-700': '170 110 35',
    '--color-warning-800': '135 85 28',
    '--color-warning-900': '100 65 20',
    '--color-warning-950': '70 45 15',

    /* Info (use secondary-brown family) */
    '--color-info-0': '250 248 245',
    '--color-info-50': '242 237 230',
    '--color-info-100': '230 221 210',
    '--color-info-200': '210 197 180',
    '--color-info-300': '185 167 145',
    '--color-info-400': '162 145 120',
    '--color-info-500': '139 115 85', // same as secondary 500
    '--color-info-600': '120 98 70',
    '--color-info-700': '100 80 55',
    '--color-info-800': '80 62 42',
    '--color-info-900': '60 46 32',
    '--color-info-950': '45 35 25',

    /* Typography (warm brown tones) - Using textPrimary (#3D2E22), textSecondary (#6B5B4F), textMuted (#9B8B7F) */
    '--color-typography-0': '255 253 250',
    '--color-typography-50': '245 240 235',
    '--color-typography-100': '230 220 210',
    '--color-typography-200': '210 195 180',
    '--color-typography-300': '185 170 155',
    '--color-typography-400': '155 139 127', // #9B8B7F - textMuted
    '--color-typography-500': '130 115 105',
    '--color-typography-600': '107 91 79', // #6B5B4F - textSecondary
    '--color-typography-700': '85 70 60',
    '--color-typography-800': '61 46 34', // #3D2E22 - textPrimary
    '--color-typography-900': '45 35 28',
    '--color-typography-950': '30 24 20',

    /* Outline (warm beige borders) */
    '--color-outline-0': '255 253 250',
    '--color-outline-50': '250 247 242',
    '--color-outline-100': '245 239 230',
    '--color-outline-200': '235 225 210',
    '--color-outline-300': '220 205 185',
    '--color-outline-400': '200 185 165',
    '--color-outline-500': '175 160 140',
    '--color-outline-600': '145 130 110',
    '--color-outline-700': '115 100 85',
    '--color-outline-800': '85 72 60',
    '--color-outline-900': '60 50 42',
    '--color-outline-950': '40 35 30',

    /* Background (warm beige tones) - Using background (#FAF7F2) and backgroundSecondary (#F5EFE6) */
    '--color-background-0': '255 255 255',
    '--color-background-50': '250 247 242', // #FAF7F2 - Main background
    '--color-background-100': '245 239 230', // #F5EFE6 - Secondary background
    '--color-background-200': '238 230 218',
    '--color-background-300': '225 215 200',
    '--color-background-400': '210 195 175',
    '--color-background-500': '190 175 155',
    '--color-background-600': '165 150 130',
    '--color-background-700': '135 120 100',
    '--color-background-800': '100 85 70',
    '--color-background-900': '70 60 50',
    '--color-background-950': '45 40 35',

    /* Background Special (warm tinted backgrounds) */
    '--color-background-error': '255 245 242',
    '--color-background-warning': '255 248 238',
    '--color-background-success': '245 250 245',
    '--color-background-muted': '245 239 230', // Same as backgroundSecondary
    '--color-background-info': '248 244 238',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '212 165 116', // primary 500
    '--color-indicator-info': '139 115 85', // secondary 500
    '--color-indicator-error': '210 80 55',
  }),

  dark: vars({
    /* Primary (Warm Beige) - adjusted for dark mode */
    '--color-primary-0': '74 55 40',
    '--color-primary-50': '102 72 40',
    '--color-primary-100': '135 98 58',
    '--color-primary-200': '165 123 75',
    '--color-primary-300': '190 145 95',
    '--color-primary-400': '212 165 116', // #D4A574 - Base primary
    '--color-primary-500': '221 181 133',
    '--color-primary-600': '229 196 150',
    '--color-primary-700': '239 216 185',
    '--color-primary-800': '247 233 215',
    '--color-primary-900': '252 244 235',
    '--color-primary-950': '255 251 247',

    /* Secondary (Brown) - adjusted for dark mode */
    '--color-secondary-0': '45 35 25',
    '--color-secondary-50': '60 46 32',
    '--color-secondary-100': '80 62 42',
    '--color-secondary-200': '100 80 55',
    '--color-secondary-300': '120 98 70',
    '--color-secondary-400': '139 115 85', // #8B7355 - Base secondary
    '--color-secondary-500': '162 145 120',
    '--color-secondary-600': '185 167 145',
    '--color-secondary-700': '210 197 180',
    '--color-secondary-800': '230 221 210',
    '--color-secondary-900': '242 237 230',
    '--color-secondary-950': '250 248 245',

    /* Tertiary (Dark Accent) - adjusted for dark mode */
    '--color-tertiary-0': '20 15 11',
    '--color-tertiary-50': '28 21 15',
    '--color-tertiary-100': '38 28 20',
    '--color-tertiary-200': '50 37 27',
    '--color-tertiary-300': '62 46 34',
    '--color-tertiary-400': '74 55 40', // #4A3728 - Base accent
    '--color-tertiary-500': '105 85 70',
    '--color-tertiary-600': '140 120 105',
    '--color-tertiary-700': '180 165 150',
    '--color-tertiary-800': '215 205 195',
    '--color-tertiary-900': '235 230 225',
    '--color-tertiary-950': '248 246 244',

    /* Error (warm red-brown for dark mode) */
    '--color-error-0': '65 18 10',
    '--color-error-50': '90 25 15',
    '--color-error-100': '120 35 22',
    '--color-error-200': '155 45 30',
    '--color-error-300': '185 60 40',
    '--color-error-400': '210 80 55',
    '--color-error-500': '230 115 90',
    '--color-error-600': '242 155 135',
    '--color-error-700': '248 190 175',
    '--color-error-800': '252 220 210',
    '--color-error-900': '254 237 232',
    '--color-error-950': '255 248 246',

    /* Success (earthy green-brown for dark mode) */
    '--color-success-0': '20 38 20',
    '--color-success-50': '30 55 28',
    '--color-success-100': '42 75 38',
    '--color-success-200': '55 95 50',
    '--color-success-300': '70 115 65',
    '--color-success-400': '85 135 80',
    '--color-success-500': '115 160 110',
    '--color-success-600': '150 185 145',
    '--color-success-700': '185 210 180',
    '--color-success-800': '215 230 210',
    '--color-success-900': '232 242 230',
    '--color-success-950': '245 250 245',

    /* Warning (warm amber-brown for dark mode) */
    '--color-warning-0': '70 45 15',
    '--color-warning-50': '100 65 20',
    '--color-warning-100': '135 85 28',
    '--color-warning-200': '170 110 35',
    '--color-warning-300': '200 135 45',
    '--color-warning-400': '225 155 55',
    '--color-warning-500': '240 180 85',
    '--color-warning-600': '248 200 120',
    '--color-warning-700': '252 220 165',
    '--color-warning-800': '254 235 205',
    '--color-warning-900': '255 245 230',
    '--color-warning-950': '255 251 245',

    /* Info (secondary-brown for dark mode) */
    '--color-info-0': '45 35 25',
    '--color-info-50': '60 46 32',
    '--color-info-100': '80 62 42',
    '--color-info-200': '100 80 55',
    '--color-info-300': '120 98 70',
    '--color-info-400': '139 115 85',
    '--color-info-500': '162 145 120',
    '--color-info-600': '185 167 145',
    '--color-info-700': '210 197 180',
    '--color-info-800': '230 221 210',
    '--color-info-900': '242 237 230',
    '--color-info-950': '250 248 245',

    /* Typography (warm brown tones for dark mode - inverted for readability) */
    '--color-typography-0': '30 24 20',
    '--color-typography-50': '45 35 28',
    '--color-typography-100': '61 46 34', // #3D2E22 - textPrimary
    '--color-typography-200': '85 70 60',
    '--color-typography-300': '107 91 79', // #6B5B4F - textSecondary
    '--color-typography-400': '130 115 105',
    '--color-typography-500': '155 139 127', // #9B8B7F - textMuted
    '--color-typography-600': '185 170 155',
    '--color-typography-700': '210 195 180',
    '--color-typography-800': '230 220 210',
    '--color-typography-900': '245 240 235',
    '--color-typography-950': '255 253 250',

    /* Outline (warm beige borders for dark mode) */
    '--color-outline-0': '40 35 30',
    '--color-outline-50': '60 50 42',
    '--color-outline-100': '85 72 60',
    '--color-outline-200': '115 100 85',
    '--color-outline-300': '145 130 110',
    '--color-outline-400': '175 160 140',
    '--color-outline-500': '200 185 165',
    '--color-outline-600': '220 205 185',
    '--color-outline-700': '235 225 210',
    '--color-outline-800': '245 239 230',
    '--color-outline-900': '250 247 242',
    '--color-outline-950': '255 253 250',

    /* Background (warm dark tones for dark mode) */
    '--color-background-0': '20 18 16',
    '--color-background-50': '30 26 22',
    '--color-background-100': '42 36 30',
    '--color-background-200': '55 48 40',
    '--color-background-300': '70 60 50',
    '--color-background-400': '90 78 65',
    '--color-background-500': '115 100 85',
    '--color-background-600': '145 130 110',
    '--color-background-700': '180 165 145',
    '--color-background-800': '215 200 180',
    '--color-background-900': '235 225 210',
    '--color-background-950': '250 247 242',

    /* Background Special (warm tinted backgrounds for dark mode) */
    '--color-background-error': '55 35 30',
    '--color-background-warning': '50 42 30',
    '--color-background-success': '32 45 32',
    '--color-background-muted': '42 36 30',
    '--color-background-info': '40 36 32',

    /* Focus Ring Indicator (for dark mode) */
    '--color-indicator-primary': '221 181 133',
    '--color-indicator-info': '162 145 120',
    '--color-indicator-error': '230 115 90',
  }),
};
