import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  Platform,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { URL } from 'react-native-url-polyfill';

// Polyfill for URL API
global.URL = URL;

// Supabase Configuration
const SUPABASE_URL = 'https://agqjwbyzzgvwocpwkont.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncWp3Ynl6emd2d29jcHdrb250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDU2OTYsImV4cCI6MjA1NjA4MTY5Nn0.HAi3mbCfXjVayHKBcqbwwLZCbPwKWhJ82OsA41WTLGw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: Platform.OS === 'android' ? false : true,
  },
});

const BleScanner = ({ user, userRole }) => {
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseDevices, setSupabaseDevices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All'); // State for active category
  const bleManager = useRef(new BleManager()).current;
  const scanInterval = useRef(null);

  // Categories
  const categories = ['All', 'Fashion', 'Cars', 'Electronics', 'Accessories'];

  // Request permissions function
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const checkBluetoothState = () => {
    // Add your Bluetooth state check logic here if needed
  };

  // Fetch devices from Supabase
  const fetchSupabaseDevices = async () => {
    try {
      const { data, error } = await supabase.from('adds').select('*');
      if (error) throw error;
      console.log('Supabase devices fetched:', data);
      setSupabaseDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching devices from Supabase:', error);
    } finally {
      setIsLoading(false); // Data fetching is complete
    }
  };

  // Save scanned device to history
  const saveToHistory = async (device) => {
    const matchedSupabaseDevice = supabaseDevices.find(
      (d) => d.device_id === device.id
    );

    if (matchedSupabaseDevice) {
      const historyItem = {
        id: matchedSupabaseDevice.id,
        deviceId: matchedSupabaseDevice.device_id,
        deviceName: matchedSupabaseDevice.name || 'Unnamed',
        company: matchedSupabaseDevice.company || 'Unnamed',
        lastSeen: Date.now(),
        description: matchedSupabaseDevice.description || '',
        img: matchedSupabaseDevice.img || '',
      };

      try {
        const history = await AsyncStorage.getItem('scanHistory');
        const parsedHistory = history ? JSON.parse(history) : [];
        const existingDeviceIndex = parsedHistory.findIndex(
          (item) => item.deviceId === historyItem.deviceId
        );

        if (existingDeviceIndex !== -1) {
          parsedHistory[existingDeviceIndex].lastSeen = Date.now();
        } else {
          parsedHistory.push(historyItem);
        }

        await AsyncStorage.setItem('scanHistory', JSON.stringify(parsedHistory));
      } catch (error) {
        console.error('Error saving to history:', error);
      }
    }
  };

  // Scan for BLE devices and compare with Supabase
  const startScan = () => {
    if (isScanning) return;

    setIsScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      console.log('Scanned device:', device.id, device.name);
      console.log(supabaseDevices);

      const matchedSupabaseDevice = supabaseDevices.find(
        (d) => d.device_id === device.id
      );

      if (matchedSupabaseDevice) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.device.id === device.id);
          if (!exists) {
            saveToHistory(device);
            return [...prev, { device, lastSeen: Date.now() }];
          } else {
            return prev.map((d) =>
              d.device.id === device.id ? { ...d, lastSeen: Date.now() } : d
            );
          }
        });
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 5000); // Scan for 4 seconds each time
  };

  // Start continuous scanning every 5 seconds
  const startScanCycle = () => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    scanInterval.current = setInterval(() => {
      startScan();
    }, 10000); // Scan every 10 seconds (5000ms)
  };

  // Start scanning automatically when component mounts
  useEffect(() => {
    const initializeAndScan = async () => {
      const locationGranted = await requestLocationPermission();
      const bluetoothGranted = await requestBluetoothPermissions();

      if (locationGranted && bluetoothGranted) {
        checkBluetoothState();
        await fetchSupabaseDevices(); // Wait for data to be fetched
        if (!isLoading) {
          startScan(); // Initial scan on mount
          startScanCycle(); // Start the 5-second interval scanning
        }
      }
    };

    initializeAndScan();

    // Cleanup on unmount
    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
      bleManager.stopDeviceScan();
      bleManager.destroy();
    };
  }, [isLoading]); // Re-run when isLoading changes

  // Filter devices based on active category
  const filteredDevices = devices.filter((item) => {
    const matchedSupabaseDevice = supabaseDevices.find(
      (d) => d.device_id === item.device.id
    );
    if (activeCategory === 'All') return true;
    return matchedSupabaseDevice?.category === activeCategory.toLocaleLowerCase();
  });

  return (
    <View style={styles.container}>
      {/* {isScanning && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loaderText}>Scanning...</Text>
        </View>
      )} */}
  
      {/* Categories Section */}
      <Text style={styles.headerText}>Categories</Text>
      <View >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.activeCategoryButton,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
  
      {/* Scanned Devices Section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {filteredDevices.length > 0 ? 'Scanned Devices' : 'No Devices Found Yet'}
        </Text>
      </View>
  
      <FlatList
        data={filteredDevices}
        style={styles.list}
        keyExtractor={(item) => item.device.id}
        renderItem={({ item }) => {
          const supabaseDevice = supabaseDevices.find(
            (d) => d.device_id === item.device.id
          );
          return (
            <TouchableOpacity
              style={styles.deviceCard}
              onPress={() =>
                navigation.navigate('DeviceDetails', {
                  device: supabaseDevice || item.device,
                })
              }
            >
              <View style={styles.deviceContent}>
                {supabaseDevice?.img && (
                  <Image
                    source={{ uri: supabaseDevice.img }}
                    style={styles.deviceImage}
                    resizeMode="contain"
                    onError={(e) =>
                      console.log('Image load error:', e.nativeEvent.error)
                    }
                  />
                )}
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceCompany}>
                    {supabaseDevice
                      ? supabaseDevice.company
                      : item.device.name || 'Unnamed'}
                  </Text>
                  <Text style={styles.deviceName}>
                    {supabaseDevice
                      ? supabaseDevice.name
                      : item.device.name || 'Unnamed'}
                  </Text>
                  {supabaseDevice?.description && (
                    <Text style={styles.price}>
                      {supabaseDevice.description.substring(0, 40)}
                      {supabaseDevice.description.length > 40 ? '...' : ''}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
  
      {/* View History Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20, // Keep padding for overall spacing
  },
  loaderContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  header: {
    marginBottom: 0, // Remove marginBottom
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 0, // Remove marginBottom
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  deviceContent: {
    flexDirection: 'row',
  },
  deviceImage: {
    width: 130,
    height: '106%',
    resizeMode: 'cover',
  },
  deviceInfo: {
    flex: 1,
    flexDirection: 'column',
    padding: 16,
    flexShrink: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  deviceCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2ecc71',
    marginBottom: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  list: {
    flex: 1,
    marginTop: 0, // Ensure no extra margin
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryContainer: {
    marginTop: 0, // Remove marginTop
    marginBottom: 0,
    paddingBottom: 20, // Remove paddingBottom
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  activeCategoryButton: {
    backgroundColor: '#3498db',
  },
  categoryText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
});

export default BleScanner;