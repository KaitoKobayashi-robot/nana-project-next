"use client";

import Camera from "./_components/Camera";
import { Loading } from "./_components/Loading";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Logo from "../../../public/logo.svg";

type CameraState = "waiting" | "cameraReady" | "capturing";

export default function CameraPage() {
  const [cameraState, setCameraState] = useState<CameraState>("waiting");
  const [theme, setTheme] = useState<String>("");

  useEffect(() => {
    const triggerDocRef = doc(db, "camera", "trigger");

    const unsubscribeTrigger = onSnapshot(triggerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.takePhoto) {
          setCameraState("capturing");
        } else if (data.showCamera) {
          setCameraState("cameraReady");
        } else {
          setCameraState("waiting");
        }
        if (data.theme) {
          setTheme(data.theme);
        }
      }
    });

    return () => {
      unsubscribeTrigger();
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
    <div className="relative flex min-h-screen flex-col items-center justify-center pt-16">
      <Logo
        width={100}
        height={70}
        className="absolute top-0 left-1/2 mt-4 -translate-x-1/2"
      />
      {cameraState === "waiting" && (
        <div className="flex flex-col items-center justify-center">
          <Loading />
        </div>
      )}
      {cameraState === "capturing" && (
        <div className="flex w-screen flex-col items-center justify-center pr-4 pl-4">
          <div className="flex w-full max-w-md items-center justify-center border-2 border-[#2c2522] px-2 py-2">
            <h2 className="text-lg font-bold">
              {theme === "" ? "お題" : theme}
            </h2>
          </div>{" "}
          <div className="w-full">
            <Camera startCapture={true} onComplete={handleComplete} />
          </div>
        </div>
      )}
      {/* {cameraState === "cameraReady" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="mt-4 text-4xl font-bold">カメラ準備完了</h1>
          <p className="mt-4 text-lg whitespace-pre-wrap">
            {
              "準備が出来たら撮影ボタンを押してね。\nボタンを押すと10秒のカウントが始まるよ"
            }
          </p>
          <div className="flex h-screen w-screen max-w-md items-center justify-center">
            <Camera startCapture={false} onComplete={handleComplete} />
          </div>
        </div>
      )} */}
    </div>
  );
}
