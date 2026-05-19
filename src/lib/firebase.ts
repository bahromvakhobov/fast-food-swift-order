import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseEnvVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);

if (missingFirebaseEnvVars.length > 0) {
  console.warn(
    `Firebase config is incomplete. Missing: ${missingFirebaseEnvVars.join(', ')}. Firestore order features will fail until .env is configured.`,
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


// -----------------------------------------------------------------------------
// DEBUG CHECK
// -----------------------------------------------------------------------------

function checkFirebaseConfig() {
  const keys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId"
  ] as const;

  const missing = keys.filter(k => !firebaseConfig[k]);

  console.log("📋 Firebase Config Check:");
  console.log("--------------------------------------------------");
  console.log("Missing keys:", missing.length > 0 ? missing : "None ✅");
  console.log("Full config:", JSON.stringify(firebaseConfig, null, 2));

  if (missing.length > 0) {
    console.error("❌ Firebase init FAILED - missing env vars!");
  } else {
    console.log("✅ Firebase config loaded successfully.");
  }
  console.log("--------------------------------------------------");
}

// Run check after a short delay
setTimeout(checkFirebaseConfig, 500);
