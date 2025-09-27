/**
 * IDSnap - ID Card Scanner App
 * Simplified main App component without problematic dependencies
 */

import React, { useState, useEffect } from 'react';
import { 
  StatusBar, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  BackHandler, 
  StyleSheet 
} from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ThemeProvider } from './src/context/ThemeContext';

type Screen = 'Home' | 'Camera' | 'Result' | 'History';

interface Navigation {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => boolean;
}

interface OCRData {
  name?: string;
  idNumber?: string;
  dateOfBirth?: string;
  address?: string;
  issueDate?: string;
  expiryDate?: string;
}

interface RouteParams {
  imageUri?: string;
  ocrData?: OCRData;
}

interface ScreenStackItem {
  screen: Screen;
  params: any;
}

const App = (): React.JSX.Element => {
  const [screenStack, setScreenStack] = useState<ScreenStackItem[]>([
    { screen: 'Home', params: {} }
  ]);
  
  const currentScreen = screenStack[screenStack.length - 1].screen;
  const routeParams = screenStack[screenStack.length - 1].params;

  const navigation: Navigation = {
    navigate: (screen: Screen, params: any = {}) => {
      // Don't navigate if we're already on this screen with the same params
      if (currentScreen === screen && JSON.stringify(routeParams) === JSON.stringify(params)) {
        return;
      }
      
      setScreenStack(prev => [...prev, { screen, params }]);
    },
    goBack: () => {
      if (screenStack.length > 1) {
        setScreenStack(prev => {
          const newStack = [...prev];
          newStack.pop();
          return newStack;
        });
        return true; // Prevent default back behavior
      }
      return false; // Let the default back behavior happen (exit app)
    },
  };

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => navigation.goBack()
    );

    return () => backHandler.remove();
  }, [screenStack]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Camera':
        return <CameraScreen navigation={navigation} />;
      case 'Result':
        return (
          <ResultScreen 
            navigation={navigation} 
            route={{ params: routeParams }}
          />
        );
      case 'History':
        return <HistoryScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
        />
        {renderScreen()}
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  resultLabel: {
    width: 120,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  resultValue: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  scanAgainButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;