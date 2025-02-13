import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthComponent = ({ onAuthentication }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    return () => setMounted(false); // Cleanup on unmount
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!mounted) return;
    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        
        // Add additional validation
        if (!userCredential?.user?.uid) {
          throw new Error('User creation failed - no UID returned');
        }

        // Firestore write with timeout
        await Promise.race([
          firestore().collection('users').doc(userCredential.user.uid).set({
            email: email,
            role: userRole,
            createdAt: firestore.FieldValue.serverTimestamp()
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore operation timed out')), 10000)
          )
        ]);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }

      // Only proceed if component is still mounted
      if (mounted) {
        onAuthentication();
      }
    } catch (error) {
      if (mounted) {
        Alert.alert('Error', this.getErrorMessage(error));
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      default:
        return error.message || 'An unexpected error occurred';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRegistering ? 'Create Account' : 'Welcome Back'}
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        placeholderTextColor="#999"
      />

      {isRegistering && (
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              userRole === 'user' && styles.selectedRole,
              styles.roleButtonShadow
            ]}
            onPress={() => setUserRole('user')}
          >
            <Text style={[
              styles.roleText,
              userRole === 'user' && styles.selectedRoleText
            ]}>
              👤 Regular User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              userRole === 'company' && styles.selectedRole,
              styles.roleButtonShadow
            ]}
            onPress={() => setUserRole('company')}
          >
            <Text style={[
              styles.roleText,
              userRole === 'company' && styles.selectedRoleText
            ]}>
              🏢 Company
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            {isRegistering ? 'Creating account...' : 'Signing in...'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.buttonShadow]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {isRegistering ? 'Register' : 'Login'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.switchModeContainer}
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.switchModeText}>
          {isRegistering 
            ? 'Already have an account? Login here'
            : 'Need an account? Register here'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedRole: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  roleText: {
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedRoleText: {
    color: 'white',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeContainer: {
    marginTop: 20,
    padding: 10,
  },
  switchModeText: {
    color: '#2196F3',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#2196F3',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButtonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};

export default AuthComponent;