import { NextResponse } from "next/server";
import { db, bucket } from "@/app/api/firebase";
import { v4 as uuidv4 } from "uuid";
import { File } from "@google-cloud/storage"; // Fileの型をインポート

// --- 追加ここから ---
/**
 * ファイルに永続的なダウンロードトークンを付与する
 * @param file - Cloud Storage の File オブジェクト
 * @returns 存在する、または生成されたダウンロードトークン
 */
async function ensureDownloadToken(file: File): Promise<string> {
  const [metadata] = await file.getMetadata();
  const existingToken = metadata.metadata?.firebaseStorageDownloadTokens;

  if (existingToken && String(existingToken).trim().length > 0) {
    return String(existingToken);
  }

  const newToken = uuidv4();
  await file.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: newToken,
    },
    // 必要に応じてキャッシュ設定も移植
    cacheControl: "public,max-age=325360000,immutable",
  });
  return newToken;
}
// --- 追加ここまで ---

export async function GET() {
  try {
    const col = db.collection("images");
    const FOLDER = "user_images/resized";

    // --- 追加ここから ---
    // 最終同期日時を取得するための参照
    const metadataDocRef = db.collection("metadata").doc("lastSync");
    const metadataDoc = await metadataDocRef.get();
    // 存在しない場合は、UNIXエポックの最初の日時を使用
    const lastSync = metadataDoc.exists
      ? (metadataDoc.data()?.timestamp.toDate() as Date)
      : new Date(0);
    // --- 追加ここまで ---

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
      const [metadata] = await f.getMetadata();
      const updatedTime = new Date(metadata.updated as any);

      // --- 修正ここから ---
      // 最終同期日時より新しいか、Firestoreに存在しない場合のみ処理
      if (updatedTime > lastSync || !firestoreDocIds.has(docId)) {
        // ダウンロードトークンを確実に付与
        await ensureDownloadToken(f);

        batch.set(
          col.doc(docId),
          { path: f.name, updatedAt: updatedTime },
          { merge: true },
        );
        added++;
      }
      // --- 修正ここまで ---
    }

    firestoreSnapshot.forEach((doc) => {
      if (!storageDocIds.has(doc.id)) {
        batch.delete(doc.ref);
        deleted++;
      }
    });

    // --- 追加ここから ---
    // 最終同期日時を現在のサーバータイムスタンプで更新
    batch.set(metadataDocRef, {
      timestamp: new Date(), // Admin SDK の場合、new Date()でサーバータイムスタンプの代用
    });
    // --- 追加ここまで ---

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
