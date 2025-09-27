/**
 * Color constants for the ID Card Scanner App
 * Provides a consistent color palette throughout the application
 */

export const COLORS = {
  // Primary colors
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  
  // Secondary colors
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFE0B2',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#C8E6C9',
  warning: '#FF9800',
  warningLight: '#FFE0B2',
  error: '#F44336',
  errorLight: '#FFCDD2',
  info: '#2196F3',
  infoLight: '#BBDEFB',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#F5F5F5',
  grayDark: '#424242',
  
  // Background colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#000000',
  
  // Camera overlay colors
  cameraOverlay: 'rgba(0, 0, 0, 0.6)',
  cameraFrame: '#00FF00',
  cameraFrameActive: '#FF0000',
  
  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Button colors
  buttonPrimary: '#2196F3',
  buttonSecondary: '#FF9800',
  buttonDisabled: '#BDBDBD',
  buttonText: '#FFFFFF',
  buttonTextDisabled: '#757575',
};

// Theme variants
export const THEMES = {
  light: {
    ...COLORS,
    statusBar: 'dark-content',
  },
  dark: {
    ...COLORS,
    primary: '#90CAF9',
    primaryDark: '#42A5F5',
    primaryLight: '#1E3A8A',
    secondary: '#FFB74D',
    secondaryDark: '#FFA726',
    secondaryLight: '#8B4513',
    success: '#81C784',
    successLight: '#2E7D32',
    warning: '#FFB74D',
    warningLight: '#8B4513',
    error: '#E57373',
    errorLight: '#C62828',
    info: '#64B5F6',
    infoLight: '#1E3A8A',
    gray: '#BDBDBD',
    grayLight: '#424242',
    grayDark: '#212121',
    background: '#121212',
    surface: '#1E1E1E',
    overlay: 'rgba(0, 0, 0, 0.8)',
    textPrimary: '#FFFFFF',
    textSecondary: '#BDBDBD',
    textDisabled: '#757575',
    textOnPrimary: '#000000',
    textOnSecondary: '#FFFFFF',
    cameraOverlay: 'rgba(0, 0, 0, 0.8)',
    cameraFrame: '#81C784',
    cameraFrameActive: '#FFB74D',
    cardBackground: '#1E1E1E',
    cardBorder: '#424242',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    buttonPrimary: '#90CAF9',
    buttonSecondary: '#FFB74D',
    buttonDisabled: '#424242',
    buttonText: '#000000',
    buttonTextDisabled: '#757575',
    statusBar: 'light-content',
  },
};

export default COLORS;
