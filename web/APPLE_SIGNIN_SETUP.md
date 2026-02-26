# Complete Guide: Sign in with Apple for Web Applications (2024)

## Overview

This comprehensive guide will walk you through implementing Sign in with Apple for your wedding RSVP web application using Firebase Authentication. The process involves multiple complex steps across Apple Developer Console, Firebase Console, and your Next.js application.

## Prerequisites

- ✅ Apple Developer Account ($99/year)
- ✅ Firebase project already set up
- ✅ Next.js application with Firebase Authentication
- ✅ Domain ownership verification capability

---

## Part 1: Apple Developer Console Configuration

### Step 1.1: Create App ID

1. **Navigate to Apple Developer Portal**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Sign in with your Apple Developer account
   - Navigate to **Certificates, Identifiers & Profiles**

2. **Create New App ID**
   - Click **Identifiers** → **+** button
   - Select **App IDs** → **Continue**
   - Choose **App** → **Continue**
   - Fill in the details:
     - **Description**: `Boda en Tarifa Wedding App`
     - **Bundle ID**: `com.bodaentarifa.app` (use reverse domain notation)
   - **Enable Capabilities**: Check **Sign In with Apple**
   - Click **Continue** → **Register**

### Step 1.2: Create Service ID

1. **Create Service ID**
   - In **Identifiers** section, click **+** button
   - Select **Services IDs** → **Continue**
   - Fill in details:
     - **Description**: `Boda en Tarifa Web Service`
     - **Identifier**: `com.bodaentarifa.app.service`
   - Click **Continue** → **Register**

2. **Configure Service ID**
   - Click on your newly created Service ID
   - Check **Sign In with Apple** → **Configure**
   - **Primary App ID**: Select the App ID created in Step 1.1
   - **Domains and Subdomains**: Add your domains:
     - `bodaentarifa.com`
     - `localhost` (for development)
   - **Return URLs**: Add Firebase OAuth handler URL:
     - `https://boda-en-tarifa.firebaseapp.com/__/auth/handler`
   - Click **Next** → **Done** → **Save**

### Step 1.3: Domain Verification

1. **Download Verification File**
   - In the Service ID configuration, you'll see a **Download** button for domain verification
   - Download the `apple-developer-domain-association.txt` file

2. **Upload Verification File**
   - Create a `.well-known` directory in your project's `public` folder
   - Place the downloaded file as: `public/.well-known/apple-developer-domain-association.txt`
   - The file should be accessible at: `https://bodaentarifa.com/.well-known/apple-developer-domain-association.txt`

### Step 1.4: Create Private Key

1. **Generate Private Key**
   - Navigate to **Keys** section in Apple Developer Portal
   - Click **+** button to create new key
   - **Key Name**: `Boda en Tarifa Apple Sign In Key`
   - **Enable Services**: Check **Sign In with Apple**
   - Click **Configure** → Select your App ID → **Save**
   - Click **Continue** → **Register**

2. **Download and Secure Key**
   - **Download the .p8 file** (you can only download this once!)
   - **Note the Key ID** (10-character string)
   - **Note your Team ID** (found in your Apple Developer account membership details)
   - Store these securely - you'll need them for Firebase configuration

---

## Part 2: Firebase Console Configuration

### Step 2.1: Enable Apple Sign-In

1. **Navigate to Firebase Console**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Select your `boda-en-tarifa` project

2. **Configure Authentication**
   - Go to **Authentication** → **Sign-in method**
   - Find **Apple** provider → Click **Enable**

3. **Enter Apple Configuration**
   - **Service ID**: `com.bodaentarifa.app.service`
   - **Apple Team ID**: Your 10-character Team ID from Apple Developer
   - **Key ID**: The 10-character Key ID from the private key
   - **Private Key**: Open your `.p8` file and copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Click **Save**

---

## Part 3: Next.js Application Implementation

### Step 3.1: Update Firebase Configuration

Add Apple provider to your existing Firebase configuration:

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// ... existing config ...

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Apple Auth Provider
export const appleProvider = new OAuthProvider('apple.com');
```

### Step 3.2: Create Apple Sign-In Button Component

```typescript
// src/components/auth/AppleSignInButton.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaApple } from 'react-icons/fa';

