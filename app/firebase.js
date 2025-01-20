// app/config/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTxeJ1DZFX9PE3KelaJshhx7HWFO8nH2k",
  authDomain: "budget-planner-cb29a.firebaseapp.com",
  projectId: "budget-planner-cb29a",
  storageBucket: "budget-planner-cb29a.firebasestorage.app",
  messagingSenderId: "763204585647",
  appId: "1:763204585647:web:88c814ce1ca8748979ac5a",
  measurementId: "G-CQKS1X86WS"
};

// Debug log
console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Debug log
console.log('Firebase initialized, auth:', auth ? 'success' : 'failed');

export { auth };
export default app;