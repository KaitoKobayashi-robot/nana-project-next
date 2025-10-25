import { NextResponse } from "next/server";
import { bucket, db } from "@/app/api/firebase";

export async function POST() {
  try {
    const docRef = db.collection("camera").doc("trigger");
    await docRef.update({ takePhoto: false });
    return NextResponse.json({
      success: true,
      message: `Document trigger in camera updated successfully.`,
    });
  } catch (e) {
    console.error("Error updating Firestore document:", e);
    const errorMessage =
      e instanceof Error ? e.message : "Unknown server error";
    return NextResponse.json(
      { error: "Failed to update document", details: errorMessage },
      { status: 500 }, // Internal Server Error
    );
  }
}
