import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let dbFirestore: Firestore | null = null;
let useFirestore = false;
let initPromise: Promise<void> | null = null;

export function disableFirestore() {
  useFirestore = false;
}

export async function getDbFirestore(): Promise<Firestore | null> {
  if (!initPromise) initPromise = initFirestore();
  await initPromise;
  return useFirestore ? dbFirestore : null;
}

export function isFirestoreEnabled() {
  return useFirestore && dbFirestore !== null;
}

async function initFirestore() {
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
    const databaseIdVar = process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId;

    console.log(`🔥 Initializing Firebase with Project ID: ${projectIdVar}`);

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
          initializeApp({ projectId: projectIdVar });
        }
      } else {
        initializeApp({ projectId: projectIdVar });
        console.log(`🔥 Firebase Admin initialized with Project ID: ${projectIdVar}`);
      }
    }

    // Try named database first, then default
    let successfulDb: Firestore | null = null;
    
    if (databaseIdVar && databaseIdVar !== '(default)') {
      try {
        console.log(`🔍 Attempting to connect to named Firestore database: ${databaseIdVar}`);
        const namedDb = getFirestore(databaseIdVar);
        // Verify it works by trying to list collections
        await namedDb.listCollections();
        successfulDb = namedDb;
        console.log(`✅ Successfully connected to Firestore named database: ${databaseIdVar}`);
      } catch (e: any) {
        console.warn(`⚠️ Named database ${databaseIdVar} failed: ${e.message}. Falling back to (default).`);
      }
    }

    if (!successfulDb) {
      try {
        console.log("🔍 Attempting to connect to default Firestore database...");
        const defaultDb = getFirestore();
        await defaultDb.listCollections();
        successfulDb = defaultDb;
        console.log("✅ Successfully connected to default Firestore database.");
      } catch (e: any) {
        console.error(`❌ Firestore initialization failed for default database: ${e.message}`);
        // If both failed, we still might have a non-working successfulDb, but initFirestore will catch the outer error
        throw e;
      }
    }

    dbFirestore = successfulDb;
    dbFirestore.settings({ ignoreUndefinedProperties: true });
    useFirestore = true;
    console.log("🔥 Firestore database connection established successfully.");
  } catch (error: any) {
    console.warn("⚠️ Warning: Firebase Admin failed to initialize. Error:", error.message);
    useFirestore = false;
  }
}

export { dbFirestore, useFirestore, Firestore };

