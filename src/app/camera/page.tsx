"use client";

import Camera from "./_components/Camera";
import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

type CameraState = "waiting" | "cameraReady" | "capturing" | "locked";

export default function CameraPage() {
  const [cameraState, setCameraState] = useState<CameraState>("waiting");
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const getDeviceId = () => {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
      }
      return deviceId;
    };

    const deviceId = getDeviceId();
    setOwnerId(deviceId);

    const resourceDocRef = doc(db, "camera", "resource");
    const triggerDocRef = doc(db, "camera", "trigger");

    const lockResource = async () => {
      const resourceDoc = await getDoc(resourceDocRef);
      if (resourceDoc.exists() && resourceDoc.data().isLocked) {
        setCameraState("locked");
      } else {
        await updateDoc(resourceDocRef, {
          isLocked: true,
          lockedAt: serverTimestamp(),
          ownerId: deviceId,
        });
      }
    };

    const unlockResource = async () => {
      const resourceDoc = await getDoc(resourceDocRef);
      if (resourceDoc.exists() && resourceDoc.data().ownerId === deviceId) {
        await updateDoc(resourceDocRef, {
          isLocked: false,
          ownerId: "",
        });
      }
    };

    lockResource();

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

    const handleBeforeUnload = () => {
      unlockResource();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribe();
      unlockResource();
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
      {cameraState === "locked" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">カメラ使用中</h1>
        </div>
      )}
      {cameraState === "waiting" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">待機中...</h1>
          <p className="mt-4 text-lg">タブレットを操作してね</p>
        </div>
      )}
      {cameraState === "cameraReady" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="mt-4 text-4xl font-bold">カメラ準備完了</h1>
          <p className="mt-4 text-lg whitespace-pre-wrap">
            {
              "準備が出来たら撮影ボタンを押してね。\nボタンを押すと10秒のカウントが始まるよ"
            }
          </p>
          <div className="h-screen w-screen max-w-md">
            <Camera startCapture={false} onComplete={handleComplete} />
          </div>
        </div>
      )}
      {cameraState === "capturing" && (
        <Camera startCapture={true} onComplete={handleComplete} />
      )}
    </div>
  );
}
