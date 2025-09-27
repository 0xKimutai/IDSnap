/**
 * Card Component
 * Reusable card component with various styles and layouts
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

/**
 * Basic card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Card component
 */
const Card = ({
  children,
  style = {},
  onPress = null,
  disabled = false,
  elevation = 2,
  borderRadius = 8,
  padding = 16,
  margin = 8,
  backgroundColor = null,
  ...props
}) => {
  const { colors } = useTheme();
  const defaultBackgroundColor = backgroundColor || colors.cardBackground;
  const styles = createStyles(colors);
  
  const cardStyles = [
    styles.card,
    {
      elevation,
      borderRadius,
      padding,
      margin,
      backgroundColor: defaultBackgroundColor,
      shadowColor: colors.cardShadow,
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: elevation,
    },
    disabled && styles.disabled,
    style,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

/**
 * Card header component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - CardHeader component
 */
export const CardHeader = ({
  title,
  subtitle = null,
  icon = null,
  iconColor = null,
  rightElement = null,
  style = {},
  titleStyle = {},
  subtitleStyle = {},
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const defaultIconColor = iconColor || colors.primary;
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {icon && (
          <Icon
            name={icon}
            size={24}
            color={defaultIconColor}
            style={styles.headerIcon}
          />
        )}
        <View style={styles.headerText}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement && (
        <View style={styles.headerRight}>{rightElement}</View>
      )}
    </View>
  );
};

/**
 * Card content component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - CardContent component
 */
export const CardContent = ({ children, style = {} }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.content, style]}>{children}</View>;
};

/**
 * Card footer component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - CardFooter component
 */
export const CardFooter = ({ children, style = {} }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.footer, style]}>{children}</View>;
};

/**
 * Scan result card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - ScanResultCard component
 */
export const ScanResultCard = ({
  scanData,
  onPress = null,
  onEdit = null,
  onDelete = null,
  onShare = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { data, timestamp, qualityReport, metadata } = scanData;
  const formattedDate = new Date(timestamp).toLocaleDateString();
  const formattedTime = new Date(timestamp).toLocaleTimeString();

  return (
    <Card style={[styles.scanCard, style]} onPress={onPress}>
      <CardHeader
        title={data.fullName || 'Unknown Name'}
        subtitle={`${formattedDate} at ${formattedTime}`}
        icon="credit-card"
        rightElement={
          <View style={styles.scanCardActions}>
            {onShare && (
              <TouchableOpacity onPress={() => onShare(scanData)}>
                <Icon name="share" size={20} color={colors.gray} />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(scanData)}
                style={styles.actionButton}
              >
                <Icon name="edit" size={20} color={colors.gray} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(scanData)}
                style={styles.actionButton}
              >
                <Icon name="delete" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <CardContent>
        <View style={styles.scanDetails}>
          {data.idNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Number:</Text>
              <Text style={styles.detailValue}>{data.idNumber}</Text>
            </View>
          )}
          {data.dateOfBirth && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth:</Text>
              <Text style={styles.detailValue}>{data.dateOfBirth}</Text>
            </View>
          )}
          {qualityReport && (
            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityLabel}>Quality:</Text>
              <View
                style={[
                  styles.qualityBadge,
                  {
                    backgroundColor: getQualityColor(qualityReport.score, colors),
                  },
                ]}
              >
                <Text style={styles.qualityText}>
                  {qualityReport.level}
                </Text>
              </View>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
};

/**
 * Image card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - ImageCard component
 */
export const ImageCard = ({
  imageUri,
  title = null,
  subtitle = null,
  onPress = null,
  style = {},
  imageStyle = {},
  overlayContent = null,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Card style={[styles.imageCard, style]} onPress={onPress} padding={0}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.cardImage, imageStyle]}
          resizeMode="cover"
        />
        {overlayContent && (
          <View style={styles.imageOverlay}>{overlayContent}</View>
        )}
      </View>
      {(title || subtitle) && (
        <View style={styles.imageCardContent}>
          {title && <Text style={styles.imageCardTitle}>{title}</Text>}
          {subtitle && (
            <Text style={styles.imageCardSubtitle}>{subtitle}</Text>
          )}
        </View>
      )}
    </Card>
  );
};

/**
 * Stats card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - StatsCard component
 */
export const StatsCard = ({
  title,
  value,
  icon = null,
  color = null,
  subtitle = null,
  trend = null,
  onPress = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const defaultColor = color || colors.primary;
  return (
    <Card style={[styles.statsCard, style]} onPress={onPress}>
      <View style={styles.statsHeader}>
        {icon && (
          <View style={[styles.statsIcon, { backgroundColor: `${defaultColor}20` }]}>
            <Icon name={icon} size={24} color={defaultColor} />
          </View>
        )}
        <View style={styles.statsContent}>
          <Text style={styles.statsTitle}>{title}</Text>
          <Text style={[styles.statsValue, { color: defaultColor }]}>{value}</Text>
          {subtitle && (
            <Text style={styles.statsSubtitle}>{subtitle}</Text>
          )}
        </View>
        {trend && (
          <View style={styles.statsTrend}>
            <Icon
              name={trend > 0 ? 'trending-up' : 'trending-down'}
              size={20}
              color={trend > 0 ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend > 0 ? colors.success : colors.error },
              ]}
            >
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

/**
 * Get quality color based on score
 * @param {number} score - Quality score (0-1)
 * @param {Object} colors - Theme colors
 * @returns {string} - Color
 */
const getQualityColor = (score, colors) => {
  if (score >= 0.8) return colors.success;
  if (score >= 0.6) return colors.warning;
  return colors.error;
};

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  disabled: {
    opacity: 0.6,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Content styles
  content: {
    marginBottom: 12,
  },

  // Footer styles
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  // Scan result card styles
  scanCard: {
    marginBottom: 12,
  },
  scanCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  scanDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qualityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },

  // Image card styles
  imageCard: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCardContent: {
    padding: 16,
  },
  imageCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  imageCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Stats card styles
  statsCard: {
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsTrend: {
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default Card;
