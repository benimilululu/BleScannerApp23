import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const DeviceDetails = ({ route }) => {
  const { device } = route.params;

  console.log('DeviceDetails:', device);

  return (
    <View style={styles.container}>
      <Image
                          source={{ uri: device.img }}
                          style={styles.deviceImage}
                          resizeMode="contain" // Use "contain" to show full image within bounds
                          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                        />
      <Text style={styles.text}>{device.company}</Text>
      <Text style={styles.text}>{device.name}</Text>
      <Text style={styles.description}>{device.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    overflow: 'scroll',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    // marginTop: 10,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    marginBottom: 10,
    paddingLeft: 20,
  },
  deviceImage: {
    width: '100%', // Full width of the screen
    height: '65%', // Adjust height as needed
    // resizeMode: 'cover', // Cover the entire width
  },
  
  description: {
    fontSize: 15,
    marginTop: 10,
    padding: 20,
    overflow: 'scroll',
  },
});

export default DeviceDetails;