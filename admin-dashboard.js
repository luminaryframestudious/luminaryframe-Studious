// admin-dashboard.js
import { auth, db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const ADMIN_EMAIL = "luminaryframestudios@gmail.com";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  if (user.email && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert("Access denied.");
    window.location.href = "index.html";
    return;
  }
  loadBookings();
});

async function loadBookings() {
  const list = document.getElementById("bookingList");
  if (!list) return;
  list.innerHTML = "Loading bookings...";
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<p>No bookings.</p>";
      return;
    }
    list.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;
      const div = document.createElement("div");
      div.style.border = "1px solid rgba(255,255,255,0.04)";
      div.style.padding = "12px";
      div.style.borderRadius = "10px";
      div.style.marginBottom = "12px";

      const filesHtml = Array.isArray(d.files) && d.files.length
        ? `<div style="margin-top:8px;">Files: ${d.files.map(u => `<a href="${u}" target="_blank" rel="noopener" style="color:#ff8bb2">view</a>`).join(' • ')}</div>`
        : '';

      div.innerHTML = `<h3 style="margin:0 0 6px;">${d.name || 'Unnamed'} (${d.email || ''})</h3>
        <p style="margin:6px 0;"><strong>Service:</strong> ${escapeHtml(d.service || '')} — ${escapeHtml(d.style || '')}</p>
        <p style="margin:6px 0;">${escapeHtml(d.message || '')}</p>
        ${filesHtml}
        <p style="margin:6px 0;">Status: <span id="status-${id}">${escapeHtml(d.status || 'Pending')}</span></p>
        <p style="margin:6px 0;">Trial: ${d.isTrial ? 'Yes' : 'No'} ${d.txnId ? '| Txn: ' + escapeHtml(d.txnId) : ''}</p>
        <div style="margin-top:8px">
          <button data-id="${id}" class="approve">Approve</button>
          <button data-id="${id}" class="reject">Reject</button>
        </div>`;

      list.appendChild(div);
    });

    // attach listeners
    document.querySelectorAll(".approve").forEach(btn => btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      try {
        await updateDoc(doc(db, "orders", id), { status: "Approved" });
        document.getElementById(`status-${id}`).textContent = "Approved";
        Swal.fire("Done", "Approved", "success");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to approve.", "error");
      }
    }));

    document.querySelectorAll(".reject").forEach(btn => btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      try {
        await updateDoc(doc(db, "orders", id), { status: "Rejected" });
        document.getElementById(`status-${id}`).textContent = "Rejected";
        Swal.fire("Done", "Rejected", "success");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to reject.", "error");
      }
    }));

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p style='color:#ff6a41;'>Failed to load bookings.</p>";
  }
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}