interface AppleSignInButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AppleSignInButton({ 
  className = '', 
  children 
}: AppleSignInButtonProps) {
  const { signInWithApple, loading, error } = useAuth();

  return (
    <div className="w-full">
      <button
        onClick={signInWithApple}
        disabled={loading}
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-3 
          bg-black text-white rounded-lg shadow-sm
          hover:bg-gray-800 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
      >
        <FaApple className="w-5 h-5" />
        {children || (loading ? 'Signing in...' : 'Continue with Apple')}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Step 3.3: Update AuthContext

Add Apple sign-in functionality to your existing AuthContext:

```typescript
// src/contexts/AuthContext.tsx
// ... existing imports ...
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  AuthError 
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>; // Add this
  logout: () => Promise<void>;
  error: string | null;
}

// ... existing code ...

const signInWithApple = async () => {
  try {
    setError(null);
    setLoading(true);
    await signInWithPopup(auth, appleProvider);
  } catch (error) {
    const authError = error as AuthError;
    setError(authError.message);
    console.error('Apple sign-in error:', authError);
  } finally {
    setLoading(false);
  }
};

// ... rest of existing code ...

const value = {
  user,
  loading,
  signInWithGoogle,
  signInWithApple, // Add this
  logout,
  error,
};
```

### Step 3.4: Update AuthGuard Component

Update the AuthGuard to show both Google and Apple sign-in options:

```typescript
// src/components/auth/AuthGuard.tsx
// ... existing imports ...
import GoogleSignInButton from './GoogleSignInButton';
import AppleSignInButton from './AppleSignInButton';

// ... existing code until the fallback section ...

if (!user) {
  return fallback || (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              RSVP Required
            </h1>
            <p className="text-gray-600">
              Please sign in to access the RSVP form
            </p>
          </div>
          
          <div className="space-y-4">
            <GoogleSignInButton />
            <AppleSignInButton />
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            We use secure sign-in to verify your identity for the RSVP form
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Part 4: Testing and Deployment

### Step 4.1: Local Testing

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Test Apple Sign-In**
   - Navigate to `http://localhost:3000/rsvp`
   - Click "Continue with Apple"
   - Complete the Apple sign-in flow
   - Verify user appears in Firebase Console

### Step 4.2: Production Deployment

1. **Deploy Domain Verification File**
   - Ensure `public/.well-known/apple-developer-domain-association.txt` is deployed
   - Verify it's accessible at your production domain

2. **Update Apple Service ID Configuration**
   - Add your production domain to the Service ID configuration
   - Update return URLs if needed

3. **Deploy Application**

   ```bash
   npm run build
   npm run deploy
   ```

---

## Part 5: Troubleshooting Common Issues

### Issue 1: "This app is not verified"

- **Solution**: This is normal for development. Users can click "Continue" to proceed.
- **For Production**: Submit your app for Apple verification (optional but recommended).

### Issue 2: Domain verification fails

- **Check**: Ensure the verification file is accessible at the correct URL
- **Verify**: File is in `public/.well-known/` directory
- **Test**: Visit the URL directly in browser

### Issue 3: "Invalid client" error

- **Check**: Service ID configuration in Apple Developer Console
- **Verify**: Return URLs match exactly (including trailing slashes)
- **Confirm**: Domain is added to authorized domains

### Issue 4: Private key issues

- **Verify**: Key ID and Team ID are correct in Firebase
- **Check**: Private key format includes headers and footers
- **Confirm**: Key has "Sign In with Apple" capability enabled

---

## Part 6: Security Considerations

### Data Privacy

- Apple may provide anonymized email addresses
- Handle cases where users decline to share email
- Implement proper data retention policies

### Security Best Practices

- Store private keys securely (never commit to version control)
- Use environment variables for sensitive configuration
- Implement proper error handling for authentication failures
- Monitor authentication logs in Firebase Console

---

## Part 7: Next Steps

### Future Enhancements

1. **Apple Sign-In on Mobile**: Implement native iOS sign-in
2. **Account Linking**: Allow users to link multiple sign-in methods
3. **User Management**: Add admin panel for managing RSVPs
4. **Email Notifications**: Send confirmation emails after RSVP submission

### Monitoring

- Set up Firebase Analytics to track sign-in methods
- Monitor authentication success rates
- Set up alerts for authentication failures

---

## Cost Considerations

### Apple Developer Program

- **Cost**: $99/year
- **Required**: Yes, for Sign in with Apple

### Firebase

- **Authentication**: Free tier includes 10,000 verifications/month
- **Additional costs**: Only if you exceed free tier limits

---

This comprehensive guide should help you successfully implement Sign in with Apple for your wedding RSVP application. The process is complex but provides a secure and user-friendly authentication experience for your guests.
