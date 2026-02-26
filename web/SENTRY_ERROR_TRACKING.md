# Sentry Error Tracking Implementation

## Overview

This document describes the comprehensive Sentry error tracking implementation for the Boda en Tarifa wedding website, specifically covering authentication flows and RSVP form operations.

## Implementation Summary

### ✅ Completed Features

1. **Sentry Utility Helpers** (`src/lib/sentry-helpers.ts`)
   - Custom error classes for better categorization
   - User context tracking
   - Breadcrumb tracking for user journey
   - Specialized error capture functions
   - Performance monitoring with spans

2. **Authentication Error Tracking** (`src/contexts/AuthContext.tsx`)
   - Google Sign-In error tracking
   - Apple Sign-In error tracking
   - Logout error tracking
   - User-friendly error messages in Spanish
   - Performance monitoring for auth operations

3. **RSVP Form Error Tracking** (`src/lib/hooks/useRSVPForm.ts`)
   - Auto-save error tracking
   - Form submission error tracking
   - Data loading error tracking
   - Validation error tracking
   - Form field interaction tracking

4. **RSVP Component Error Tracking** (`src/components/rsvp/SpanishRSVPForm.tsx`)
   - Component-level error tracking
   - Form submission tracking
   - Form cancellation tracking

5. **Firestore Operation Tracking** (`src/lib/firestore.ts`)
   - Read operation error tracking
   - Write operation error tracking
   - Update operation error tracking
   - Delete operation error tracking
   - Real-time subscription error tracking

## Error Categories

Errors are tagged with the following categories for easy filtering in Sentry:

- `authentication` - Firebase Auth errors (Google, Apple, logout)
- `rsvp_form` - RSVP form operations (submit, auto-save, load, validate)
- `firestore` - Database operations (read, write, update, delete, subscribe)
- `network` - Network-related errors
- `validation` - Form validation errors

## Key Features

### 1. User Context Tracking

Every error captured includes user context when available:
- User ID
- Email address
- Display name

This is automatically set when a user signs in and cleared when they sign out.

### 2. Breadcrumb Tracking

User actions are tracked as breadcrumbs, providing context for errors:
- Authentication flow stages (started, completed, failed)
- Form field interactions (focus, blur, change)
- Auto-save attempts
- Form submissions
- Data loading operations

### 3. Performance Monitoring

Critical operations are wrapped in Sentry spans for performance tracking:
- Sign-in operations (Google, Apple)
- RSVP form submission
- Auto-save operations
- Firestore read/write operations

### 4. Custom Error Classes

Three custom error classes for better error organization:
- `AuthenticationError` - Authentication-related errors
- `RSVPFormError` - Form operation errors
- `FirestoreOperationError` - Database operation errors

### 5. Context-Rich Error Reports

Each error includes relevant context:
- **Authentication errors**: Provider, error code, error message
- **RSVP errors**: Operation type, form state, field count, validation errors
- **Firestore errors**: Operation type, collection, document ID

## Testing the Implementation

### 1. Test Authentication Errors

#### Google Sign-In Error
1. Open the app in your browser
2. Click "Continue with Google"
3. Close the popup window without completing sign-in
4. Check Sentry dashboard for error with:
   - Category: `authentication`
   - Provider: `google`
   - Error code: `auth/popup-closed-by-user`

#### Apple Sign-In Error
1. Click "Continue with Apple"
2. Cancel the authentication
3. Check Sentry dashboard for error with:
   - Category: `authentication`
   - Provider: `apple`

### 2. Test RSVP Form Errors

#### Form Validation Error
1. Sign in successfully
2. Navigate to RSVP form
3. Try to submit without filling required fields
4. Check Sentry dashboard for validation error with:
   - Category: `rsvp_form`
   - Operation: `validate`
   - Validation error fields listed

#### Auto-Save Error (Simulated)
To test auto-save error tracking, you would need to:
1. Temporarily disable network or Firestore
2. Fill out the form
3. Wait for auto-save to trigger
4. Check Sentry for auto-save error

#### Form Submission Error (Simulated)
1. Fill out the form completely
2. Temporarily disable network
3. Try to submit
4. Check Sentry for submission error with full context

### 3. Test Firestore Errors

#### Read Error (Simulated)
To test Firestore read errors:
1. Temporarily modify Firestore security rules to deny access
2. Try to load RSVP form
3. Check Sentry for read operation error

### 4. Test Performance Monitoring

1. Complete a full sign-in flow
2. Fill out and submit RSVP form
3. Check Sentry Performance dashboard for:
   - `Google Sign-In` span
   - `Apple Sign-In` span (if tested)
   - `RSVP Form Submit` span
   - `RSVP Auto-Save` span
   - `Load RSVP Data` span

## Viewing Errors in Sentry

### Dashboard Access
Your Sentry dashboard is available at:
https://misfitcoders.sentry.io/issues/?project=4510472752005120

