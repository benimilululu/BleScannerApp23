import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getUniqueId } from 'react-native-device-info';

// Components
import BleScanner from './components/BleScanner';
import HistoryScreen from './components/HistoryScreen';
import DeviceDetails from './components/DeviceDetails';
import DeviceList from './components/DeviceList'; 

const Stack = createStackNavigator();

// Enable Firestore persistence
firestore()
  .settings({ persistence: true })
  .catch((err) => console.log('Error enabling Firestore persistence:', err));

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const authenticateWithDeviceToken = async () => {
    try {
      const deviceId = await getUniqueId();
      console.log('Device ID:', deviceId);

      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log('User already signed in:', currentUser.uid);
        setUser(currentUser);
        setLoading(false);
        return;
      }

      const userCredential = await auth().signInAnonymously();
      console.log('Anonymous user signed in:', userCredential.user.uid);

      const userRef = firestore().collection('users').doc(userCredential.user.uid);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        await userRef.set({ deviceId }, { merge: true });
        console.log('Device ID linked to user:', userCredential.user.uid);
      } else {
        console.log('User already exists in Firestore');
      }

      setUser(userCredential.user);
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authenticateWithDeviceToken();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="BleScanner"
        screenOptions={{
          headerStyle: { backgroundColor: '#f4511e' },
          headerTintColor: '#fff',
        }}
      >
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
        <Stack.Screen 
          name="DeviceDetails" 
          component={DeviceDetails} 
          options={({ route }) => ({ title: route.params?.deviceName || 'Add Details' })}
        />
        <Stack.Screen 
          name="DeviceList" 
          component={DeviceList} 
          options={{ title: 'Device Marketplace' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;