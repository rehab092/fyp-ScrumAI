export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cool-toned blue/teal/gray palette
        primary: '#4A5568', // Medium-dark blue-gray
        primaryDark: '#2D3748', // Dark blue-gray
        primaryLight: '#718096', // Light-medium blue-gray
        secondary: '#319795', // Medium teal
        secondaryDark: '#2C7A7B', // Medium-dark teal-blue
        accent: '#38B2AC', // Medium teal (brighter)
        accentDark: '#319795', // Medium teal
        // Background and surfaces
        background: '#FFFFFF', // Pure white
        surface: '#F7FAFC', // Very light gray
        surfaceDark: '#EDF2F7', // Light gray
        surfaceLight: '#FAFAFA', // Off-white
        // Text colors
        textPrimary: '#1A202C', // Dark blue-gray (almost charcoal)
        textSecondary: '#2D3748', // Dark navy blue
        textMuted: '#4A5568', // Medium-dark blue-gray
        // Borders
        border: '#E2E8F0', // Light gray
        borderDark: '#CBD5E0', // Medium gray
        // Status colors
        success: '#38B2AC', // Medium teal
        warning: '#ED8936', // Orange
        error: '#E53E3E', // Red
        info: '#3182CE', // Blue
        // Dark theme colors
        darkBackground: '#1A202C',
        darkSurface: '#2D3748',
        darkSurfaceDark: '#4A5568',
        darkTextPrimary: '#F7FAFC',
        darkTextSecondary: '#E2E8F0',
        darkTextMuted: '#CBD5E0',
        darkBorder: '#4A5568',
        darkBorderDark: '#718096',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(49, 151, 149, 0.15)",
      },
    },
  },
  plugins: [],
};
