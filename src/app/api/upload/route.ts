import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "@/app/api/firebase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = `${uuidv4()}-${file.name}`;
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
