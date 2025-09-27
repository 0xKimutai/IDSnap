/**
 * DataField Component
 * Reusable component for displaying and editing ID card data fields
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/colors';

/**
 * Data field component for displaying and editing extracted data
 * @param {Object} props - Component props
 * @returns {JSX.Element} - DataField component
 */
const DataField = ({
  label,
  value,
  onValueChange = null,
  editable = false,
  required = false,
  error = null,
  confidence = null,
  placeholder = '',
  multiline = false,
  keyboardType = 'default',
  maxLength = null,
  icon = null,
  style = {},
  labelStyle = {},
  inputStyle = {},
  onFocus = null,
  onBlur = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const handleEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onValueChange && localValue !== value) {
      onValueChange(localValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalValue(value || '');
  };

  const getConfidenceColor = () => {
    if (!confidence) return COLORS.gray;
    if (confidence >= 0.8) return COLORS.success;
    if (confidence >= 0.6) return COLORS.warning;
    return COLORS.error;
  };

  const getConfidenceText = () => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label with confidence indicator */}
      <View style={styles.labelContainer}>
        <View style={styles.labelLeft}>
          {icon && (
            <Icon
              name={icon}
              size={16}
              color={COLORS.primary}
              style={styles.labelIcon}
            />
          )}
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
        
        <View style={styles.labelRight}>
          {confidence !== null && (
            <View style={styles.confidenceContainer}>
              <View
                style={[
                  styles.confidenceDot,
                  { backgroundColor: getConfidenceColor() },
                ]}
              />
              <Text style={styles.confidenceText}>
                {getConfidenceText()}
              </Text>
            </View>
          )}
          
          {editable && !isEditing && (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Icon name="edit" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Value/Input field */}
      <View style={styles.valueContainer}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[
                styles.input,
                multiline && styles.multilineInput,
                error && styles.inputError,
                inputStyle,
              ]}
              value={localValue}
              onChangeText={setLocalValue}
              placeholder={placeholder}
              multiline={multiline}
              keyboardType={keyboardType}
              maxLength={maxLength}
              autoFocus
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.actionButton, styles.cancelButton]}
              >
                <Icon name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.actionButton, styles.saveButton]}
              >
                <Icon name="check" size={16} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={editable ? handleEdit : null}
            style={[
              styles.valueDisplay,
              editable && styles.editableValue,
              !value && styles.emptyValue,
            ]}
          >
            <Text
              style={[
                styles.valueText,
                !value && styles.emptyValueText,
              ]}
              numberOfLines={multiline ? undefined : 1}
            >
              {value || placeholder || 'No data'}
            </Text>
            {editable && (
              <Icon
                name="edit"
                size={14}
                color={COLORS.gray}
                style={styles.editIcon}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Read-only data field component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - ReadOnlyDataField component
 */
export const ReadOnlyDataField = (props) => (
  <DataField {...props} editable={false} />
);

/**
 * Editable data field component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - EditableDataField component
 */
export const EditableDataField = (props) => (
  <DataField {...props} editable={true} />
);

/**
 * Data field group component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - DataFieldGroup component
 */
export const DataFieldGroup = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  style = {},
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <View style={[styles.group, style]}>
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={collapsible ? () => setCollapsed(!collapsed) : null}
        disabled={!collapsible}
      >
        <Text style={styles.groupTitle}>{title}</Text>
        {collapsible && (
          <Icon
            name={collapsed ? 'expand-more' : 'expand-less'}
            size={24}
            color={COLORS.primary}
          />
        )}
      </TouchableOpacity>
      {!collapsed && (
        <View style={styles.groupContent}>{children}</View>
      )}
    </View>
  );
};

/**
 * Data summary component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - DataSummary component
 */
export const DataSummary = ({
  data,
  onFieldEdit = null,
  showConfidence = true,
  style = {},
}) => {
  const fieldLabels = {
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    idNumber: 'ID Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    nationality: 'Nationality',
    issueDate: 'Issue Date',
    expiryDate: 'Expiry Date',
    phoneNumber: 'Phone Number',
    email: 'Email',
  };

  const fieldIcons = {
    fullName: 'person',
    firstName: 'person',
    lastName: 'person',
    idNumber: 'credit-card',
    dateOfBirth: 'cake',
    gender: 'wc',
    address: 'location-on',
    nationality: 'flag',
    issueDate: 'date-range',
    expiryDate: 'event',
    phoneNumber: 'phone',
    email: 'email',
  };

  return (
    <View style={[styles.summary, style]}>
      {Object.entries(data).map(([key, value]) => {
        if (!value) return null;
        
        return (
          <DataField
            key={key}
            label={fieldLabels[key] || key}
            value={value}
            icon={fieldIcons[key]}
            editable={!!onFieldEdit}
            onValueChange={(newValue) => onFieldEdit?.(key, newValue)}
            confidence={showConfidence ? data.confidence?.[key] : null}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  // Label styles
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  required: {
    color: COLORS.error,
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Confidence indicator
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  
  // Edit button
  editButton: {
    padding: 4,
  },
  
  // Value container
  valueContainer: {
    marginBottom: 4,
  },
  
  // Value display
  valueDisplay: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editableValue: {
    backgroundColor: COLORS.white,
  },
  emptyValue: {
    backgroundColor: COLORS.grayLight,
  },
  valueText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  emptyValueText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  editIcon: {
    marginLeft: 8,
  },
  
  // Input styles
  editContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  
  // Edit actions
  editActions: {
    flexDirection: 'column',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.errorLight,
  },
  saveButton: {
    backgroundColor: COLORS.successLight,
  },
  
  // Error styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
  },
  
  // Group styles
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  groupContent: {
    paddingHorizontal: 8,
  },
  
  // Summary styles
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

export default DataField;
