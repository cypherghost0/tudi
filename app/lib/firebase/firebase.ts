// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { log } from "../utils";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGMYKBxMZUtGXxfSCNxY-bZ-bTZOJ_L4o",
  authDomain: "tudi-01.firebaseapp.com",
  projectId: "tudi-01",
  storageBucket: "tudi-01.firebasestorage.app",
  messagingSenderId: "150043893430",
  appId: "1:150043893430:web:81561c4c7d35d135875017",
  measurementId: "G-N8M6BWFS7E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (client-side only)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firestore with persistent local cache for offline support
let db: ReturnType<typeof getFirestore>;
let auth: ReturnType<typeof getAuth>;

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'dummy-project') {
  try {
    // Initialize Firestore with modern persistent cache
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

    // Initialize Auth with local persistence
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });

    log('info', 'Firebase initialized with persistent local cache and auth persistence');
  } catch (error) {
    // Fallback to regular initialization if persistent cache fails
    log('warn', 'Failed to initialize with persistent cache, falling back to default', error);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} else {
  // Server-side or dummy project - use regular initialization
  db = getFirestore(app);
  auth = getAuth(app);
}

const storage = getStorage(app);

export { db, auth, storage, analytics };