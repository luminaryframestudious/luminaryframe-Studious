// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCXsyTLjLDM7wQ7TAcG3d3KSgPzWR-Hty4",
  authDomain: "luminaryframe-c80db.firebaseapp.com",
  projectId: "luminaryframe-c80db",
  storageBucket: "luminaryframe-c80db.firebasestorage.app",
  messagingSenderId: "1075557950621",
  appId: "1:1075557950621:web:30d0d86ceddbb8a2eee074",
  measurementId: "G-E6ZRPKCJSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Login Handler
document.getElementById("loginBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    Swal.fire("Missing Info", "Please fill in both fields.", "warning");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Allow only the main admin
    if (user.email === "luminaryframestudios@gmail.com") {
      Swal.fire({
        icon: "success",
        title: "Welcome Admin!",
        text: "Redirecting to dashboard...",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1600);
    } else {
      Swal.fire("Access Denied", "You are not authorized to access this dashboard.", "error");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Login error:", error);
    Swal.fire("Login Failed", "Invalid email or password. Please try again.", "error");
  }
});