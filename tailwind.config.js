/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 content paths
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────
      // Synced with constants/colors.ts and design/Tabylga Parts 1-2.html
      colors: {
        surface: {
          primary: '#F4F7FB',
          card: '#FFFFFF',
          inverse: '#111827',
          canvas: '#E9F3FF',
          raised: '#FDF7EF',
        },
        brand: {
          primary: '#1368F2',
          'primary-hover': '#0A4FCC',
          'primary-light': '#E7F0FF',
          cta: '#FF4F7B',
          'cta-hover': '#D93661',
          'cta-light': '#FFE6EE',
        },
        accent: {
          aqua: '#18C8B8',
          violet: '#775CFF',
          lemon: '#FFD166',
          mint: '#35C982',
          peach: '#FF9A5A',
        },
        status: {
          success: '#24B26B',
          'success-text': '#087846',
          'success-light': '#E0F8EC',
          warning: '#FFB82E',
          'warning-text': '#8A5900',
          'warning-dark': '#5A3900',
          'warning-light': '#FFF2CC',
          error: '#E5485D',
          'error-text': '#9E2334',
          'error-light': '#FFE2E8',
        },
        text: {
          primary: '#142033',
          secondary: '#607089',
          tertiary: '#98A6B8',
          'on-dark': '#F9FBFF',
          'on-primary': '#FFFFFF',
        },
        border: {
          divider: '#DCE6F2',
          input: '#C8D6E7',
          'input-focused': '#1368F2',
        },
      },

      // ── Font families ────────────────────────────────────────
      fontFamily: {
        'sans':             ['Inter_400Regular'],
        'sans-medium':      ['Inter_500Medium'],
        'sans-semibold':    ['Inter_600SemiBold'],
        'sans-bold':        ['Inter_700Bold'],
        'display':          ['Fraunces_500Medium'],
        'display-semibold': ['Fraunces_600SemiBold'],
      },

      // ── Font sizes ───────────────────────────────────────────
      fontSize: {
        xs: ['11px', { lineHeight: '14.3px' }],
        sm: ['12px', { lineHeight: '15.6px' }],
        base: ['13px', { lineHeight: '16.9px' }],
        md: ['14px', { lineHeight: '18.2px' }],
        body: ['15px', { lineHeight: '22.5px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '25.2px' }],
        '2xl': ['22px', { lineHeight: '26.4px' }],
        '3xl': ['28px', { lineHeight: '33.6px' }],
        '4xl': ['40px', { lineHeight: '44px' }],
        display: ['44px', { lineHeight: '48.4px' }],
      },

      // ── Spacing scale ────────────────────────────────────────
      spacing: {
        1: '4px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        4.5: '18px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
      },

      // ── Border radii ─────────────────────────────────────────
      borderRadius: {
        none: '0px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        card: '16px',
        xl: '22px',
        modal: '26px',
        pill: '999px',
        full: '9999px',
      },

      // ── Box shadows (web-side, for NativeWind web target) ────
      boxShadow: {
        card: '0 8px 22px rgba(19, 104, 242, 0.08)',
        'card-elevated': '0 18px 40px rgba(20, 32, 51, 0.14)',
        floating: '0 16px 28px rgba(255, 79, 123, 0.25)',
        modal: '0 -10px 34px rgba(20, 32, 51, 0.16)',
      },
    },
  },
  plugins: [],
};
