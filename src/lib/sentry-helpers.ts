import * as Sentry from '@sentry/nextjs';
import { User } from 'firebase/auth';
import { AuthError } from 'firebase/auth';

/**
 * Custom error classes for better error categorization in Sentry
 */
export class AuthenticationError extends Error {
  constructor(message: string, public readonly provider?: string, public readonly code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RSVPFormError extends Error {
  constructor(message: string, public readonly operation?: string) {
    super(message);
    this.name = 'RSVPFormError';
  }
}

export class FirestoreOperationError extends Error {
  constructor(message: string, public readonly operation?: string, public readonly collection?: string) {
    super(message);
    this.name = 'FirestoreOperationError';
  }
}

/**
 * Error categories for tagging
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  RSVP_FORM = 'rsvp_form',
  FIRESTORE = 'firestore',
  NETWORK = 'network',
  VALIDATION = 'validation',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Set user context in Sentry for tracking
 */
export function setSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.uid,
      email: user.email || undefined,
      username: user.displayName || undefined,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb to track user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an authentication error with context
 */
export function captureAuthError(
  error: Error | AuthError,
  provider: 'google' | 'apple' | 'logout',
  additionalContext?: Record<string, unknown>
) {
  const authError = error as AuthError;
  const errorCode = authError.code || 'unknown';
  const errorMessage = authError.message || error.message;

  // Add breadcrumb
  addSentryBreadcrumb(
    `Authentication failed: ${provider}`,
    ErrorCategory.AUTHENTICATION,
    'error',
    { provider, errorCode }
  );

  // Create custom error
  const customError = new AuthenticationError(errorMessage, provider, errorCode);

  // Capture with context
  Sentry.captureException(customError, {
    tags: {
      category: ErrorCategory.AUTHENTICATION,
      provider,
      error_code: errorCode,
    },
    contexts: {
      authentication: {
        provider,
        error_code: errorCode,
        ...additionalContext,
      },
    },
    level: 'error',
  });

  return customError;
}

/**
 * Capture an RSVP form error with context
 */
export function captureRSVPError(
  error: Error,
  operation: 'auto_save' | 'submit' | 'load' | 'validate',
  formState?: {
    isDirty?: boolean;
    isValid?: boolean;
    fieldCount?: number;
    errors?: Record<string, string>;
  },
  additionalContext?: Record<string, unknown>
) {
  // Add breadcrumb
  addSentryBreadcrumb(
    `RSVP form error: ${operation}`,
    ErrorCategory.RSVP_FORM,
    'error',
    { operation, ...formState }
  );

  // Create custom error
  const customError = new RSVPFormError(error.message, operation);

  // Sanitize errors object to remove any sensitive data
  const sanitizedErrors = formState?.errors
    ? Object.keys(formState.errors).reduce((acc, key) => {
        acc[key] = 'validation_error';
        return acc;
      }, {} as Record<string, string>)
    : undefined;

  // Capture with context
  Sentry.captureException(customError, {
    tags: {
      category: ErrorCategory.RSVP_FORM,
      operation,
      is_valid: formState?.isValid,
      is_dirty: formState?.isDirty,
    },
    contexts: {
      rsvp_form: {
        operation,
        field_count: formState?.fieldCount,
        has_errors: !!formState?.errors && Object.keys(formState.errors).length > 0,
        error_fields: sanitizedErrors,
        ...additionalContext,
      },
    },
    level: operation === 'auto_save' ? 'warning' : 'error',
  });

  return customError;
}

/**
 * Capture a Firestore operation error with context
 */
export function captureFirestoreError(
  error: Error,
  operation: 'read' | 'write' | 'update' | 'delete' | 'subscribe',
  collection: string,
  documentId?: string,
  additionalContext?: Record<string, unknown>
) {
  // Add breadcrumb
  addSentryBreadcrumb(
    `Firestore error: ${operation} on ${collection}`,
    ErrorCategory.FIRESTORE,
    'error',
    { operation, collection, documentId }
  );

  // Create custom error
  const customError = new FirestoreOperationError(error.message, operation, collection);

  // Capture with context
  Sentry.captureException(customError, {
    tags: {
      category: ErrorCategory.FIRESTORE,
      operation,
      collection,
    },
    contexts: {
      firestore: {
        operation,
        collection,
        document_id: documentId,
        ...additionalContext,
      },
    },
    level: 'error',
  });

  return customError;
}

/**
 * Start a Sentry span for performance tracking
 */
export async function withSentrySpan<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name,
      op: operation,
      ...(tags && { tags }),
    },
    callback
  );
}

/**
 * Track form field interaction
 */
export function trackFormFieldInteraction(
  fieldName: string,
  action: 'focus' | 'blur' | 'change' | 'error',
  value?: unknown
) {
  addSentryBreadcrumb(
    `Form field ${action}: ${fieldName}`,
    'form.interaction',
    'info',
    {
      field: fieldName,
      action,
      has_value: value !== undefined && value !== null && value !== '',
    }
  );
}

/**
 * Track authentication flow
 */
export function trackAuthFlow(
  stage: 'started' | 'completed' | 'failed' | 'cancelled',
  provider: 'google' | 'apple' | 'logout'
) {
  addSentryBreadcrumb(
    `Auth ${stage}: ${provider}`,
    'auth.flow',
    stage === 'failed' ? 'error' : 'info',
    { stage, provider }
  );
}

/**
 * Capture a generic error with custom category
 */
export function captureCustomError(
  error: Error,
  category: ErrorCategory,
  additionalTags?: Record<string, string>,
  additionalContext?: Record<string, unknown>,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
) {
  Sentry.captureException(error, {
    tags: {
      category,
      ...additionalTags,
    },
    contexts: {
      custom: additionalContext,
    },
    level,
  });
}

