import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

// Initialize Firebase Admin SDK
initializeApp();

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

// Auth
export {generateMagicLink} from "./auth/generate-magic-link.js";
export {onUserCreate} from "./auth/on-user-create.js";
