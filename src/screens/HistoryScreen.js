/**
 * History Screen
 * Display scan history with search and filter capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const HistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [scanHistory, setScanHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScanHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, scanHistory]);

  const loadScanHistory = async () => {
    try {
      setLoading(true);
      // Load only real scanned data from AsyncStorage
      const historyData = await AsyncStorage.getItem('scanHistory');
      if (historyData) {
        const history = JSON.parse(historyData);
        // Sort by timestamp (newest first)
        setScanHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } else {
        // No scan history yet
        setScanHistory([]);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load scan history');
      setScanHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    if (!searchQuery.trim()) {
      setFilteredHistory(scanHistory);
      return;
    }

    const filtered = scanHistory.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const data = item.extractedData || {};
      return (
        data.idNumber?.toLowerCase().includes(searchLower) ||
        data.serialNumber?.toLowerCase().includes(searchLower) ||
        data.name?.toLowerCase().includes(searchLower) ||
        data.districtOfBirth?.toLowerCase().includes(searchLower) ||
        data.placeOfIssue?.toLowerCase().includes(searchLower) ||
        data.sex?.toLowerCase().includes(searchLower) ||
        data.dateOfBirth?.toLowerCase().includes(searchLower) ||
        data.dateOfIssue?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredHistory(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScanHistory();
    setRefreshing(false);
  };

  const handleItemPress = (item) => {
    navigation.navigate('Result', {
      scanData: {
        data: item.extractedData,
        confidence: item.extractedData?.confidence || 0.85,
        timestamp: item.timestamp
      },
      imageUri: item.imageUri,
      rawText: item.rawText
    });
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedHistory = scanHistory.filter(item => item.id !== itemId);
              setScanHistory(updatedHistory);
              await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const clearAllHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setScanHistory([]);
              await AsyncStorage.removeItem('scanHistory');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        {scanHistory.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllHistory}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID number, district, dates..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {item.extractedData?.name || 'Unknown Name'}
                  </Text>
                  <Text style={styles.itemDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>
                    ID: {item.extractedData?.idNumber || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Serial: {item.extractedData?.serialNumber || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    DOB: {item.extractedData?.dateOfBirth || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    District: {item.extractedData?.districtOfBirth || 'N/A'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching results' : 'No scan history'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Your scanned ID cards will appear here'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('Camera')}
              >
                <Text style={styles.scanButtonText}>📷 Start Scanning</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;
