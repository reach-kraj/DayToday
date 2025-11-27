export const colors = {
  primary: '#2563EB', // Blue 600
  primaryDark: '#1E40AF', // Blue 800
  secondary: '#64748B', // Slate 500
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  success: '#22C55E', // Green 500
  danger: '#EF4444', // Red 500
  warning: '#F59E0B', // Amber 500
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 34, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 }, // Large Title
  h2: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 }, // Title 1
  h3: { fontSize: 22, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.5 }, // Title 2
  h4: { fontSize: 20, fontWeight: '600' as const, color: colors.text }, // Title 3
  body: { fontSize: 17, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  bodyBold: { fontSize: 17, fontWeight: '600' as const, color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  button: { fontSize: 17, fontWeight: '600' as const, color: 'white' },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
};
