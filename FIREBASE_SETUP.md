# Firebase Authentication Setup

This guide will help you set up Firebase Authentication for the Tudi Papeterie application.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Node.js and npm installed

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Save the changes

4. Set up Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Choose a location close to your users

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web app
4. Register your app and copy the configuration object

## Step 3: Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Replace the values with your actual Firebase configuration.

## Step 4: Firestore Security Rules

Update your Firestore security rules to allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can read all user profiles
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 5: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the login page
4. Create a new account using the sign-up form
5. Verify that you can log in and access the dashboard

## User Roles

The application supports three user roles:

- **user**: Basic access to dashboard and reports
- **manager**: Can manage customers, products, and sales records
- **admin**: Full access including user management

By default, new users are assigned the "user" role. You can manually update roles in the Firebase Console or implement an admin interface.

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your API key is correct in `.env.local`
   - Ensure the Firebase project is properly configured

2. **"Firebase: Error (auth/operation-not-allowed)"**
   - Make sure Email/Password authentication is enabled in Firebase Console

3. **"Firebase: Error (firestore/permission-denied)"**
   - Check your Firestore security rules
   - Ensure the user is authenticated

4. **Environment variables not loading**
   - Restart the development server after adding `.env.local`
   - Make sure the file is in the root directory

### Getting Help

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the [Next.js Documentation](https://nextjs.org/docs)
- Check the browser console for detailed error messages 