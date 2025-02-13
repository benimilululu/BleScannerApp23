// components/HistoryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);

  // Fetch history from AsyncStorage
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem('scanHistory');
        if (history) {
          const parsedHistory = JSON.parse(history);
          setHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    fetchHistory();
  }, []);

  // Filter history for the last 10 days and remove duplicates
  const filteredHistory = history
    .filter((item) => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      return item.lastSeen >= tenDaysAgo;
    })
    .reduce((uniqueDevices, item) => {
      // Check if the device is already in the uniqueDevices array
      if (!uniqueDevices.some((device) => device.device.id === item.device.id)) {
        uniqueDevices.push(item);
      }
      return uniqueDevices;
    }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History (Last 10 Days)</Text>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.device.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.deviceName}>{item.device.name}</Text>
            <Text style={styles.deviceId}>{item.device.id}</Text>
            <Text style={styles.lastSeen}>
              Last Seen: {new Date(item.lastSeen).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
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
  lastSeen: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
});

export default HistoryScreen;
