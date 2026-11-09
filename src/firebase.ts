import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);

// Enable offline persistence for Firestore
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence is not supported by this browser.');
    } else {
      console.warn('Firestore offline persistence error:', err);
    }
  });
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  const errStr = String(error).toLowerCase();
  const errCode = error && typeof error === 'object' && 'code' in error ? String((error as any).code).toLowerCase() : '';
  const isPermissionError = 
    errCode === 'permission-denied' || 
    errCode === 'unauthenticated' || 
    errStr.includes('permission') || 
    errStr.includes('insufficient') ||
    (error instanceof Error && (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('insufficient')));

  if (isPermissionError) {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Connection/Non-Permission Error (running in offline/tolerant mode): ', errInfo.error);
  }
}

export async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or initializing cache. Local IndexedDB persistence is active.");
    } else {
      console.log("Firebase status check:", error instanceof Error ? error.message : String(error));
    }
  }
}
