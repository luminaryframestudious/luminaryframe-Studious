// booking.js
import { auth, db, storage } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// EmailJS config (admin-only)
const EMAILJS_SERVICE_ID = "service_as09ic9";
const EMAILJS_TEMPLATE_ID = "template_ba64mye";
const EMAILJS_PUBLIC_KEY = "24wLt-L5koQCAR4cW";

// Initialize EmailJS (safe if script tag already loaded in HTML)
if (window.emailjs && typeof emailjs.init === "function") {
  try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn("EmailJS init error", e); }
}

// Helpers
const $id = (id) => document.getElementById(id);

async function countUserTrials(uid) {
  try {
    const q = query(collection(db, "orders"), where("uid", "==", uid), where("isTrial", "==", true));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("countUserTrials error", err);
    return 0;
  }
}

async function sendAdminEmail(params) {
  if (!window.emailjs || !emailjs.send) {
    console.warn("EmailJS not available.");
    return;
  }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
    console.log("Admin email sent.");
  } catch (err) {
    console.warn("EmailJS send failed:", err);
  }
}

async function uploadFilesIfNeeded(userUid, files) {
  const urls = [];
  if (!files || files.length === 0) return urls;
  if (!storage) {
    console.warn("Storage not configured; skipping file uploads.");
    return urls;
  }
  for (const f of files) {
    const key = `orders/${userUid}/${Date.now()}_${f.name.replace(/\s+/g,'_')}`;
    const r = storageRef(storage, key);
    await uploadBytes(r, f);
    const dl = await getDownloadURL(r);
    urls.push(dl);
  }
  return urls;
}

// Booking form submission
const orderForm = $id("orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first.");
      window.location.href = "auth.html";
      return;
    }

    const fullName = ($id("fullName")?.value || "").trim();
    const email = ($id("email")?.value || "").trim() || user.email;
    const phone = ($id("phone")?.value || "").trim();
    const service = ($id("service")?.value || "").trim();
    const style = ($id("style")?.value || "").trim();
    const message = ($id("message")?.value || "").trim();
    const txnId = ($id("txnId")?.value || "").trim();

    if (!fullName || !email || !service || !style) {
      alert("Please fill required fields.");
      return;
    }

    const trialCount = await countUserTrials(user.uid);
    const isTrial = trialCount < 5;
    if (!isTrial && (!txnId || txnId.length < 3)) {
      alert("Paid orders require a valid UPI transaction ID.");
      return;
    }

    // optional file uploads
    const fileInput = $id("fileInput");
    const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
    let fileUrls = [];
    try {
      if (files.length > 0) {
        fileUrls = await uploadFilesIfNeeded(user.uid, files);
      }
    } catch (err) {
      console.error("File upload failed:", err);
      // continue without files
      fileUrls = [];
      alert("File upload failed; continuing without files.");
    }

    // Save order
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        uid: user.uid,
        name: fullName,
        email,
        phone,
        service,
        style,
        message,
        files: fileUrls,
        isTrial,
        txnId: isTrial ? null : txnId,
        status: "Pending",
        createdAt: new Date().toISOString()
      });

      // EmailJS admin notification
      const templateParams = {
        user_name: fullName || email,
        user_email: email,
        service: `${service} — ${style}`,
        message: `${message}\nOrder ID: ${docRef.id}`,
        txn_id: txnId || (isTrial ? "Free Trial" : "Not provided"),
        trial_status: isTrial ? "Free Trial" : "Paid Order",
        admin_email: "luminaryframestudios@gmail.com"
      };
      sendAdminEmail(templateParams);

      alert(isTrial ? `Booking submitted. Free trial used ${trialCount + 1}/5.` : "Booking submitted. Payment noted.");
      orderForm.reset();
    } catch (err) {
      console.error("Save order failed:", err);
      alert("Failed to place booking. Try again.");
    }
  });
}

// Pay button (UPI)
const payBtn = $id("payBtn");
const upiIdEl = $id("upiId");
if (payBtn) {
  payBtn.addEventListener("click", () => {
    const upi = upiIdEl ? upiIdEl.textContent.trim() : "9239529167@fam";
    const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent('LuminaryFrame')}&am=${encodeURIComponent(String(5))}&cu=INR`;
    window.location.href = url;
  });
}

// Keep txn field visibility in sync with auth state + trial count
onAuthStateChanged(auth, async (user) => {
  const txnLabel = $id("txnLabel");
  const txnInput = $id("txnId");
  if (!user) {
    if (txnLabel) txnLabel.style.display = "none";
    if (txnInput) { txnInput.style.display = "none"; txnInput.required = false; }
    return;
  }
  const c = await countUserTrials(user.uid);
  if (c >= 5) {
    if (txnLabel) txnLabel.style.display = "block";
    if (txnInput) { txnInput.style.display = "block"; txnInput.required = true; }
  } else {
    if (txnLabel) txnLabel.style.display = "none";
    if (txnInput) { txnInput.style.display = "none"; txnInput.required = false; }
  }
});