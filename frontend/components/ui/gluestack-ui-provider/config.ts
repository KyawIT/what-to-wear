'use client';
import { vars } from 'nativewind';

// Logo colors
// Red:    #FE6868  -> 254 104 104
// Indigo: #676FFF  -> 103 111 255

export const config = {
  light: vars({
    /* Primary (Red) */
    '--color-primary-0': '255 245 245',
    '--color-primary-50': '255 235 235',
    '--color-primary-100': '255 220 220',
    '--color-primary-200': '255 195 195',
    '--color-primary-300': '255 165 165',
    '--color-primary-400': '254 132 132',
    '--color-primary-500': '254 104 104', // FE6868
    '--color-primary-600': '236 84 84',
    '--color-primary-700': '210 62 62',
    '--color-primary-800': '175 43 43',
    '--color-primary-900': '132 28 28',
    '--color-primary-950': '90 18 18',

    /* Secondary (Indigo) */
    '--color-secondary-0': '245 246 255',
    '--color-secondary-50': '234 236 255',
    '--color-secondary-100': '220 223 255',
    '--color-secondary-200': '195 200 255',
    '--color-secondary-300': '166 173 255',
    '--color-secondary-400': '135 144 255',
    '--color-secondary-500': '103 111 255', // 676FFF
    '--color-secondary-600': '86 93 240',
    '--color-secondary-700': '69 73 210',
    '--color-secondary-800': '53 56 170',
    '--color-secondary-900': '39 41 125',
    '--color-secondary-950': '26 27 80',

    /* Tertiary (Warm accent / peachy) */
    '--color-tertiary-0': '255 250 245',
    '--color-tertiary-50': '255 243 235',
    '--color-tertiary-100': '255 233 220',
    '--color-tertiary-200': '255 214 190',
    '--color-tertiary-300': '255 190 155',
    '--color-tertiary-400': '255 165 120',
    '--color-tertiary-500': '250 140 90',
    '--color-tertiary-600': '230 115 70',
    '--color-tertiary-700': '200 90 55',
    '--color-tertiary-800': '155 65 40',
    '--color-tertiary-900': '115 45 30',
    '--color-tertiary-950': '80 30 22',

    /* Error (use primary-red family but slightly deeper for contrast) */
    '--color-error-0': '254 233 233',
    '--color-error-50': '254 226 226',
    '--color-error-100': '254 202 202',
    '--color-error-200': '252 165 165',
    '--color-error-300': '248 113 113',
    '--color-error-400': '239 68 68',
    '--color-error-500': '230 53 53',
    '--color-error-600': '220 38 38',
    '--color-error-700': '185 28 28',
    '--color-error-800': '153 27 27',
    '--color-error-900': '127 29 29',
    '--color-error-950': '83 19 19',

    /* Success (clean green) */
    '--color-success-0': '228 255 244',
    '--color-success-50': '202 255 232',
    '--color-success-100': '162 241 192',
    '--color-success-200': '132 211 162',
    '--color-success-300': '102 181 132',
    '--color-success-400': '72 151 102',
    '--color-success-500': '52 131 82',
    '--color-success-600': '42 121 72',
    '--color-success-700': '32 111 62',
    '--color-success-800': '22 101 52',
    '--color-success-900': '20 83 45',
    '--color-success-950': '27 50 36',

    /* Warning (amber) */
    '--color-warning-0': '255 249 245',
    '--color-warning-50': '255 244 236',
    '--color-warning-100': '255 231 213',
    '--color-warning-200': '254 205 170',
    '--color-warning-300': '253 173 116',
    '--color-warning-400': '251 149 75',
    '--color-warning-500': '231 120 40',
    '--color-warning-600': '215 108 31',
    '--color-warning-700': '180 90 26',
    '--color-warning-800': '130 68 23',
    '--color-warning-900': '108 56 19',
    '--color-warning-950': '84 45 18',

    /* Info (use secondary-indigo family) */
    '--color-info-0': '245 246 255',
    '--color-info-50': '234 236 255',
    '--color-info-100': '220 223 255',
    '--color-info-200': '195 200 255',
    '--color-info-300': '166 173 255',
    '--color-info-400': '135 144 255',
    '--color-info-500': '103 111 255', // same as secondary 500
    '--color-info-600': '86 93 240',
    '--color-info-700': '69 73 210',
    '--color-info-800': '53 56 170',
    '--color-info-900': '39 41 125',
    '--color-info-950': '26 27 80',

    /* Typography (neutral slate) */
    '--color-typography-0': '255 255 255',
    '--color-typography-50': '247 247 247',
    '--color-typography-100': '240 240 241',
    '--color-typography-200': '228 228 230',
    '--color-typography-300': '212 212 214',
    '--color-typography-400': '163 163 168',
    '--color-typography-500': '120 120 128',
    '--color-typography-600': '92 92 100',
    '--color-typography-700': '66 66 74',
    '--color-typography-800': '40 40 47',
    '--color-typography-900': '24 24 30',
    '--color-typography-950': '12 12 16',

    /* Outline (neutral) */
    '--color-outline-0': '255 255 255',
    '--color-outline-50': '242 242 244',
    '--color-outline-100': '230 230 233',
    '--color-outline-200': '216 216 220',
    '--color-outline-300': '200 200 206',
    '--color-outline-400': '160 160 168',
    '--color-outline-500': '125 125 134',
    '--color-outline-600': '98 98 108',
    '--color-outline-700': '72 72 82',
    '--color-outline-800': '52 52 62',
    '--color-outline-900': '34 34 42',
    '--color-outline-950': '22 22 28',

    /* Background */
    '--color-background-0': '255 255 255',
    '--color-background-50': '249 249 250',
    '--color-background-100': '244 244 246',
    '--color-background-200': '234 234 238',
    '--color-background-300': '220 220 226',
    '--color-background-400': '180 180 190',
    '--color-background-500': '140 140 152',
    '--color-background-600': '110 110 122',
    '--color-background-700': '78 78 90',
    '--color-background-800': '44 44 54',
    '--color-background-900': '24 24 32',
    '--color-background-950': '14 14 20',

    /* Background Special */
    '--color-background-error': '254 241 241',
    '--color-background-warning': '255 243 234',
    '--color-background-success': '237 252 242',
    '--color-background-muted': '246 246 248',
    '--color-background-info': '238 240 255',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '254 104 104', // primary 500
    '--color-indicator-info': '103 111 255', // secondary 500
    '--color-indicator-error': '185 28 28',
  }),

  dark: vars({
    /* Primary (Red) - flipped for dark */
    '--color-primary-0': '90 18 18',
    '--color-primary-50': '132 28 28',
    '--color-primary-100': '175 43 43',
    '--color-primary-200': '210 62 62',
    '--color-primary-300': '236 84 84',
    '--color-primary-400': '254 104 104', // FE6868
    '--color-primary-500': '254 132 132',
    '--color-primary-600': '255 165 165',
    '--color-primary-700': '255 195 195',
    '--color-primary-800': '255 220 220',
    '--color-primary-900': '255 235 235',
    '--color-primary-950': '255 245 245',

    /* Secondary (Indigo) - flipped for dark */
    '--color-secondary-0': '26 27 80',
    '--color-secondary-50': '39 41 125',
    '--color-secondary-100': '53 56 170',
    '--color-secondary-200': '69 73 210',
    '--color-secondary-300': '86 93 240',
    '--color-secondary-400': '103 111 255', // 676FFF
    '--color-secondary-500': '135 144 255',
    '--color-secondary-600': '166 173 255',
    '--color-secondary-700': '195 200 255',
    '--color-secondary-800': '220 223 255',
    '--color-secondary-900': '234 236 255',
    '--color-secondary-950': '245 246 255',

    /* Tertiary */
    '--color-tertiary-0': '80 30 22',
    '--color-tertiary-50': '115 45 30',
    '--color-tertiary-100': '155 65 40',
    '--color-tertiary-200': '200 90 55',
    '--color-tertiary-300': '230 115 70',
    '--color-tertiary-400': '250 140 90',
    '--color-tertiary-500': '255 165 120',
    '--color-tertiary-600': '255 190 155',
    '--color-tertiary-700': '255 214 190',
    '--color-tertiary-800': '255 233 220',
    '--color-tertiary-900': '255 243 235',
    '--color-tertiary-950': '255 250 245',

    /* Error */
    '--color-error-0': '83 19 19',
    '--color-error-50': '127 29 29',
    '--color-error-100': '153 27 27',
    '--color-error-200': '185 28 28',
    '--color-error-300': '220 38 38',
    '--color-error-400': '230 53 53',
    '--color-error-500': '239 68 68',
    '--color-error-600': '249 97 96',
    '--color-error-700': '229 91 90',
    '--color-error-800': '254 202 202',
    '--color-error-900': '254 226 226',
    '--color-error-950': '254 233 233',

    /* Success */
    '--color-success-0': '27 50 36',
    '--color-success-50': '20 83 45',
    '--color-success-100': '22 101 52',
    '--color-success-200': '32 111 62',
    '--color-success-300': '42 121 72',
    '--color-success-400': '52 131 82',
    '--color-success-500': '72 151 102',
    '--color-success-600': '102 181 132',
    '--color-success-700': '132 211 162',
    '--color-success-800': '162 241 192',
    '--color-success-900': '202 255 232',
    '--color-success-950': '228 255 244',

    /* Warning */
    '--color-warning-0': '84 45 18',
    '--color-warning-50': '108 56 19',
    '--color-warning-100': '130 68 23',
    '--color-warning-200': '180 90 26',
    '--color-warning-300': '215 108 31',
    '--color-warning-400': '231 120 40',
    '--color-warning-500': '251 149 75',
    '--color-warning-600': '253 173 116',
    '--color-warning-700': '254 205 170',
    '--color-warning-800': '255 231 213',
    '--color-warning-900': '255 244 237',
    '--color-warning-950': '255 249 245',

    /* Info (secondary) */
    '--color-info-0': '26 27 80',
    '--color-info-50': '39 41 125',
    '--color-info-100': '53 56 170',
    '--color-info-200': '69 73 210',
    '--color-info-300': '86 93 240',
    '--color-info-400': '103 111 255',
    '--color-info-500': '135 144 255',
    '--color-info-600': '166 173 255',
    '--color-info-700': '195 200 255',
    '--color-info-800': '220 223 255',
    '--color-info-900': '234 236 255',
    '--color-info-950': '245 246 255',

    /* Typography (neutral) */
    '--color-typography-0': '12 12 16',
    '--color-typography-50': '24 24 30',
    '--color-typography-100': '40 40 47',
    '--color-typography-200': '66 66 74',
    '--color-typography-300': '92 92 100',
    '--color-typography-400': '120 120 128',
    '--color-typography-500': '163 163 168',
    '--color-typography-600': '212 212 214',
    '--color-typography-700': '228 228 230',
    '--color-typography-800': '240 240 241',
    '--color-typography-900': '247 247 247',
    '--color-typography-950': '255 255 255',

    /* Outline */
    '--color-outline-0': '22 22 28',
    '--color-outline-50': '34 34 42',
    '--color-outline-100': '52 52 62',
    '--color-outline-200': '72 72 82',
    '--color-outline-300': '98 98 108',
    '--color-outline-400': '125 125 134',
    '--color-outline-500': '160 160 168',
    '--color-outline-600': '200 200 206',
    '--color-outline-700': '216 216 220',
    '--color-outline-800': '230 230 233',
    '--color-outline-900': '242 242 244',
    '--color-outline-950': '255 255 255',

    /* Background (true dark) */
    '--color-background-0': '14 14 20',
    '--color-background-50': '24 24 32',
    '--color-background-100': '44 44 54',
    '--color-background-200': '78 78 90',
    '--color-background-300': '110 110 122',
    '--color-background-400': '140 140 152',
    '--color-background-500': '180 180 190',
    '--color-background-600': '220 220 226',
    '--color-background-700': '234 234 238',
    '--color-background-800': '244 244 246',
    '--color-background-900': '249 249 250',
    '--color-background-950': '255 255 255',

    /* Background Special */
    '--color-background-error': '66 43 43',
    '--color-background-warning': '65 47 35',
    '--color-background-success': '28 43 33',
    '--color-background-muted': '34 34 42',
    '--color-background-info': '30 32 60',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '254 132 132',
    '--color-indicator-info': '135 144 255',
    '--color-indicator-error': '232 70 69',
  }),
};
