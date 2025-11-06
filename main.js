// main.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

/* ---------- Firebase config (from you) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCXsyTLjLDM7wQ7TAcG3d3KSgPzWR-Hty4",
  authDomain: "luminaryframe-c80db.firebaseapp.com",
  projectId: "luminaryframe-c80db",
  storageBucket: "luminaryframe-c80db.firebasestorage.app",
  messagingSenderId: "1075557950621",
  appId: "1:1075557950621:web:5da5e0c32c36526feee074",
  measurementId: "G-8VX425Y7YH"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const auth = getAuth();
const provider = new GoogleAuthProvider();
const db = getFirestore();
const storage = getStorage();

const authBtn = document.getElementById('auth-btn');
const adminLink = document.getElementById('admin-link');
const bookingForm = document.getElementById('booking-form');
const payBtn = document.getElementById('pay-btn');
const statusDiv = document.getElementById('status');

let currentUser = null;

authBtn.addEventListener('click', async () => {
  if (!currentUser) {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('Sign-in failed: ' + e.message);
    }
  } else {
    await signOut(auth);
  }
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    authBtn.textContent = 'Sign out ('+user.displayName+')';
    // show admin link if admin email
    if (user.email === 'mallikabdurrahman37@gmail.com') {
      adminLink.style.display = 'inline-block';
    }
  } else {
    authBtn.textContent = 'Sign in with Google';
    adminLink.style.display = 'none';
  }
});

function showStatus(msg, isError = false) {
  statusDiv.textContent = msg;
  statusDiv.style.color = isError ? '#ff8b8b' : '';
}

/* UPI payment link builder */
function buildUpiLink(payee, name, amount, note='LuminaryFrame Booking') {
  // UPI deep link URI
  const url = new URL('upi://pay');
  url.searchParams.set('pa', payee);
  url.searchParams.set('pn', name);
  url.searchParams.set('tn', note);
  url.searchParams.set('am', amount);
  url.searchParams.set('cu', 'INR');
  return url.toString();
}

/* Upload file, create booking doc */
payBtn.addEventListener('click', async () => {
  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const appChoice = document.getElementById('app').value;
  const style = document.getElementById('style').value;
  const fileInput = document.getElementById('clip');
  const price = document.getElementById('price').value;

  if (!fileInput.files.length) {
    showStatus('Please choose a video file to upload.', true);
    return;
  }

  // ask user to pay: build UPI link and open
  const upi = '9239529167@fam';
  const upiLink = buildUpiLink(upi, 'LuminaryFrame', price.toString(), `Booking for ${name}`);
  // open UPI (will open installed UPI app)
  window.location.href = upiLink;

  showStatus('UPI opened. After payment completes, the upload will start. If your UPI app does not return, come back and press "Confirm Upload" (we auto-continue).');

  // We proceed to upload and create booking as "pending" — admin must verify payment
  try {
    showStatus('Uploading clip...');

    const file = fileInput.files[0];
    const ext = file.name.split('.').pop();
    const storagePath = `bookings/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const sRef = storageRef(storage, storagePath);
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        showStatus(`Uploading clip: ${progress}%`);
      },
      (error) => {
        console.error(error);
        showStatus('Upload failed: ' + error.message, true);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        // create a booking document in Firestore
        const bookingsCol = collection(db, 'bookings');
        const docRef = await addDoc(bookingsCol, {
          name,
          email,
          phone,
          appChoice,
          style,
          price: Number(price),
          clipUrl: downloadURL,
          clipPath: storagePath,
          status: 'pending', // admin will confirm after checking UPI
          createdAt: serverTimestamp(),
          customerUid: currentUser ? currentUser.uid : null
        });

        showStatus('Booking submitted and file uploaded. Booking ID: ' + docRef.id);
      }
    );

  } catch (err) {
    console.error(err);
    showStatus('Error: ' + err.message, true);
  }
});// Smooth fade-in when scrolling
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
  threshold: 0.3
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('appear');
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach(fader => {
  appearOnScroll.observe(fader);
});// Firebase Imports (add this after your initializeApp line)
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);// Firebase Imports (add this after your initializeApp line)
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);