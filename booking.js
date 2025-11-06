// booking.js (module)
import { db, uploadFileToFirebase } from "./script.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const bookingForm = document.getElementById("bookingForm");
const submitBtn = document.getElementById("submitBooking");
const payBtn = document.getElementById("payBtn");
const clipInput = document.getElementById("clipUpload");
const fileCount = document.getElementById("fileCount");
const bookingStatus = document.getElementById("bookingStatus");

const UPI_ID = "9239529167@fam";

let uploadedFileURL = ""; // will hold first uploaded file's URL (you can extend for multiple)

// Show selected file count
if (clipInput) {
  clipInput.addEventListener("change", () => {
    fileCount.textContent = clipInput.files.length ? `${clipInput.files.length} file(s) selected` : "";
  });
}

// Pay button — constructs UPI url (opens UPI app on mobile)
if (payBtn) {
  payBtn.addEventListener("click", () => {
    const upiURL = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("LuminaryFrame Studios")}&cu=INR&am=5.00`;
    window.location.href = upiURL;
  });
}

// Submit booking
if (bookingForm) {
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const category = document.getElementById("category").value;
    const style = document.getElementById("style").value;
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !category || !style) {
      alert("⚠️ Please fill all required fields.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Booking";
      return;
    }

    try {
      // If user selected a file, upload first file to Firebase Storage
      if (clipInput.files && clipInput.files[0]) {
        bookingStatus.textContent = "Uploading file...";
        uploadedFileURL = await uploadFileToFirebase(clipInput.files[0]);
      }

      // Add booking document
      await addDoc(collection(db, "bookings"), {
        name,
        email,
        phone,
        app: category,
        style,
        clipLink: uploadedFileURL || "",
        message,
        createdAt: serverTimestamp(),
        status: "Pending"
      });

      // Send booking confirmation email via EmailJS (if you want)
      if (typeof emailjs !== "undefined") {
        const params = { name, email, category, style, to_email: "luminaryframestudios@gmail.com" };
        // Note: ensure template and service IDs are correct
        try {
          await emailjs.send("service_as09ic9", "template_ba64mye", params);
        } catch (sendErr) {
          console.warn("EmailJS send warning:", sendErr);
        }
      }

      Swal.fire({ icon: "success", title: "Booking Submitted!", text: "Thank you! We’ve received your order." });
      bookingForm.reset();
      fileCount.textContent = "";
      bookingStatus.textContent = "";
    } catch (err) {
      console.error("Booking error:", err);
      Swal.fire({ icon: "error", title: "Failed to Submit", text: err.message || "Try again." });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Booking";
    }
  });
}