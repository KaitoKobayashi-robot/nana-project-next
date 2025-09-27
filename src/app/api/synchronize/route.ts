import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  if (process.env.NODE_ENV === "development") {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "nana-project-firebase.firebasestorage.app",
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export async function GET() {
  try {
    const col = db.collection("images");
    const FOLDER = "sample_images/";
    const [files] = await bucket.getFiles({ prefix: FOLDER });

    const storageDocIds = new Set<string>();
    files.forEach((f) => {
      if (!f.name.endsWith("/")) {
        storageDocIds.add(f.name.replace(/\//g, "_"));
      }
    });

    const firestoreSnapshot = await col.get();
    const firestoreDocIds = new Set<string>();
    firestoreSnapshot.forEach((doc) => {
      firestoreDocIds.add(doc.id);
    });

    const batch = db.batch();
    let added = 0;
    let deleted = 0;

    for (const f of files) {
      if (f.name.endsWith("/")) continue;

      const docId = f.name.replace(/\//g, "_");
      if (!firestoreDocIds.has(docId)) {
        const [metadata] = await f.getMetadata();
        const updatedTime = new Date(metadata.updated as any);
        batch.set(
          col.doc(docId),
          { path: f.name, updatedAt: updatedTime },
          { merge: true },
        );
        added++;
      }
    }

    firestoreSnapshot.forEach((doc) => {
      if (!storageDocIds.has(doc.id)) {
        batch.delete(doc.ref);
        deleted++;
      }
    });

    await batch.commit();

    return NextResponse.json({
      message: `OK: added=${added}, deleted=${deleted}`,
      added,
      deleted,
    });
  } catch (error: any) {
    console.error("Synchronization failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
