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
      const historyData = await AsyncStorage.getItem('@scan_history');
      if (historyData) {
        const history = JSON.parse(historyData);
        setScanHistory(history.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        // Add some mock history data for demonstration
        const mockHistory = [
          {
            id: '1',
            timestamp: Date.now() - 86400000, // 1 day ago
            data: {
              serialNumber: 'KE-12345678-9',
              idNumber: '12345678',
              dateOfBirth: '15/03/1985',
              sex: 'M',
              districtOfBirth: 'NAIROBI'
            },
            imageUri: 'https://via.placeholder.com/200x120/FF6B35/FFFFFF?text=ID+1'
          },
          {
            id: '2',
            timestamp: Date.now() - 172800000, // 2 days ago
            data: {
              serialNumber: 'KE-87654321-0',
              idNumber: '87654321',
              dateOfBirth: '22/07/1992',
              sex: 'F',
              districtOfBirth: 'MOMBASA'
            },
            imageUri: 'https://via.placeholder.com/200x120/4CAF50/FFFFFF?text=ID+2'
          },
          {
            id: '3',
            timestamp: Date.now() - 259200000, // 3 days ago
            data: {
              serialNumber: 'KE-11223344-5',
              idNumber: '11223344',
              dateOfBirth: '10/12/1988',
              sex: 'M',
              districtOfBirth: 'KISUMU'
            },
            imageUri: 'https://via.placeholder.com/200x120/2196F3/FFFFFF?text=ID+3'
          }
        ];
        setScanHistory(mockHistory);
        await AsyncStorage.setItem('@scan_history', JSON.stringify(mockHistory));
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load scan history');
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
      return (
        item.data.idNumber?.toLowerCase().includes(searchLower) ||
        item.data.serialNumber?.toLowerCase().includes(searchLower) ||
        item.data.districtOfBirth?.toLowerCase().includes(searchLower) ||
        item.data.sex?.toLowerCase().includes(searchLower)
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
        data: item.data,
        confidence: {
          serialNumber: 0.95,
          idNumber: 0.98,
          dateOfBirth: 0.92,
          sex: 0.99,
          districtOfBirth: 0.88
        },
        timestamp: item.timestamp
      },
      imageUri: item.imageUri
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
              await AsyncStorage.setItem('@scan_history', JSON.stringify(updatedHistory));
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
              await AsyncStorage.removeItem('@scan_history');
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
          placeholder="Search by ID number, district, etc..."
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
                    ID: {item.data.idNumber || 'Unknown'}
                  </Text>
                  <Text style={styles.itemDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>
                    Serial: {item.data.serialNumber || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    DOB: {item.data.dateOfBirth || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    District: {item.data.districtOfBirth || 'N/A'}
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
