/**
 * Button Component
 * Reusable button component with various styles and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Button component with multiple variants and states
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Button component
 */
const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  style = {},
  textStyle = {},
  testID,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={getIconColor(variant, disabled, colors)}
          style={styles.loadingIcon}
        />
      );
    }

    if (icon) {
      return (
        <Icon
          name={icon}
          size={getIconSize(size)}
          color={getIconColor(variant, disabled, colors)}
          style={[
            iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
          ]}
        />
      );
    }

    return null;
  };

  const renderContent = () => {
    if (loading && !title) {
      return renderIcon();
    }

    return (
      <View style={styles.content}>
        {iconPosition === 'left' && renderIcon()}
        {title && <Text style={textStyles}>{title}</Text>}
        {iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

/**
 * Get icon size based on button size
 * @param {string} size - Button size
 * @returns {number} - Icon size
 */
const getIconSize = (size) => {
  switch (size) {
    case 'small':
      return 16;
    case 'large':
      return 24;
    case 'medium':
    default:
      return 20;
  }
};

/**
 * Get icon color based on variant and disabled state
 * @param {string} variant - Button variant
 * @param {boolean} disabled - Disabled state
 * @param {Object} colors - Theme colors
 * @returns {string} - Icon color
 */
const getIconColor = (variant, disabled, colors) => {
  if (disabled) {
    return colors.buttonTextDisabled;
  }

  switch (variant) {
    case 'outline':
    case 'ghost':
      return colors.primary;
    case 'secondary':
      return colors.textOnSecondary;
    case 'danger':
      return colors.white;
    case 'primary':
    default:
      return colors.buttonText;
  }
};

const createStyles = (colors) => StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  danger: {
    backgroundColor: colors.error,
  },
  success: {
    backgroundColor: colors.success,
  },

  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },

  // Text variants
  primaryText: {
    color: colors.buttonText,
  },
  secondaryText: {
    color: colors.textOnSecondary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },
  successText: {
    color: colors.white,
  },

  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // States
  disabled: {
    backgroundColor: colors.buttonDisabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: colors.buttonTextDisabled,
  },
  loading: {
    opacity: 0.8,
  },
});

// Specialized button components

/**
 * Primary button (default styling)
 */
export const PrimaryButton = (props) => (
  <Button variant="primary" {...props} />
);

/**
 * Secondary button
 */
export const SecondaryButton = (props) => (
  <Button variant="secondary" {...props} />
);

/**
 * Outline button
 */
export const OutlineButton = (props) => (
  <Button variant="outline" {...props} />
);

/**
 * Ghost button (transparent background)
 */
export const GhostButton = (props) => (
  <Button variant="ghost" {...props} />
);

/**
 * Danger button (for destructive actions)
 */
export const DangerButton = (props) => (
  <Button variant="danger" {...props} />
);

/**
 * Success button
 */
export const SuccessButton = (props) => (
  <Button variant="success" {...props} />
);

/**
 * Icon-only button
 */
export const IconButton = ({ icon, size = 'medium', ...props }) => (
  <Button
    icon={icon}
    size={size}
    style={[
      {
        width: size === 'small' ? 32 : size === 'large' ? 56 : 44,
        height: size === 'small' ? 32 : size === 'large' ? 56 : 44,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    ]}
    {...props}
  />
);

/**
 * Floating Action Button
 */
export const FAB = ({ icon, onPress, style, ...props }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        {
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: colors.black,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      <Icon name={icon} size={24} color={colors.white} />
    </TouchableOpacity>
  );
};

export default Button;
