;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="9a4afd78-bcda-7cdf-96b4-6e9815808337")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/firebase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "app",
    ()=>app,
    "appleProvider",
    ()=>appleProvider,
    "auth",
    ()=>auth,
    "googleProvider",
    ()=>googleProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.1_@babel+core@7.28.5_@opentelemetry+api@1.9.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// Import the functions you need from the SDKs you need
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$firebase$40$12$2e$7$2e$0$2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/firebase@12.7.0/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@firebase+app@0.14.6/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$firebase$40$12$2e$7$2e$0$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/firebase@12.7.0/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@firebase+auth@1.12.0_@firebase+app@0.14.6/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyBcC4WAz6AmNLJBrLReKy_MxGv6QblA8QM"),
    authDomain: "boda-en-tarifa.firebaseapp.com",
    projectId: "boda-en-tarifa",
    storageBucket: "boda-en-tarifa.firebasestorage.app",
    messagingSenderId: "501055602355",
    appId: ("TURBOPACK compile-time value", "1:501055602355:web:4648f668270c941ce13ac6"),
    measurementId: ("TURBOPACK compile-time value", "G-L8QCZ4MF7J")
};
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig);
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])(app);
const googleProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoogleAuthProvider"]();
const appleProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthProvider"]('apple.com');
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/sentry-helpers.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthenticationError",
    ()=>AuthenticationError,
    "ErrorCategory",
    ()=>ErrorCategory,
    "ErrorSeverity",
    ()=>ErrorSeverity,
    "FirestoreOperationError",
    ()=>FirestoreOperationError,
    "RSVPFormError",
    ()=>RSVPFormError,
    "addSentryBreadcrumb",
    ()=>addSentryBreadcrumb,
    "captureAuthError",
    ()=>captureAuthError,
    "captureCustomError",
    ()=>captureCustomError,
    "captureFirestoreError",
    ()=>captureFirestoreError,
    "captureRSVPError",
    ()=>captureRSVPError,
    "setSentryUser",
    ()=>setSentryUser,
    "trackAuthFlow",
    ()=>trackAuthFlow,
    "trackFormFieldInteraction",
    ()=>trackFormFieldInteraction,
    "withSentrySpan",
    ()=>withSentrySpan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+core@10.32.1/node_modules/@sentry/core/build/esm/exports.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$breadcrumbs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+core@10.32.1/node_modules/@sentry/core/build/esm/breadcrumbs.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$32$2e$1_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$_115f18342b0974a4235706b70d60b89b$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$common$2f$utils$2f$nextSpan$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.32.1_@opentelemetry+context-async-hooks@2.2.0_@opentelemetry+api@1.9._115f18342b0974a4235706b70d60b89b/node_modules/@sentry/nextjs/build/esm/common/utils/nextSpan.js [app-client] (ecmascript)");
