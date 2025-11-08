// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Replace with your provided config (kept as you gave it)
const firebaseConfig = {
  apiKey: "AIzaSyCXsyTLjLDM7wQ7TAcG3d3KSgPzWR-Hty4",
  authDomain: "luminaryframe-c80db.firebaseapp.com",
  projectId: "luminaryframe-c80db",
  storageBucket: "luminaryframe-c80db.appspot.com",
  messagingSenderId: "1075557950621",
  appId: "1:1075557950621:web:30d0d86ceddbb8a2eee074",
  measurementId: "G-E6ZRPKCJSH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Storage is optional — if you plan to keep storage removed, ignore it.
// If you don't want storage at all, you can still import this file and ignore the "storage" export.
let storage;
try {
  storage = getStorage(app);
} catch (e) {
  // If getStorage fails because hosting/plan doesn't allow it, storage will be undefined.
  console.warn("Firebase Storage not available or not initialized.", e);
}

export { app, auth, db, storage };