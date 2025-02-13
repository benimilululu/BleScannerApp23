// components/AccountInfo.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';

const AccountInfo = ({ user, onLogout }) => {
  const getUsername = () => {
    if (!user?.email) return 'Guest';
    return user.email.split('@')[0];
  };

  return (
    <View style={styles.container}>
      <View style={styles.accountContainer}>
        <Icon name="account-circle" size={32} color="#2196F3" />
        <Text style={styles.username}>{getUsername()}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => auth().signOut().then(onLogout)}
      >
        <Icon name="logout" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  accountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 4,
  },
});

export default AccountInfo;