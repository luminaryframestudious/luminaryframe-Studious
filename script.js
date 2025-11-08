// script.js — Firebase auth, booking flow, EmailJS (module)
// Requires: firebase-init.js exporting { auth, db, storage? }
// EmailJS keys: service_as09ic9, template_ba64mye, public key 24wLt-L5koQCAR4cW

import { auth, db, storage } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// -------------------- EmailJS init --------------------
const EMAILJS_SERVICE_ID = "service_as09ic9";
const EMAILJS_TEMPLATE_ID = "template_ba64mye";
const EMAILJS_PUBLIC_KEY = "24wLt-L5koQCAR4cW";

if (window.emailjs && typeof window.emailjs.init === "function") {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log("EmailJS initialized.");
  } catch (e) {
    console.warn("EmailJS init failed:", e);
  }
} else {
  console.warn("EmailJS SDK not found on page. Admin emails will fail.");
}

// -------------------- Utilities --------------------
function $id(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }

function showToast(msg, type = "info") {
  // minimal toast — unobtrusive
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.right = "18px";
  t.style.bottom = "18px";
  t.style.padding = "10px 14px";
  t.style.borderRadius = "8px";
  t.style.zIndex = 9999;
  t.style.boxShadow = "0 6px 24px rgba(0,0,0,0.5)";
  t.style.background = type === "error" ? "linear-gradient(90deg,#ff4d4d,#ff007f)" : "linear-gradient(90deg,#7b3ff6,#ff6a41)";
  t.style.color = "#fff";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// -------------------- Auth UI helpers --------------------
const authLink = document.querySelector('a[href="auth.html"]');
let userIndicator = $id("userIndicator");
if (!userIndicator) {
  userIndicator = document.createElement("div");
  userIndicator.id = "userIndicator";
  userIndicator.style.textAlign = "center";
  userIndicator.style.color = "var(--muted, #bfbfbf)";
  userIndicator.style.marginTop = "12px";
  document.body.insertBefore(userIndicator, document.body.firstChild.nextSibling || null);
}

let homepageLogoutBtn = document.getElementById("homepageLogoutBtn");
if (!homepageLogoutBtn) {
  homepageLogoutBtn = document.createElement("button");
  homepageLogoutBtn.id = "homepageLogoutBtn";
  homepageLogoutBtn.textContent = "Logout";
  homepageLogoutBtn.className = "btn";
  homepageLogoutBtn.style.display = "none";
  homepageLogoutBtn.style.marginLeft = "8px";
  if (authLink && authLink.parentNode) {
    authLink.parentNode.insertBefore(homepageLogoutBtn, authLink.nextSibling);
  } else {
    document.body.appendChild(homepageLogoutBtn);
  }
}

homepageLogoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showToast("Logged out.", "info");
    window.location.href = "index.html";
  } catch (e) {
    console.error("Logout failed", e);
    showToast("Logout failed", "error");
  }
});

// -------------------- Google Sign-In helper (callable from auth page) --------------------
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    // user will be handled by onAuthStateChanged
    return res.user;
  } catch (err) {
    console.error("Google sign in failed:", err);
    throw err;
  }
}

// -------------------- Sign up / Sign in helpers (callable from forms if you want) --------------------
export async function signupWithEmail(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    console.error("Signup failed:", err);
    throw err;
  }
}

export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}

// -------------------- Free trial counter --------------------
async function countUserTrials(uid) {
  try {
    const q = query(collection(db, "orders"), where("uid", "==", uid), where("isTrial", "==", true));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("Failed to count trials:", err);
    return 0;
  }
}

// -------------------- Send admin email via EmailJS --------------------
async function sendAdminEmail({ name, email, service, style, message, txnId, isTrial, orderId }) {
  if (!window.emailjs || !emailjs.send) {
    console.warn("EmailJS not available — cannot send admin email.");
    return;
  }
  const templateParams = {
    user_name: name || email || "Unknown",
    user_email: email || "Unknown",
    service: `${service} — ${style}` || "N/A",
    message: `${message || ""}\nOrder ID: ${orderId || "N/A"}`,
    txn_id: txnId || (isTrial ? "Free Trial" : "Not provided"),
    trial_status: isTrial ? "Free Trial" : "Paid Order",
    admin_email: "luminaryframestudios@gmail.com"
  };
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log("Admin email sent.");
  } catch (err) {
    console.warn("EmailJS send failed:", err);
  }
}

