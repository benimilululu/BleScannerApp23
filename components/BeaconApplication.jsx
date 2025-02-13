import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AccountInfo from './AccountInfo';

const categories = [
  'Fashion',
  'Electronics',
  'Accessories',
  'Home & Living',
  'Health & Beauty'
];

const BeaconApplication = ({ userId, user }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const generateBeaconIds = async (quantity) => {
    const counterRef = firestore().collection('counters').doc('beaconCounter');
    const db = firestore();
    
    return db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentNumber = 0;

      if (counterDoc.exists) {
        currentNumber = counterDoc.data().currentNumber;
      } else {
        transaction.set(counterRef, { currentNumber: 0 });
      }

      const beaconIds = [];
      for (let i = 1; i <= quantity; i++) {
        const beaconNumber = (currentNumber + i).toString().padStart(3, '0');
        beaconIds.push(`Holy-IOT-${beaconNumber}`);
      }
      
      transaction.update(counterRef, { 
        currentNumber: currentNumber + quantity 
      });
      
      return beaconIds;
    });
  };

  const handleSubmit = async () => {
    if (!quantity || selectedCategories.length === 0) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity < 1) {
      Alert.alert('Error', 'Please enter a valid quantity (minimum 1)');
      return;
    }

    setLoading(true);
    try {
      const beaconIds = await generateBeaconIds(numericQuantity);
      const batch = firestore().batch();

      // Create application document
      const applicationRef = firestore().collection('beaconApplications').doc();
      batch.set(applicationRef, {
        businessId: userId,
        categories: selectedCategories,
        quantity: numericQuantity,
        status: 'approved',
        beaconIds,
        createdAt: firestore.FieldValue.serverTimestamp()
      });

      // Create beacon documents
      beaconIds.forEach(beaconId => {
        const beaconRef = firestore().collection('beacons').doc(beaconId);
        batch.set(beaconRef, {
          id: beaconId,
          businessId: userId,
          applicationId: applicationRef.id,
          status: 'active',
          createdAt: firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      Alert.alert('Success', `${numericQuantity} beacons created with IDs:\n${beaconIds.join('\n')}`);
      setQuantity('');
      setSelectedCategories([]);

    } catch (error) {
      Alert.alert('Error', `Failed to create beacons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <AccountInfo user={user} onLogout={() => setShowBanner(false)} />
      <Text style={{ fontSize: 24, marginBottom: 20 }}>New Beacon Application</Text>

      <Text style={{ fontSize: 18 }}>Select Categories:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 }}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={{
              padding: 10,
              margin: 4,
              backgroundColor: selectedCategories.includes(category) ? '#2196F3' : '#e0e0e0',
              borderRadius: 8
            }}
            onPress={() => toggleCategory(category)}
          >
            <Text style={{ color: selectedCategories.includes(category) ? 'white' : 'black' }}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 18, marginVertical: 10 }}>Number of Beacons:</Text>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
        keyboardType="numeric"
        placeholder="Enter quantity"
        value={quantity}
        onChangeText={text => setQuantity(text.replace(/[^0-9]/g, ''))}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          title="Submit Application"
          onPress={handleSubmit}
          disabled={!quantity || selectedCategories.length === 0}
        />
      )}
    </ScrollView>
  );
};

export default BeaconApplication;