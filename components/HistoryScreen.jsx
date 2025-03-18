import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const HistoryScreen = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const navigation = useNavigation();

  

  const getHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      const parsedHistory = history ? JSON.parse(history) : [];
      console.log('Parsed History:', parsedHistory); // Debugging line
      setScanHistory(parsedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

// Delete the history from the async storage ->
  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('scanHistory');
      setScanHistory([]); // Clear the state to update UI immediately
      console.log('History cleared successfully');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  useEffect(() => {
    // clearHistory(); // Clear history for testing
    getHistory();
  }, []);

  const renderItem = ({ item }) => {
    if (!item.deviceId) {
      return null; // Skip if deviceId is undefined
    }

    return (
      <TouchableOpacity
        style={styles.deviceCard}
        onPress={() =>
          navigation.navigate('DeviceDetails', { device: item })
        }
      >
        <View style={styles.deviceContent}>
          {item.img && (
            <Image
              source={{ uri: item.img }}
              style={styles.deviceImage}
              resizeMode="cover"
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
          )}
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceCompany}>{item.company}</Text>
            <Text style={styles.deviceName}>{item.deviceName}</Text>
            {item.description && (
              <Text style={styles.description}>
                {item.description.substring(0, 40)}
                {item.description.length > 40 ? '...' : ''}
              </Text>
            )}
            <Text style={styles.lastSeen}>
              Last Seen: {new Date(item.lastSeen).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={scanHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.deviceId}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    paddingBottom: 20,
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
    height: '%',
    resizeMode: 'cover',
  },
  deviceInfo: {
    flex: 1,
    flexDirection: 'column',
    padding: 16,
    flexShrink: 1,
  },
  deviceCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2ecc71',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  lastSeen: {
    fontSize: 14,
    color: '#95a5a6',
  },
});

export default HistoryScreen;