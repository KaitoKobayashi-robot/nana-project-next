import { NextResponse } from "next/server";
import { bucket } from "@/app/api/firebase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const millisec = String(now.getMilliseconds()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${millisec}`;

    const fileName = `${dateString}-${file.name}`;
    const filePath = `user_images_raw/${fileName}`;
    const fileRef = bucket.file(filePath);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    return NextResponse.json({
      message: "File uploaded successfully to Storage",
      filePath,
    });
  } catch (error: any) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
