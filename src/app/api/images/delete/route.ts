import { NextResponse } from "next/server";
import { bucket, db } from "@/app/api/firebase";

interface DeleteRequest {
  paths: string[];
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();

    if (!body.paths || !Array.isArray(body.paths) || body.paths.length === 0) {
      return NextResponse.json(
        { error: "paths 配列が必要です" },
        { status: 400 }
      );
    }

    const results: { path: string; success: boolean; error?: string }[] = [];

    for (const path of body.paths) {
      try {
        // Storage から画像を削除
        const file = bucket.file(path);
        await file.delete();

        // Firestore からも削除（同期が遅れる可能性があるため即時削除）
        const docId = path.replace(/\//g, "_");
        const docRef = db.collection("images").doc(docId);
        await docRef.delete();

        results.push({ path, success: true });
      } catch (err: any) {
        console.error(`Failed to delete ${path}:`, err);
        results.push({
          path,
          success: false,
          error: err.message || "削除に失敗しました",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `削除完了: 成功=${successCount}, 失敗=${failedCount}`,
      results,
      successCount,
      failedCount,
    });
  } catch (error: any) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: error.message || "削除処理に失敗しました" },
      { status: 500 }
    );
  }
}
