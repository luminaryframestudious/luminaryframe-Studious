// admin.js
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
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  deleteObject,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

/* Firebase config */
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

const adminSigninBtn = document.getElementById('admin-signin');
const signoutBtn = document.getElementById('signout');
const bookingsEl = document.getElementById('bookings');

let unsubscribeBookings = null;

adminSigninBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert('Sign-in error: ' + e.message);
    console.error(e);
  }
});

signoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

/* Only allow the admin email */
const ADMIN_EMAIL = 'mallikabdurrahman37@gmail.com';

onAuthStateChanged(auth, async user => {
  if (user && user.email === ADMIN_EMAIL) {
    adminSigninBtn.style.display = 'none';
    signoutBtn.style.display = 'inline-block';
    loadBookings();
  } else {
    adminSigninBtn.style.display = 'inline-block';
    signoutBtn.style.display = 'none';
    bookingsEl.innerHTML = '<p>Please sign in as admin to view bookings.</p>';
    if (unsubscribeBookings) unsubscribeBookings();
  }
});

/* Load bookings in real-time */
function loadBookings() {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  if (unsubscribeBookings) unsubscribeBookings();

  unsubscribeBookings = onSnapshot(q, snapshot => {
    if (snapshot.empty) {
      bookingsEl.innerHTML = '<p>No bookings yet.</p>';
      return;
    }
    bookingsEl.innerHTML = '';
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const el = bookingCard(id, data);
      bookingsEl.appendChild(el);
    });
  }, err => {
    console.error(err);
    bookingsEl.innerHTML = '<p>Error loading bookings: ' + err.message + '</p>';
  });
}

/* Create a booking card element */
function bookingCard(id, data) {
  const container = document.createElement('div');
  container.className = 'booking';

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <strong>${data.name || ''}</strong> (${data.email || ''})<br/>
        <small>${data.appChoice} — ${data.style}</small><br/>
        <small>Price: ₹${data.price || '--'}</small><br/>
        <small>Status: <em id="status-${id}">${data.status || 'pending'}</em></small>
      </div>
      <div style="text-align:right">
        <button data-id="${id}" class="btn btn-primary" id="mark-paid-${id}">Mark Paid</button>
        <button data-id="${id}" class="btn btn-ghost" id="download-${id}">Open Clip</button>
        <button data-id="${id}" class="btn btn-ghost" id="delete-${id}">Delete</button>
      </div>
    </div>
    <pre style="margin-top:10px">${data.phone ? 'Phone: '+data.phone + '\n' : ''}Booking ID: ${id}</pre>
  `;
  container.innerHTML = html;

  // Mark paid
  container.querySelector(`#mark-paid-${id}`).addEventListener('click', async () => {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, { status: 'paid' });
    container.querySelector(`#status-${id}`).textContent = 'paid';
  });

  // Open clip
  container.querySelector(`#download-${id}`).addEventListener('click', async () => {
    try {
      if (!data.clipUrl) {
        alert('No clip URL available.');
        return;
      }
      window.open(data.clipUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Error opening clip: ' + err.message);
    }
  });

  // Delete booking (and file)
  container.querySelector(`#delete-${id}`).addEventListener('click', async () => {
    if (!confirm('Delete booking and its file? This cannot be undone.')) return;
    try {
      if (data.clipPath) {
        const fileRef = storageRef(storage, data.clipPath);
        await deleteObject(fileRef);
      }
    } catch (e) {
      console.warn('File deletion may have failed or file not found.', e);
    }
    // delete document
    await deleteDoc(doc(db, 'bookings', id));
    container.remove();
  });

  return container;
}// Firebase Imports (add this after your initializeApp line)
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);// ===== Upload Sample File =====
const uploadForm = document.getElementById("uploadForm");
const sampleFile = document.getElementById("sampleFile");
const sampleTitle = document.getElementById("sampleTitle");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = sampleFile.files[0];
  const title = sampleTitle.value;

  if (!file) return alert("Please choose a file first!");

  try {
    const fileRef = ref(storage, "samples/" + file.name);
    await uploadBytes(fileRef, file);
    const fileURL = await getDownloadURL(fileRef);

    // Save info in Firestore
    await addDoc(collection(db, "samples"), {
      title: title,
      url: fileURL,
      type: file.type,
      createdAt: new Date()
    });

    alert("Sample uploaded successfully!");
    uploadForm.reset();
  } catch (error) {
    console.error(error);
    alert("Upload failed!");
  }
});

// ===== Upload Logo =====
const logoForm = document.getElementById("logoForm");
const logoFile = document.getElementById("logoFile");

logoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = logoFile.files[0];
  if (!file) return alert("Select a logo first!");

  try {
    const logoRef = ref(storage, "logo/" + file.name);
    await uploadBytes(logoRef, file);
    const logoURL = await getDownloadURL(logoRef);

    // Save logo URL to Firestore
    await addDoc(collection(db, "siteConfig"), {
      logo: logoURL,
      updatedAt: new Date()
    });

    alert("Logo updated successfully!");
    document.getElementById("adminMsg").innerText = "Logo saved in Firebase!";
  } catch (error) {
    console.error(error);
    alert("Logo upload failed!");
  }
});