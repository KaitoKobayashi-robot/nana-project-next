"use client";

import Camera from "./_components/Camera";
import { useEffect, useState, useRef } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

type CameraState = "waiting" | "cameraReady" | "capturing" | "locked";

export default function CameraPage() {
  const [cameraState, setCameraState] = useState<CameraState>("waiting");
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem("deviceId", storedDeviceId);
    }
    deviceIdRef.current = storedDeviceId;

    const resourceDocRef = doc(db, "camera", "resource");
    const triggerDocRef = doc(db, "camera", "trigger");

    const lockResource = async () => {
      try {
        await runTransaction(db, async (transaction) => {
          const resourceDoc = await transaction.get(resourceDocRef);
          if (!resourceDoc.exists() || !resourceDoc.data().isLocked) {
            transaction.set(
              resourceDocRef,
              {
                isLocked: true,
                lockedAt: serverTimestamp(),
                ownerId: deviceIdRef.current,
              },
              { merge: true },
            );
          } else {
            // 自分がオーナーでない場合はロック状態にする
            if (resourceDoc.data().ownerId !== deviceIdRef.current) {
              setCameraState("locked");
            }
          }
        });
      } catch (e) {
        console.error("Transaction failed: ", e);
      }
    };

    lockResource();

    const unsubscribeResource = onSnapshot(resourceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const { isLocked, ownerId } = docSnap.data();
        if (isLocked && ownerId !== deviceIdRef.current) {
          setCameraState("locked");
        } else if (!isLocked && cameraState === "locked") {
          // ロックが解除されたら待機状態に戻る
          setCameraState("waiting");
          // 再度ロックを試みる
          lockResource();
        }
      }
    });

    const unsubscribeTrigger = onSnapshot(triggerDocRef, (docSnap) => {
      if (cameraState !== "locked" && docSnap.exists()) {
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

    const unlockResource = async () => {
      try {
        await runTransaction(db, async (transaction) => {
          const resourceDoc = await transaction.get(resourceDocRef);
          if (
            resourceDoc.exists() &&
            resourceDoc.data().ownerId === deviceIdRef.current
          ) {
            transaction.update(resourceDocRef, {
              isLocked: false,
              ownerId: "",
            });
          }
        });
      } catch (e) {
        console.error("Unlock transaction failed: ", e);
      }
    };

    window.addEventListener("beforeunload", unlockResource);

    return () => {
      unsubscribeResource();
      unsubscribeTrigger();
      unlockResource();
      window.removeEventListener("beforeunload", unlockResource);
    };
  }, [cameraState]);

  const handleComplete = async () => {
    const triggerDocRef = doc(db, "camera", "trigger");
    await updateDoc(triggerDocRef, {
      showCamera: false,
      takePhoto: false,
    });
    setCameraState("waiting");
  };

  if (cameraState === "locked") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">
          他のデバイスがカメラを開いています
        </h1>
      </div>
    );
  }

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
