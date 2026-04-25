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
          primary: '#F7F6F2',
          card: '#FFFFFF',
          inverse: '#1A1A1A',
          canvas: '#EFEFEA',
        },
        brand: {
          primary: '#1E4D6B',
          'primary-hover': '#163A52',
          'primary-light': '#E8EEF2',
          cta: '#C65D3A',
          'cta-hover': '#A84A2B',
          'cta-light': '#FBEEE8',
        },
        status: {
          success: '#7A9B6E',
          'success-text': '#4a6b40',
          'success-light': '#EDF2EA',
          warning: '#D4A574',
          'warning-text': '#8a6530',
          'warning-dark': '#5a3a00',
          'warning-light': '#FAF4EA',
          error: '#B84A3E',
          'error-text': '#8a3a30',
          'error-light': '#F8EAE8',
        },
        text: {
          primary: '#2A2922',
          secondary: '#7A7A6E',
          tertiary: '#9B9B95',
          'on-dark': '#FAFAF7',
          'on-primary': '#FFFFFF',
        },
        border: {
          divider: '#E8E8E3',
          input: '#D4D4CF',
          'input-focused': '#1E4D6B',
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
        xl: '24px',
        modal: '24px',
        pill: '999px',
        full: '9999px',
      },

      // ── Box shadows (web-side, for NativeWind web target) ────
      boxShadow: {
        card: '0 2px 8px rgba(26, 26, 26, 0.04)',
        'card-elevated': '0 8px 24px rgba(26, 26, 26, 0.08)',
        floating: '0 8px 16px rgba(198, 93, 58, 0.25)',
        modal: '0 -4px 24px rgba(26, 26, 26, 0.12)',
      },
    },
  },
  plugins: [],
};
