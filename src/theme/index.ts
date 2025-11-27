export const colors = {
  // Vibrant gradient backgrounds
  backgroundGradientStart: '#667eea',
  backgroundGradientEnd: '#764ba2',
  
  // Glass surfaces - more transparent for stronger effect
  glass: 'rgba(255, 255, 255, 0.15)',
  glassStrong: 'rgba(255, 255, 255, 0.3)',
  
  // Borders - brighter for reflective effect
  borderGlass: 'rgba(255, 255, 255, 0.7)',
  
  // Primary colors
  primary: '#667eea',
  primaryDark: '#5568d3',
  secondary: '#64748B',
  
  // Accent
  accent: '#f093fb',
  
  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textOnGlass: '#FFFFFF',
  
  // Utility
  border: '#E2E8F0',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
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
  h1: { fontSize: 34, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h3: { fontSize: 22, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.5 },
  h4: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 17, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  bodyBold: { fontSize: 17, fontWeight: '600' as const, color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  button: { fontSize: 17, fontWeight: '600' as const, color: 'white' },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glass: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  glassStrong: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 16,
  },
};

export const glassCard = {
  backgroundColor: colors.glass,
  borderRadius: 24,
  borderWidth: 2,
  borderColor: colors.borderGlass,
  ...shadows.glass,
  overflow: 'hidden' as const,
};
