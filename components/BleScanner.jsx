import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  PermissionsAndroid,
  Platform,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore'; // Corrected Firestore import

const BleScanner = ({ user, userRole }) => {
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [firestoreDevices, setFirestoreDevices] = useState([]); // Devices from Firestore
  const bleManager = useRef(new BleManager()).current;
  const scanInterval = useRef(null);
  // const [targetDeviceName] = useState('Holy-IOT');

  // Fetch devices from Firestore
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const querySnapshot = await firestore().collection('devices').get();
        const devices = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFirestoreDevices(devices);
      } catch (error) {
        console.error('Error fetching devices from Firestore:', error);
      }
    };

    fetchDevices();
  }, []);

  // Animation for modal
  const toggleBanner = (show) => {
    setShowBanner(show);
  };

  // Save scanned devices to history
  const saveToHistory = async (device) => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      const parsedHistory = history ? JSON.parse(history) : [];

      // Check if the device already exists in the history
      const existingDeviceIndex = parsedHistory.findIndex(
        (item) => item.device.id === device.id
      );

      if (existingDeviceIndex !== -1) {
        // If the device exists, update its lastSeen timestamp
        parsedHistory[existingDeviceIndex].lastSeen = Date.now();
      } else {
        // If the device doesn't exist, add it to the history
        parsedHistory.push({ device, lastSeen: Date.now() });
      }

      // Save the updated history back to AsyncStorage
      await AsyncStorage.setItem('scanHistory', JSON.stringify(parsedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  // Scan for BLE devices
  const startScan = () => {
    if (isScanning) return;

    setIsScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      // Check if the scanned device matches any device in Firestore
      const matchedDevice = firestoreDevices.find(
        (d) => d.id === device.id && d.name === device.name
      );

      if (matchedDevice) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.device.id === device.id);
          if (!exists) {
            toggleBanner(true); // Only show the banner when the device is found
            saveToHistory(device); // Save the device to history
            return [...prev, { device, lastSeen: Date.now() }];
          } else {
            // Update the last seen timestamp if the device is already in the list
            return prev.map((d) =>
              d.device.id === device.id ? { ...d, lastSeen: Date.now() } : d,
            );
          }
        });
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 2000);
  };

  // Start scan cycle every 10 seconds
  const startScanCycle = () => {
    if (scanInterval.current) clearInterval(scanInterval.current); // Clear any existing interval
    scanInterval.current = setInterval(() => {
      startScan();
    }, 10000); // Scan every 10 seconds
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current); // Clear the interval on unmount
      bleManager.destroy();
    };
  }, []);

  // Initial setup
  useEffect(() => {
    const requestPermissions = async () => {
      const locationGranted = await requestLocationPermission();
      const bluetoothGranted = await requestBluetoothPermissions();

      if (locationGranted && bluetoothGranted) {
        checkBluetoothState(); // Check Bluetooth state after permissions are granted
      }
    };
    requestPermissions();
  }, []);

  // Remove devices that haven't been seen for 1 minute
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setDevices((prev) => prev.filter((d) => Date.now() - d.lastSeen < 60000));
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Modal Banner */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBanner}
        onRequestClose={() => toggleBanner(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* <Image
              source={require('../assets/porsche.jpg')}
              style={styles.bannerImage}
            /> */}
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Holy-IOT Detected!</Text>
              <Text style={styles.bannerSubtitle}>Device is within range</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => toggleBanner(false)}
            >
              <Icon name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scan Controls */}
      <View style={styles.controls}>
        <Button
          title={isScanning ? 'Scanning...' : 'Start Scan'}
          onPress={startScan}
          disabled={isScanning}
          color="#2ecc71"
        />
      </View>

      {/* Devices List */}
      <FlatList
        data={devices}
        style={styles.list}
        keyExtractor={(item) => item.device.id}
        renderItem={({ item }) => (
          <View style={styles.deviceCard}>
            <Icon name="bluetooth" size={24} color="#3498db" />
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.device.name}</Text>
              <Text style={styles.deviceId}>{item.device.id}</Text>
            </View>
          </View>
        )}
      />

      {/* History Button */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.historyButtonText}>View History</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#27ae60',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 15,
  },
  bannerText: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  controls: {
    marginTop: 60,
    marginBottom: 20,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: {
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deviceId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  historyButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BleScanner;
