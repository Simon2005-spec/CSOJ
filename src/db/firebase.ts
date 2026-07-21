import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let dbFirestore: Firestore | null = null;
let useFirestore = false;

export function disableFirestore() {
  useFirestore = false;
}

export function isFirestoreEnabled() {
  return useFirestore && dbFirestore !== null;
}

try {
  const apps = getApps();
  if (apps.length === 0) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectIdVar = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'iconic-caldron-f7krv';

    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectIdVar
        });
        console.log("🔥 Firebase Admin initialized via service account credentials.");
      } catch (e) {
        console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON, trying direct initialization:", e.message);
        initializeApp({
          projectId: projectIdVar
        });
      }
    } else {
      // Try default initialization (works ambiently in Cloud Run if Firestore is enabled)
      initializeApp({
        projectId: projectIdVar
      });
      console.log(`🔥 Firebase Admin initialized with Project ID: ${projectIdVar}`);
    }
  }

  dbFirestore = getFirestore();
  // Set basic settings
  dbFirestore.settings({ ignoreUndefinedProperties: true });
  useFirestore = true;
  console.log("🔥 Firestore database connection established successfully.");
} catch (error) {
  console.warn("⚠️ Warning: Firebase Admin failed to initialize. Firestore features will be disabled or fall back. Error:", error.message);
}

export { dbFirestore, useFirestore, Firestore };