// -------------------- Order submission --------------------
async function handleOrderSubmit(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    showToast("Please login first.", "error");
    window.location.href = "auth.html";
    return;
  }

  // gather fields
  const fullName = ($id("fullName")?.value || "").trim();
  const email = ($id("email")?.value || "").trim() || user.email;
  const phone = ($id("phone")?.value || "").trim();
  const service = ($id("service")?.value || "").trim() || "";
  const style = ($id("style")?.value || "").trim() || "";
  const message = ($id("message")?.value || "").trim() || "";
  const txnInput = $id("txnId");
  const txnId = txnInput ? (txnInput.value || "").trim() : "";

  // validate required fields
  if (!fullName) { showToast("Enter your name.", "error"); return; }
  if (!email) { showToast("Enter an email.", "error"); return; }
  if (!service || !style) { showToast("Select service and style.", "error"); return; }

  // check trial status
  const trialCount = await countUserTrials(user.uid);
  const isTrial = trialCount < 5;
  if (!isTrial && (!txnId || txnId.length < 3)) {
    showToast("Paid orders require a valid UPI transaction ID.", "error");
    return;
  }

  // handle files (optional). If storage is not available, skip uploads but allow order.
  const fileInput = $id("fileInput");
  const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
  const fileUrls = [];

  if (files.length > 0 && storage) {
    try {
      for (const f of files) {
        const key = `orders/${user.uid}/${Date.now()}_${f.name.replace(/\s+/g,'_')}`;
        const r = storageRef(storage, key);
        await uploadBytes(r, f);
        const dl = await getDownloadURL(r);
        fileUrls.push(dl);
      }
    } catch (err) {
      console.error("File upload failed:", err);
      // Allow order to proceed without files (user can re-upload via other means)
      showToast("File upload failed, continuing without files.", "error");
    }
  } else if (files.length > 0 && !storage) {
    console.warn("Files present but Firebase Storage not configured. Skipping file uploads.");
  }

  // Save order to Firestore
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

    // Send admin email (best-effort)
    sendAdminEmail({
      name: fullName,
      email,
      service,
      style,
      message,
      txnId,
      isTrial,
      orderId: docRef.id
    });

    showToast(isTrial ? `Booking submitted. Free trial used ${trialCount + 1}/5.` : "Booking submitted. Payment noted.", "info");
    // reset form
    (e.target).reset();

    // update txn UI if the user used up trials
    const c = await countUserTrials(user.uid);
    const txnLabel = $id("txnLabel");
    const txnInputEl = $id("txnId");
    if (c >= 5) {
      if (txnLabel) txnLabel.style.display = "block";
      if (txnInputEl) { txnInputEl.style.display = "block"; txnInputEl.required = true; }
    }
  } catch (err) {
    console.error("Failed to save order:", err);
    showToast("Failed to place booking. Try again.", "error");
  }
}

// Attach order handler if order form exists on page
const orderFormEl = $id("orderForm");
if (orderFormEl) {
  orderFormEl.addEventListener("submit", handleOrderSubmit);
}

// Pay button opens UPI intent
const payBtn = $id("payBtn");
const upiIdEl = $id("upiId");
function openUpi(amount = 5) {
  const upi = upiIdEl ? upiIdEl.textContent.trim() : "9239529167@fam";
  const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent('LuminaryFrame')}&am=${encodeURIComponent(String(amount))}&cu=INR`;
  window.location.href = url;
}
if (payBtn) {
  payBtn.addEventListener("click", () => openUpi());
}

// -------------------- Auth state listener --------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Show user info & adjust UI
    const display = (user.email || "").split("@")[0] || "Client";
    userIndicator.textContent = `Welcome, ${display}`;
    if (authLink) {
      authLink.textContent = "Client Panel";
      authLink.href = "auth.html"; // auth.js will handle admin redirect
    }
    homepageLogoutBtn.style.display = "inline-block";

    // show/hide txn field based on trials
    const txnLabel = $id("txnLabel");
    const txnInputEl = $id("txnId");
    const c = await countUserTrials(user.uid);
    if (c >= 5) {
      if (txnLabel) txnLabel.style.display = "block";
      if (txnInputEl) { txnInputEl.style.display = "block"; txnInputEl.required = true; }
    } else {
      if (txnLabel) txnLabel.style.display = "none";
      if (txnInputEl) { txnInputEl.style.display = "none"; txnInputEl.required = false; }
    }
  } else {
    userIndicator.textContent = "";
    if (authLink) {
      authLink.textContent = "Login / Book Now";
      authLink.href = "auth.html";
    }
    homepageLogoutBtn.style.display = "none";
    // hide txn inputs if present
    const txnLabel = $id("txnLabel");
    const txnInputEl = $id("txnId");
    if (txnLabel) txnLabel.style.display = "none";
    if (txnInputEl) { txnInputEl.style.display = "none"; txnInputEl.required = false; }
  }
});

// -------------------- Optional: expose functions for auth.html to call --------------------
window.lf_signupWithEmail = async (email, password) => {
  try { const user = await signupWithEmail(email, password); return user; }
  catch (e) { throw e; }
};
window.lf_loginWithEmail = async (email, password) => {
  try { const user = await loginWithEmail(email, password); return user; }
  catch (e) { throw e; }
};
window.lf_googleSignIn = async () => {
  try { return await signInWithGoogle(); }
  catch (e) { throw e; }
};

// -------------------- End of script.js --------------------