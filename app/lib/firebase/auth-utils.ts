import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthError,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export const signIn = async (credentials: SignInCredentials): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    
    // Ensure user document exists in Firestore
    if (userCredential.user) {
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Only create user document if it doesn't exist, with default role
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || null,
          role: 'user', // Default role only for new users
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update last login and other non-role fields for existing users
        await setDoc(userDocRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || null,
          lastLogin: new Date(),
          updatedAt: new Date(),
        }, { merge: true }); // Use merge to preserve existing role and other data
      }
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (credentials: SignUpCredentials): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );

    // Create user profile in Firestore
    if (userCredential.user) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: credentials.email,
        displayName: credentials.displayName || null,
        role: 'user', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const authError = error as AuthError;
    
    switch (authError.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/invalid-credential':
        return 'Invalid credentials.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  return 'An unexpected error occurred.';
}; 