// admin-samples.js
// NOTE: admin-samples.js upload UI has been intentionally removed.
// You said you will upload sample videos manually (via Firebase Console or GitHub).
// Keep this file as a harmless stub so admin.html won't throw a missing script error.

console.info("admin-samples.js loaded — upload UI removed by request. Upload sample media manually in Firebase Console (Storage + Firestore 'samples' collection).");

/*
How to add samples manually (recommended):
1. Upload your video/image files in Firebase Console -> Storage -> Upload files -> put under 'samples/' folder.
2. Go to Firestore -> 'samples' collection -> Add a document:
   {
     title: "3D Edit",
     category: "3D",
     price: 0,
     fileURL: "https://firebasestorage.googleapis.com/....?alt=media",
     fileType: "video/mp4",
     uploadedAt: "2025-11-08T10:00:00Z"
   }
3. The gallery.js will read these documents and display them automatically.
*/