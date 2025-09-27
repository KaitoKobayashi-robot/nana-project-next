import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// サービスアカウントキーを環境変数から読み込む
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "nana-project-firebase.firebasestorage.app",
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export async function GET() {
  try {
    const col = db.collection("images");
    // 本番環境とローカル環境でフォルダを切り替え
    const FOLDER =
      process.env.NODE_ENV === "production" ? "user_images/" : "sample_images/";
    const [files] = await bucket.getFiles({ prefix: FOLDER });

    const storageDocIds = new Set<string>();
    files.forEach(f => {
      if (!f.name.endsWith("/")) {
        storageDocIds.add(f.name.replace(/\//g, "_"));
      }
    });

    const firestoreSnapshot = await col.get();
    const firestoreDocIds = new Set<string>();
    firestoreSnapshot.forEach(doc => {
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
          { merge: true }
        );
        added++;
      }
    }

    firestoreSnapshot.forEach(doc => {
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
