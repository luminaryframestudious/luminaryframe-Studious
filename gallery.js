// gallery.js
import { db, auth } from "./firebase-init.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const galleryEl = document.getElementById("gallery");
const userOrdersEl = document.getElementById("userOrders");

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function loadSamples() {
  if (!galleryEl) return;
  galleryEl.innerHTML = "Loading samples...";
  try {
    const q = query(collection(db, "samples"), orderBy("uploadedAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      galleryEl.innerHTML = '<p style="color:#bdbdbd;">No samples uploaded yet.</p>';
      return;
    }
    galleryEl.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("article");
      card.className = "card";
      const isVideo = (d.fileType || "").startsWith("video");
      const media = isVideo
        ? `<video controls preload="metadata" style="width:100%;height:auto;display:block;border-radius:8px;"><source src="${d.fileURL}" type="${d.fileType}">Your browser does not support video.</video>`
        : `<img src="${d.fileURL}" alt="${escapeHtml(d.title || 'sample')}" style="width:100%;height:auto;display:block;border-radius:8px;">`;

      card.innerHTML = `
        <div class="thumb">${media}</div>
        <div class="meta">
          <h3>${escapeHtml(d.title || 'Untitled')}</h3>
          <p>${escapeHtml(d.category || '')} ${d.price ? "— ₹" + escapeHtml(String(d.price)) : ""}</p>
        </div>`;
      galleryEl.appendChild(card);
    });
  } catch (err) {
    console.error("Gallery load error:", err);
    galleryEl.innerHTML = '<p style="color:#ff6a41;">Failed to load gallery. Check console.</p>';
  }
}

async function loadUserOrders(uid) {
  if (!userOrdersEl) return;
  userOrdersEl.innerHTML = "<h2 style='color:var(--accent1);'>Your Orders</h2><div>Loading...</div>";
  try {
    const q = query(collection(db, "orders"), where("uid", "==", uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      userOrdersEl.innerHTML = "<h2 style='color:var(--accent1);'>Your Orders</h2><p style='color:var(--muted)'>You have no orders yet.</p>";
      return;
    }
    userOrdersEl.innerHTML = "<h2 style='color:var(--accent1);'>Your Orders</h2>";
    snap.forEach(d => {
      const data = d.data();
      const node = document.createElement("div");
      node.style.border = "1px solid rgba(255,255,255,0.04)";
      node.style.padding = "12px";
      node.style.borderRadius = "8px";
      node.style.marginBottom = "10px";
      node.innerHTML = `<strong>${escapeHtml(data.name || 'Unnamed')}</strong> — ${escapeHtml(data.service || '')} — ${escapeHtml(data.style || '')}
        <div style="margin-top:8px;color:var(--muted)">Status: ${escapeHtml(data.status || 'Pending')}</div>
        ${data.txnId ? `<div style="margin-top:6px;color:var(--muted)">Txn: ${escapeHtml(data.txnId)}</div>` : ''}
        ${Array.isArray(data.files) && data.files.length ? `<div style="margin-top:8px">Files: ${data.files.map(u => `<a href="${u}" target="_blank" rel="noopener" style="color:#ff8bb2">view</a>`).join(' • ')}</div>` : ''}`;
      userOrdersEl.appendChild(node);
    });
  } catch (err) {
    console.error("User orders load error:", err);
    userOrdersEl.innerHTML = "<p style='color:#ff6a41;'>Failed to load your orders.</p>";
  }
}

// initial load
loadSamples();

// show user orders if logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserOrders(user.uid);
  } else {
    // hide or clear orders area
    if (userOrdersEl) userOrdersEl.innerHTML = "";
  }
});