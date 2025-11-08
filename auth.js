// auth.js
import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const ADMIN_EMAIL = "luminaryframestudios@gmail.com";

const loginForm = document.getElementById("loginForm");
const googleBtn = document.getElementById("googleSignInBtn");

async function redirectAfterAuth(user) {
  if (!user) return;
  if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    window.location.href = "admin.html";
  } else {
    // regular client - go to client-facing booking page (here we'll use index or you may have client.html)
    window.location.href = "index.html";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      redirectAfterAuth(cred.user);
    } catch (err) {
      console.error("Login failed:", err);
      // Friendly message (avoid leaking internal error codes to users)
      alert("Login failed: check email and password.");
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      redirectAfterAuth(res.user);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed. Try again.");
    }
  });
}

// Optional: redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // already logged in — redirect accordingly
    redirectAfterAuth(user);
  }
});