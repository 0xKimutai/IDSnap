/**
 * Home Screen - Enhanced Version
 * Main landing screen with full features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [scanCount, setScanCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadStats();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('appStats');
      if (stats) {
        const { totalScans, successfulScans } = JSON.parse(stats);
        setScanCount(totalScans || 0);
        setSuccessRate(totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0);
      }
    } catch (error) {
      console.log('Error loading stats:', error);
    }
  };

  const handleScanPress = () => {
    navigation.navigate('Camera');
  };

  const handleHistoryPress = () => {
    navigation.navigate('History');
  };



  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Header */}
        <View style={styles.welcomeSection}>
          <Text style={styles.appIcon}>📱</Text>
          <Text style={styles.title}>IDSnap Scanner</Text>
          <Text style={styles.subtitle}>
            Advanced OCR technology for instant ID card data extraction
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleScanPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>📷</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.primaryButtonText}>Scan ID Card</Text>
                <Text style={styles.buttonSubtext}>Take photo or choose from gallery</Text>
              </View>
              <Text style={styles.buttonArrow}>→</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleHistoryPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>📜</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.secondaryButtonText}>View History</Text>
                <Text style={styles.buttonSubtext}>Sample scans and results</Text>
              </View>
              <Text style={styles.buttonArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Statistics Dashboard */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{scanCount}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
              <View style={styles.statIndicator} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{successRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
        </View>

        {/* Features Showcase */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose IDSnap?</Text>
          
          <FeatureCard
            icon="🔍"
            title="High Accuracy OCR"
            description="Advanced ML algorithms ensure precise text extraction from various ID formats"
            color="#2196F3"
          />
          
          <FeatureCard
            icon="⚡"
            title="Lightning Fast"
            description="Process images in seconds with optimized recognition technology"
            color="#FF9800"
          />
          
          <FeatureCard
            icon="✏️"
            title="Edit & Verify"
            description="Review and correct extracted data before saving or printing"
            color="#9C27B0"
          />
          
          <FeatureCard
            icon="🔒"
            title="100% Private"
            description="All processing happens locally on your device - no data leaves your phone"
            color="#4CAF50"
          />
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <View style={styles.tipsList}>
            <TipItem 
              icon="💡"
              text="Use good lighting for best OCR results"
            />
            <TipItem 
              icon="📐"
              text="Keep ID cards flat and straight in frame"
            />
            <TipItem 
              icon="🖼️"
              text="Clean camera lens for sharper images"
            />
            <TipItem 
              icon="⏱️"
              text="Processing takes 2-5 seconds per scan"
            />
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, color }) => (
  <View style={[styles.featureCard, { borderLeftColor: color }]}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// Tip Item Component
const TipItem = ({ icon, text }) => (
  <View style={styles.tipItem}>
    <Text style={styles.tipIcon}>{icon}</Text>
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 40,
  },
  
  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  appIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Action Section
  actionSection: {
    padding: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  buttonArrow: {
    fontSize: 18,
    color: 'white',
    marginLeft: 8,
  },
  
  // Stats Section
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  statIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  
  // Features Section
  featuresSection: {
    padding: 20,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  
  // Tips Section
  tipsSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});

export default HomeScreen;