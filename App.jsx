// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // Add this
import { createStackNavigator } from '@react-navigation/stack'; // Add this
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getUniqueId } from 'react-native-device-info';

import BleScanner from './components/BleScanner';
import HistoryScreen from './components/HistoryScreen'; // Add this

const Stack = createStackNavigator(); // Create a stack navigator

const App = () => {
  const [loading, setLoading] = useState(true); // To show a loader while authenticating
  const [user, setUser] = useState(null); // To store the authenticated user

  // Function to authenticate the user with the device token
  const authenticateWithDeviceToken = async () => {
    try {
      // Step 1: Get the unique device ID
      const deviceId = await getUniqueId();
      console.log('Device ID:', deviceId);

      // Step 2: Check if the user is already signed in
      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log('User already signed in:', currentUser.uid);
        setUser(currentUser);
        setLoading(false);
        return;
      }

      // Step 3: Sign in anonymously (or with a custom token if you prefer)
      const userCredential = await auth().signInAnonymously();
      console.log('Anonymous user signed in:', userCredential.user.uid);

      // Step 4: Link the device ID to the user in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        deviceId,
      }, { merge: true });

      console.log('Device ID linked to user:', userCredential.user.uid);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run the authentication logic when the app starts
  useEffect(() => {
    authenticateWithDeviceToken();
  }, []);

  // Show a loader while authenticating
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render the main app content once authenticated
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BleScanner">
        <Stack.Screen
          name="BleScanner"
          component={BleScanner}
          options={{ title: 'BLE Scanner' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Scan History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;