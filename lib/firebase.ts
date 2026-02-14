import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDptAi5FBbw5aSG8ZUVG4hdl5Oe9MBVDno",
  authDomain: "double-wit.firebaseapp.com",
  projectId: "double-wit",
  storageBucket: "double-wit.firebasestorage.app",
  messagingSenderId: "2191174521",
  appId: "1:2191174521:android:8819a0ee0fd26070cb5da8",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
let auth: ReturnType<typeof getAuth>;
try {
  auth = getAuth(app);
} catch {
  auth = getAuth(app);
}

const storage = getStorage(app);

// Auth functions
export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function registerWithEmail(
  email: string,
  password: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

export async function logoutFirebase() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// Storage functions
export async function uploadFile(
  userId: string,
  filePath: string,
  fileBlob: Blob,
  fileName: string
) {
  const storageRef = ref(storage, `users/${userId}/files/${fileName}`);
  const snapshot = await uploadBytes(storageRef, fileBlob);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return { downloadURL, fullPath: snapshot.ref.fullPath };
}

export async function getFileDownloadURL(path: string) {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

export async function listUserFiles(userId: string) {
  const storageRef = ref(storage, `users/${userId}/files`);
  const result = await listAll(storageRef);
  const files = await Promise.all(
    result.items.map(async (item) => {
      const url = await getDownloadURL(item);
      return {
        name: item.name,
        fullPath: item.fullPath,
        url,
      };
    })
  );
  return files;
}

export async function deleteFile(path: string) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export { auth, storage, app };
