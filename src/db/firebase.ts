import fs from 'fs';
import path from 'path';
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
  let appletConfig: any = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.warn("Could not read firebase-applet-config.json:", e);
  }

  const projectIdVar = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || appletConfig.projectId || 'iconic-caldron-f7krv';
  const databaseIdVar = process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || 'ai-studio-csoj-42055485-0df2-442c-a19b-74afb9f5489f';

  const apps = getApps();
  if (apps.length === 0) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectIdVar
        });
        console.log("🔥 Firebase Admin initialized via service account credentials.");
      } catch (e: any) {
        console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON, trying direct initialization:", e.message);
        initializeApp({
          projectId: projectIdVar
        });
      }
    } else {
      initializeApp({
        projectId: projectIdVar
      });
      console.log(`🔥 Firebase Admin initialized with Project ID: ${projectIdVar}`);
    }
  }

  if (databaseIdVar) {
    dbFirestore = getFirestore(databaseIdVar);
    console.log(`🔥 Connected to Firestore named database: ${databaseIdVar}`);
  } else {
    dbFirestore = getFirestore();
    console.log("🔥 Connected to default Firestore database.");
  }

  dbFirestore.settings({ ignoreUndefinedProperties: true });
  useFirestore = true;
  console.log("🔥 Firestore database connection established successfully.");
} catch (error: any) {
  console.warn("⚠️ Warning: Firebase Admin failed to initialize. Firestore features will be disabled or fall back. Error:", error.message);
}

export { dbFirestore, useFirestore, Firestore };