### Filtering Errors

**By Category:**
```
category:authentication
category:rsvp_form
category:firestore
```

**By Provider:**
```
provider:google
provider:apple
```

**By Operation:**
```
operation:submit
operation:auto_save
operation:load
```

**By User:**
```
user.id:USER_UID
user.email:user@example.com
```

## Breadcrumb Trail Examples

### Successful RSVP Submission
1. `auth.flow` - Auth started: google
2. `auth.flow` - Auth completed: google
3. `rsvp.component` - RSVP form component loading data
4. `rsvp.component` - RSVP form data loaded
5. `form.interaction` - Form field change: attendance
6. `form.interaction` - Form field change: nightsStaying
7. `rsvp.autosave` - RSVP auto-save started
8. `rsvp.autosave` - RSVP auto-save successful
9. `rsvp.component` - RSVP form submit button clicked
10. `rsvp.submit` - RSVP form submission started
11. `rsvp.component` - RSVP form submitted successfully

### Failed Authentication
1. `auth.flow` - Auth started: google
2. `auth.flow` - Auth failed: google
3. Error captured: `AuthenticationError` with error code

## Error Message Translations

User-facing error messages are in Spanish. The implementation includes friendly error messages for common Firebase Auth errors:

- `auth/popup-closed-by-user` → "Has cerrado la ventana de Google/Apple..."
- `auth/popup-blocked` → "La ventana emergente fue bloqueada..."
- `auth/network-request-failed` → "Error de conexión..."
- `auth/too-many-requests` → "Demasiados intentos..."

## Best Practices

### 1. Privacy & Security
- User emails and IDs are tracked but form content is sanitized
- Validation errors are tracked by field name only, not content
- No sensitive form data (like dietary restrictions) is sent to Sentry

### 2. Error Severity Levels
- `fatal` - Critical system errors
- `error` - Standard errors that affect user experience
- `warning` - Auto-save failures and non-critical issues
- `info` - Informational breadcrumbs

### 3. Performance Monitoring
- All critical operations are wrapped in spans
- Performance data helps identify slow operations
- Helps optimize user experience

## Maintenance

### Adding New Error Tracking

To add error tracking to a new component or operation:

1. Import Sentry helpers:
```typescript
import { 
  captureCustomError, 
  addSentryBreadcrumb,
  withSentrySpan 
} from '@/lib/sentry-helpers';
```

2. Add breadcrumb before operation:
```typescript
addSentryBreadcrumb(
  'Operation description',
  'category.subcategory',
  'info',
  { contextData: 'value' }
);
```

3. Wrap operation with span for performance:
```typescript
await withSentrySpan(
  'Operation Name',
  'operation.type',
  async () => {
    // Your operation here
  }
);
```

4. Capture errors:
```typescript
catch (error) {
  captureCustomError(
    error as Error,
    ErrorCategory.YOUR_CATEGORY,
    { custom: 'tags' },
    { additional: 'context' }
  );
}
```

## Configuration

Sentry configuration files:
- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `src/instrumentation.ts` - Instrumentation setup
- `next.config.ts` - Next.js integration with `withSentryConfig`

Current settings:
- `tracesSampleRate: 1` - All transactions are tracked (adjust in production)
- `enableLogs: true` - Logs are sent to Sentry
- `sendDefaultPii: true` - User info is included

## Troubleshooting

### Errors not appearing in Sentry

1. Check browser console for Sentry connectivity
2. Verify DSN is correct in config files
3. Check ad-blocker isn't blocking Sentry
4. Verify environment variables are set correctly

### Performance data not showing

1. Ensure `tracesSampleRate` is > 0
2. Check that operations are wrapped in `withSentrySpan`
3. Verify Sentry Performance is enabled for your project

### User context not showing

1. Verify `setSentryUser()` is called after authentication
2. Check that `sendDefaultPii: true` is set
3. Ensure user object has required fields (uid, email)

## Next Steps

### Recommended Improvements

1. **Production Configuration**
   - Reduce `tracesSampleRate` to 0.1 (10%) for production
   - Set up environments (development, staging, production)
   - Configure release tracking

2. **Alerts & Notifications**
   - Set up Slack/email alerts for critical errors
   - Configure error rate thresholds
   - Set up weekly error reports

3. **Additional Tracking**
   - Add Session Replay for visual debugging
   - Track custom metrics (form completion rate, etc.)
   - Add source maps for better stack traces

4. **Error Recovery**
   - Implement automatic retry logic for network errors
   - Add offline support with queue for auto-save
   - Implement better error recovery flows

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://misfitcoders.sentry.io/issues/?project=4510472752005120)
- [Firebase Auth Errors](https://firebase.google.com/docs/reference/js/auth#autherrorcodes)

## Support

For questions or issues with Sentry implementation:
1. Check this documentation
2. Review Sentry documentation
3. Check Sentry dashboard for connectivity issues
4. Contact team for assistance

