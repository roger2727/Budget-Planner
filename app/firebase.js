// app/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth} from 'firebase/auth';

import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCTxeJ1DZFX9PE3KelaJshhx7HWFO8nH2k",
  authDomain: "budget-planner-cb29a.firebaseapp.com",
  projectId: "budget-planner-cb29a",
  storageBucket: "budget-planner-cb29a.firebasestorage.app",
  messagingSenderId: "763204585647",
  appId: "1:763204585647:web:88c814ce1ca8748979ac5a",
  measurementId: "G-CQKS1X86WS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, storage };
export default app;