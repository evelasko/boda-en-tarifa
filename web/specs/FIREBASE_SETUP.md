# Firebase Authentication Setup Guide

## Prerequisites

1. Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Authentication enabled in your Firebase project

## Steps to Enable Google Sign-In

### 1. Enable Authentication in Firebase Console

1. Go to your Firebase project console
2. Navigate to **Authentication** > **Sign-in method**
3. Click on **Google** provider
4. Toggle **Enable** to ON
5. Add your project's **Web SDK configuration** (optional but recommended)
6. Click **Save**

### 2. Configure Authorized Domains

1. In the **Authentication** > **Settings** tab
2. Add your domains to **Authorized domains**:
   - `localhost` (for development)
   - `bodaentarifa.com` (your production domain)
   - Any other domains you'll use

### 3. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Get your Firebase configuration from **Project Settings** > **General** > **Your apps**
3. Update `.env.local` with your actual values:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   ```

### 4. Test the Implementation

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/rsvp` in your browser
3. You should see the Google Sign-In button
4. Click it to test the authentication flow

## Security Notes

- Never commit your `.env.local` file to version control
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- Firebase handles the security of the authentication flow

## Troubleshooting

- If you get "This app is not verified" warning, you can proceed for testing
- For production, you'll need to verify your app with Google
- Make sure your domain is added to authorized domains in Firebase Console

## Next Steps

- Add Sign in with Apple (future enhancement)
- Customize the RSVP form fields
- Add form validation and submission logic