;
class AuthenticationError extends Error {
    provider;
    code;
    constructor(message, provider, code){
        super(message), this.provider = provider, this.code = code;
        this.name = 'AuthenticationError';
    }
}
class RSVPFormError extends Error {
    operation;
    constructor(message, operation){
        super(message), this.operation = operation;
        this.name = 'RSVPFormError';
    }
}
class FirestoreOperationError extends Error {
    operation;
    collection;
    constructor(message, operation, collection){
        super(message), this.operation = operation, this.collection = collection;
        this.name = 'FirestoreOperationError';
    }
}
var ErrorCategory = /*#__PURE__*/ function(ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["RSVP_FORM"] = "rsvp_form";
    ErrorCategory["FIRESTORE"] = "firestore";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["VALIDATION"] = "validation";
    return ErrorCategory;
}({});
var ErrorSeverity = /*#__PURE__*/ function(ErrorSeverity) {
    ErrorSeverity["FATAL"] = "fatal";
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["INFO"] = "info";
    return ErrorSeverity;
}({});
function setSentryUser(user) {
    if (user) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setUser"]({
            id: user.uid,
            email: user.email || undefined,
            username: user.displayName || undefined
        });
    } else {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setUser"](null);
    }
}
function addSentryBreadcrumb(message, category, level = 'info', data) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$breadcrumbs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addBreadcrumb"]({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000
    });
}
function captureAuthError(error, provider, additionalContext) {
    const authError = error;
    const errorCode = authError.code || 'unknown';
    const errorMessage = authError.message || error.message;
    // Add breadcrumb
    addSentryBreadcrumb(`Authentication failed: ${provider}`, "authentication", 'error', {
        provider,
        errorCode
    });
    // Create custom error
    const customError = new AuthenticationError(errorMessage, provider, errorCode);
    // Capture with context
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureException"](customError, {
        tags: {
            category: "authentication",
            provider,
            error_code: errorCode
        },
        contexts: {
            authentication: {
                provider,
                error_code: errorCode,
                ...additionalContext
            }
        },
        level: 'error'
    });
    return customError;
}
function captureRSVPError(error, operation, formState, additionalContext) {
    // Add breadcrumb
    addSentryBreadcrumb(`RSVP form error: ${operation}`, "rsvp_form", 'error', {
        operation,
        ...formState
    });
    // Create custom error
    const customError = new RSVPFormError(error.message, operation);
    // Sanitize errors object to remove any sensitive data
    const sanitizedErrors = formState?.errors ? Object.keys(formState.errors).reduce((acc, key)=>{
        acc[key] = 'validation_error';
        return acc;
    }, {}) : undefined;
    // Capture with context
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureException"](customError, {
        tags: {
            category: "rsvp_form",
            operation,
            is_valid: formState?.isValid,
            is_dirty: formState?.isDirty
        },
        contexts: {
            rsvp_form: {
                operation,
                field_count: formState?.fieldCount,
                has_errors: !!formState?.errors && Object.keys(formState.errors).length > 0,
                error_fields: sanitizedErrors,
                ...additionalContext
            }
        },
        level: operation === 'auto_save' ? 'warning' : 'error'
    });
    return customError;
}
function captureFirestoreError(error, operation, collection, documentId, additionalContext) {
    // Add breadcrumb
    addSentryBreadcrumb(`Firestore error: ${operation} on ${collection}`, "firestore", 'error', {
        operation,
        collection,
        documentId
    });
    // Create custom error
    const customError = new FirestoreOperationError(error.message, operation, collection);
    // Capture with context
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureException"](customError, {
        tags: {
            category: "firestore",
            operation,
            collection
        },
        contexts: {
            firestore: {
                operation,
                collection,
                document_id: documentId,
                ...additionalContext
            }
        },
        level: 'error'
    });
    return customError;
}
async function withSentrySpan(name, operation, callback, tags) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$32$2e$1_$40$opentelemetry$2b$context$2d$async$2d$hooks$40$2$2e$2$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$_115f18342b0974a4235706b70d60b89b$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$common$2f$utils$2f$nextSpan$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startSpan"]({
        name,
        op: operation,
        ...tags && {
            tags
        }
    }, callback);
}
function trackFormFieldInteraction(fieldName, action, value) {
    addSentryBreadcrumb(`Form field ${action}: ${fieldName}`, 'form.interaction', 'info', {
        field: fieldName,
        action,
        has_value: value !== undefined && value !== null && value !== ''
    });
}
function trackAuthFlow(stage, provider) {
    addSentryBreadcrumb(`Auth ${stage}: ${provider}`, 'auth.flow', stage === 'failed' ? 'error' : 'info', {
        stage,
        provider
    });
}
function captureCustomError(error, category, additionalTags, additionalContext, level = 'error') {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$core$40$10$2e$32$2e$1$2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureException"](error, {
        tags: {
            category,
            ...additionalTags
        },
        contexts: {
            custom: additionalContext
        },
        level
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.1_@babel+core@7.28.5_@opentelemetry+api@1.9.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.1_@babel+core@7.28.5_@opentelemetry+api@1.9.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$firebase$40$12$2e$7$2e$0$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/firebase@12.7.0/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@firebase+auth@1.12.0_@firebase+app@0.14.6/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sentry-helpers.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], {
                "AuthProvider.useEffect.unsubscribe": (user)=>{
                    setUser(user);
                    setLoading(false);
                    // Update Sentry user context
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setSentryUser"])(user);
                }
            }["AuthProvider.useEffect.unsubscribe"]);
            return ({
                "AuthProvider.useEffect": ()=>unsubscribe()
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const signInWithGoogle = async ()=>{
        try {
            setError(null);
            setLoading(true);
            // Track authentication flow start
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('started', 'google');
            // Perform sign-in with performance tracking
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withSentrySpan"])('Google Sign-In', 'auth.signin.google', async ()=>{
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithPopup"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["googleProvider"]);
            }, {
                provider: 'google'
            });
            // Track successful completion
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('completed', 'google');
        } catch (error) {
            const authError = error;
            // Track failed authentication
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('failed', 'google');
            // Capture error in Sentry with context
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureAuthError"])(authError, 'google', {
                error_message: authError.message,
                error_code: authError.code
            });
            // Set user-friendly error message
            const userMessage = getFriendlyAuthErrorMessage(authError, 'Google');
            setError(userMessage);
            console.error('Google sign-in error:', authError);
        } finally{
            setLoading(false);
        }
    };
    const signInWithApple = async ()=>{
        try {
            setError(null);
            setLoading(true);
            // Track authentication flow start
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('started', 'apple');
            // Perform sign-in with performance tracking
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withSentrySpan"])('Apple Sign-In', 'auth.signin.apple', async ()=>{
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithPopup"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appleProvider"]);
            }, {
                provider: 'apple'
            });
            // Track successful completion
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('completed', 'apple');
        } catch (error) {
            const authError = error;
            // Track failed authentication
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('failed', 'apple');
            // Capture error in Sentry with context
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureAuthError"])(authError, 'apple', {
                error_message: authError.message,
                error_code: authError.code
            });
            // Set user-friendly error message
            const userMessage = getFriendlyAuthErrorMessage(authError, 'Apple');
            setError(userMessage);
            console.error('Apple sign-in error:', authError);
        } finally{
            setLoading(false);
        }
    };
    const logout = async ()=>{
        try {
            setError(null);
            // Track logout flow start
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('started', 'logout');
            // Perform logout with performance tracking
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withSentrySpan"])('User Logout', 'auth.logout', async ()=>{
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$firebase$2b$auth$40$1$2e$12$2e$0_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
            });
            // Clear Sentry user context
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setSentryUser"])(null);
            // Track successful completion
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('completed', 'logout');
        } catch (error) {
            const authError = error;
            // Track failed logout
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackAuthFlow"])('failed', 'logout');
            // Capture error in Sentry
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2d$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureAuthError"])(authError, 'logout');
            setError('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
            console.error('Logout error:', authError);
        }
    };
    const value = {
        user,
        loading,
        signInWithGoogle,
        signInWithApple,
        logout,
        error
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 174,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "PA9FxEY9xSNRrsSqaLtbYei52Hs=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_$40$babel$2b$core$40$7$2e$28$2e$5_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
/**
 * Convert Firebase auth errors to user-friendly messages
 */ function getFriendlyAuthErrorMessage(error, provider) {
    const errorCode = error.code;
    switch(errorCode){
        case 'auth/popup-closed-by-user':
            return `Has cerrado la ventana de ${provider}. Por favor, inténtalo de nuevo.`;
        case 'auth/popup-blocked':
            return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e inténtalo de nuevo.';
        case 'auth/cancelled-popup-request':
            return 'Autenticación cancelada. Por favor, inténtalo de nuevo.';
        case 'auth/network-request-failed':
            return 'Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Por favor, espera unos minutos e inténtalo de nuevo.';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte.';
        case 'auth/account-exists-with-different-credential':
            return 'Ya existe una cuenta con este correo electrónico usando un método diferente.';
        default:
            return `Error al iniciar sesión con ${provider}. Por favor, inténtalo de nuevo.`;
    }
}
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=9a4afd78-bcda-7cdf-96b4-6e9815808337
//# sourceMappingURL=src_f8358b35._.js.map