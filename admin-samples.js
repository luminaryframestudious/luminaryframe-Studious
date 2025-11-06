// ---------- ADMIN-SAMPLES.JS ----------
// LuminaryFrame Studios - Admin Sample Manager

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { app } from "./script.js";

const db = getFirestore(app);
const storage = getStorage(app);

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const sampleList = document.getElementById("sampleList");

// Upload new sample
uploadBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const price = priceInput.value;
  const file = fileInput.files[0];

  if (!title || !category || !price || !file) {
    alert("Please fill all fields and select a file.");
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    const fileRef = ref(storage, `samples/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const fileURL = await getDownloadURL(fileRef);

    await addDoc(collection(db, "samples"), {
      title,
      category,
      price,
      fileURL,
      createdAt: serverTimestamp()
    });

    alert("Sample uploaded successfully!");
    titleInput.value = "";
    categoryInput.value = "";
    priceInput.value = "";
    fileInput.value = "";
    loadSamples();
  } catch (e) {
    alert("Error: " + e.message);
  }

  uploadBtn.disabled = false;
  uploadBtn.textContent = "Upload Sample";
});

// Load samples
async function loadSamples() {
  sampleList.innerHTML = "<p>Loading samples...</p>";
  const snapshot = await getDocs(collection(db, "samples"));

  let html = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const isVideo = data.fileURL.includes(".mp4") || data.fileURL.includes("video");
    const mediaTag = isVideo
      ? `<video controls style="width:100%;border-radius:8px;"><source src="${data.fileURL}" type="video/mp4"></video>`
      : `<img src="${data.fileURL}" alt="${data.title}" />`;

    html += `
      <div class="sample-card">
        ${mediaTag}
        <h3>${data.title}</h3>
        <p>${data.category} — ₹${data.price}</p>
        <button class="delete-btn" onclick="deleteSample('${docSnap.id}')">🗑️ Delete</button>
      </div>`;
  });

  sampleList.innerHTML = html || "<p>No samples uploaded yet.</p>";
}

// Delete sample
window.deleteSample = async (id) => {
  if (confirm("Delete this sample?")) {
    await deleteDoc(doc(db, "samples", id));
    alert("Deleted!");
    loadSamples();
  }
};

// Load all samples on page load
document.addEventListener("DOMContentLoaded", loadSamples);