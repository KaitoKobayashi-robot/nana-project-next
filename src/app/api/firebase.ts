import * as admin from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.NODE_ENV === "development") {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "nana-project-firebase.firebasestorage.app",
    });
  } else {
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
