// admin-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCXsyTLjLDM7wQ7TAcG3d3KSgPzWR-Hty4",
  authDomain: "luminaryframe-c80db.firebaseapp.com",
  projectId: "luminaryframe-c80db",
  storageBucket: "luminaryframe-c80db.firebasestorage.app",
  messagingSenderId: "1075557950621",
  appId: "1:1075557950621:web:30d0d86ceddbb8a2eee074",
  measurementId: "G-E6ZRPKCJSH"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Protect Dashboard
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== "luminaryframestudios@gmail.com") {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "You are not authorized to view this page.",
      confirmButtonColor: "#ff007f"
    }).then(() => {
      window.location.href = "auth.html";
    });
  } else {
    document.getElementById("adminEmail").textContent = user.email;
    loadBookings();
  }
});

// ✅ Logout button
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  Swal.fire({
    icon: "success",
    title: "Logged Out",
    text: "You have been successfully logged out.",
    confirmButtonColor: "#ff007f"
  }).then(() => {
    window.location.href = "auth.html";
  });
});

// ✅ Load Booking Data
async function loadBookings() {
  const table = document.getElementById("bookingTable");
  if (!table) return;

  table.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted)">Loading bookings...</td></tr>`;
  
  try {
    const snapshot = await getDocs(collection(db, "bookings"));
    if (snapshot.empty) {
      table.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted)">No bookings found yet.</td></tr>`;
      return;
    }

    let rows = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      rows += `
        <tr>
          <td>${data.name || "—"}</td>
          <td>${data.email || "—"}</td>
          <td>${data.category || "—"}</td>
          <td>${data.style || "—"}</td>
          <td>${data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : "—"}</td>
        </tr>
      `;
    });

    table.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Category</th>
        <th>Style</th>
        <th>Time</th>
      </tr>
      ${rows}
    `;
  } catch (err) {
    console.error("Error loading bookings:", err);
    Swal.fire("Error", "Failed to load bookings.", "error");
  }
}

// ✅ Sample Upload (if used)
const uploadBtn = document.getElementById("uploadSampleBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("sampleFile");
    const file = fileInput.files[0];
    if (!file) {
      Swal.fire("No File", "Please choose a file to upload.", "warning");
      return;
    }

    try {
      const fileRef = storageRef(storage, `samples/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "samples"), {
        fileName: file.name,
        url: url,
        uploadedAt: serverTimestamp(),
      });

      Swal.fire("Success", "Sample uploaded successfully!", "success");
      fileInput.value = "";
    } catch (error) {
      console.error(error);
      Swal.fire("Upload Failed", "Something went wrong. Try again.", "error");
    }
  });
}