import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configuration from firebase-applet-config.json
export const firebaseConfig = {
  apiKey: "AIzaSyD8j0Y0G7c8EXjPEOv592MwFpqP3O4Bn-8",
  authDomain: "promote-b4836.firebaseapp.com",
  projectId: "promote-b4836",
  storageBucket: "promote-b4836.firebasestorage.app",
  messagingSenderId: "102722636633",
  appId: "1:102722636633:web:01502a30b78486d3ac9a48",
  measurementId: "G-5ZB8RPFV8P",
  firestoreDatabaseId: "ai-studio-remixremix-b7816f08-e069-4688-8e93-9dba97faf135",
  oAuthClientId: "102722636633-hhoup1r3p8q5v68o65gso28di4seudch.apps.googleusercontent.com",
};

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the exact provisioned database ID & Auth
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'systemSettings', 'current'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client offline or initial connection pending:", error);
    }
    return false;
  }
}
