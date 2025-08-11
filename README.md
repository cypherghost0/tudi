# 🏪 Loken - Offline-First Stock Management & POS System

A modern, offline-capable point of sale system designed for electronic components stores. Built with Next.js, Firebase, and Cloudinary.

## ✨ Features

- **🔄 Offline-First**: Work without internet - sales sync when reconnected
- **👥 Role-Based Access**: Admin and Cashier roles with different permissions
- **📱 PWA Ready**: Install as mobile app on tablets and phones
- **🖼️ Image Management**: Cloudinary integration for product images
- **📊 Analytics**: Comprehensive sales reporting and analytics
- **🔒 Secure**: Firebase Authentication with role-based protection
- **📦 Inventory Management**: Complete product catalog with stock tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Firebase project
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd loken
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=loken_products
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
loken/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (main)/           # Main application pages
│   │   ├── admin/        # Admin dashboard
│   │   ├── dashboard/    # Sales analytics
│   │   └── sales/        # POS interface
│   ├── api/              # API routes
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript types
├── public/               # Static assets
└── firestore.rules       # Firestore security rules
```

## 👥 User Roles

### Admin
- Manage products and inventory
- View all sales and analytics
- Manage user accounts and roles
- System configuration

### Cashier
- Process sales transactions
- View product catalog
- Access sales history
- Offline operation capability

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Update security rules (see `firestore.rules`)
5. Add your Firebase config to environment variables

### Cloudinary Setup

1. Create a Cloudinary account
2. Create an unsigned upload preset named `loken_products`
3. Add your Cloudinary config to environment variables

## 📱 PWA Features

- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Fast Loading**: Optimized for performance
- **Background Sync**: Automatically syncs when online

## 🔄 Offline Capabilities

- **Local Caching**: Products cached for offline access
- **Offline Sales**: Process transactions without internet
- **Queue System**: Operations queued for later sync
- **Visual Indicators**: Clear offline/online status

## 📊 Analytics & Reporting

- **Sales Dashboard**: Real-time sales metrics
- **Product Analytics**: Top-selling products
- **Export Functionality**: CSV export for reports
- **Date Range Filtering**: Customizable time periods

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Firebase (Firestore, Auth)
- **Storage**: Cloudinary
- **PWA**: next-pwa
- **Forms**: Formik, Yup validation

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [deployment guide](./DEPLOYMENT.md)
- Review Firebase console for errors
- Verify environment variable configuration

---

**Built with ❤️ for electronic components stores**
# godwin
# godwin
# godwin
