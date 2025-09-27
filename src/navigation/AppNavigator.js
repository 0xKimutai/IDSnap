/**
 * App Navigator
 * Main navigation structure for the IDSnap app with theme support
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import PreviewScreen from '../screens/PreviewScreen';
import ResultScreen from '../screens/ResultScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { colors, toggleTheme, isDark } = useTheme();

  const ThemeToggleButton = ({ navigation }) => (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ marginRight: 15, padding: 5 }}
    >
      <Icon
        name={isDark ? 'light-mode' : 'dark-mode'}
        size={24}
        color={colors.white}
      />
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <ThemeToggleButton navigation={navigation} />,
      })}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'IDSnap',
        }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Scan ID Card',
          headerShown: false, // Hide header for camera screen
        }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{
          title: 'Preview',
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          title: 'Scan Results',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
