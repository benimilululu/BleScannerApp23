// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from 'firebase/database';
import { getFirestore } from 'firebase/firestore'; // Import Firestore

// Firebase configuration (use your actual credentials here)
const firebaseConfig = {
  apiKey: "AIzaSyC8ozoHTKJH_OVY-YwlKq8_wO-evrjjA8s",
  authDomain: "smartadd-7efd9.firebaseapp.com",
  projectId: "smartadd-7efd9",
  storageBucket: "smartadd-7efd9.firebasestorage.app",
  messagingSenderId: "1042423008132",
  appId: "1:1042423008132:web:99abca2416071939abebd1",
  measurementId: "G-GNT6SG4JJY"  // Optional for analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore

// Export the database reference, set function, and ref function for use in other parts of your app
export { db, ref, set };
