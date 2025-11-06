// script.js — initialize Firebase (v9) and exports used across other modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ✅ Firebase configuration — ensure storageBucket uses .appspot.com
const firebaseConfig = {
  apiKey: "AIzaSyCXsyTLjLDM7wQ7TAcG3d3KSgPzWR-Hty4",
  authDomain: "luminaryframe-c80db.firebaseapp.com",
  projectId: "luminaryframe-c80db",
  storageBucket: "luminaryframe-c80db.appspot.com", // <-- corrected
  messagingSenderId: "1075557950621",
  appId: "1:1075557950621:web:30d0d86ceddbb8a2eee074",
  measurementId: "G-E6ZRPKCJSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// EmailJS init — emailjs is loaded as a global by index.html before this module
if (typeof emailjs !== "undefined" && emailjs.init) {
  try {
    emailjs.init("24wLt-L5koQCAR4cW"); // your public key
  } catch (e) {
    console.warn("EmailJS init failed:", e);
  }
}

// Small helper to upload a single file to Firebase Storage and return download URL
export async function uploadFileToFirebase(file) {
  if (!file) throw new Error("No file provided");
  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileRef = storageRef(storage, `uploads/${safeName}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Export core objects for other modules
export { app, db, storage };