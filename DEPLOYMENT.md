# 🚀 Tudi Papeterie POS System - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- [Vercel account](https://vercel.com)
- [Firebase project](https://console.firebase.google.com)
- [Cloudinary account](https://cloudinary.com)

## Environment Variables Setup

### 1. Firebase Configuration

Create a Firebase project and add these environment variables to Vercel:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Cloudinary Configuration

Set up Cloudinary and add these environment variables:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tudi_products
```

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see above)
5. Deploy!

### 3. Post-Deployment Setup

1. **Firebase Security Rules**: Update your Firestore rules
2. **Cloudinary Upload Preset**: Create an unsigned upload preset named `tudi_products`
3. **Test the Application**: Verify all features work in production

## Firebase Security Rules

Update your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products - read by all authenticated users, write by admins only
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sales - read by all authenticated users, write by cashiers and admins
    match /sales/{saleId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'cashier' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Cloudinary Setup

1. Create an unsigned upload preset:
   - Go to Settings > Upload
   - Create new upload preset named `tudi_products`
   - Set signing mode to "Unsigned"
   - Set folder to `tudi/products`

## Testing Checklist

- [ ] User registration and login
- [ ] Admin product management
- [ ] Cashier POS functionality
- [ ] Offline mode operation
- [ ] Image upload to Cloudinary
- [ ] Sales reporting and export
- [ ] PWA installation

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure all variables are prefixed with `NEXT_PUBLIC_` for client-side access
   - Redeploy after adding environment variables

2. **Firebase Connection Issues**
   - Verify Firebase project settings
   - Check authentication domain configuration

3. **Cloudinary Upload Failures**
   - Verify upload preset exists and is unsigned
   - Check API key permissions

4. **PWA Not Working**
   - Ensure manifest.json is accessible
   - Check service worker registration

## Support

For issues or questions:
- Check the Firebase console for errors
- Review Vercel deployment logs
- Verify environment variable configuration

---

**🎉 Your Tudi Papeterie POS system is now ready for production use!**