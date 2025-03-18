import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Polyfill for URL API using react-native-url-polyfill
import { URL } from 'react-native-url-polyfill';
global.URL = URL;

// Supabase Configuration
const SUPABASE_URL = 'https://agqjwbyzzgvwocpwkont.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncWp3Ynl6emd2d29jcHdrb250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDU2OTYsImV4cCI6MjA1NjA4MTY5Nn0.HAi3mbCfXjVayHKBcqbwwLZCbPwKWhJ82OsA41WTLGw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: Platform.OS === 'android' ? false : true,
  },
});

// DeviceList Component
const DeviceList = () => {
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log('DeviceList: Starting fetch...');
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('adds')
          .select('*')
          .order('device_id', { ascending: true });

        if (error) throw error;

        console.log('Supabase data:', data);
        setDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const renderDeviceItem = ({ item }) => (
    <View style={styles.deviceCard}>
      <Image
        source={{ uri: item.img || 'https://via.placeholder.com/200' }}
        style={styles.deviceImage}
        resizeMode="cover"
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unnamed'}</Text>
        <Text style={styles.company}>{item.company || 'Unknown'}</Text>
        <Text style={styles.description}>Description: {item.description || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading devices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error: {error}</Text>
        <Text>Check your Supabase URL and connection</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) =>
          item.device_id ? item.device_id.toString() : Math.random().toString()
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No devices found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  deviceImage: {
    width: '100%',
    height: 200,
  },
  deviceInfo: {
    padding: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  company: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '600',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default DeviceList;