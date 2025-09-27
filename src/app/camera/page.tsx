"use client";

import Camera from "./components/Camera";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CameraState = "waiting" | "cameraReady" | "capturing";

export default function CameraPage() {
  const [cameraState, setCameraState] = useState<CameraState>("waiting");

  useEffect(() => {
    const triggerDocRef = doc(db, "camera", "trigger");

    const unsubscribe = onSnapshot(triggerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.takePhoto) {
          setCameraState("capturing");
        } else if (data.showCamera) {
          setCameraState("cameraReady");
        } else {
          setCameraState("waiting");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleComplete = async () => {
    const triggerDocRef = doc(db, "camera", "trigger");
    await updateDoc(triggerDocRef, {
      showCamera: false,
      takePhoto: false,
    });
    setCameraState("waiting");
  };

  return (
    <div>
      {cameraState === "waiting" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">待機中...</h1>
          <p className="mt-4 text-lg">タブレットを操作してね</p>
        </div>
      )}
      {cameraState === "cameraReady" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">カメラ準備完了</h1>
          <p className="mt-4 text-lg whitespace-pre-wrap">
            {
              "準備が出来たら撮影ボタンを押してね。\nボタンを押すと10秒のカウントが始まるよ"
            }
          </p>
          <Camera startCapture={false} onComplete={handleComplete} />
        </div>
      )}
      {cameraState === "capturing" && (
        <Camera startCapture={true} onComplete={handleComplete} />
      )}
    </div>
  );
}
