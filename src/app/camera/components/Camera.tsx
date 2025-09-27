"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

// videoConstraintsの型定義
interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "user" | "environment";
}

const Camera = () => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // インターバルIDを保持するためのref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoConstraints: VideoConstraints = {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    facingMode: "environment",
  };

  const handleUpload = useCallback(async (src: string): Promise<void> => {
    if (!src) return;
    setIsLoading(true);
    try {
      const blob = await fetch(src).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", blob, "capture.png");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Upload successful:", data);
      } else {
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
      setImgSrc(null);
    }
  }, []);

  useEffect(() => {
    console.log("Firestoreリスナーを設定します...");
    const triggerDocRef = doc(db, "camera", "trigger");

    const unsubscribe = onSnapshot(triggerDocRef, (docSnap) => {
      console.log("Firestoreリスナーが発火しました。");
      if (docSnap.exists()) {
        console.log("ドキュメントのデータ:", docSnap.data());
        if (docSnap.data().triggered === true) {
          console.log(
            "トリガー条件が満たされました。カウントダウンを開始します。",
          );

          // 既存のインターバルをクリア
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          setCountdown(10);
          intervalRef.current = setInterval(() => {
            setCountdown((prevCountdown) => {
              if (prevCountdown === null) {
                console.log(
                  "カウントダウンがnullのため、インターバルをクリアします。",
                );
                if (intervalRef.current) clearInterval(intervalRef.current);
                return null;
              }
              if (prevCountdown <= 1) {
                console.log("カウントダウン終了。画像をキャプチャします。");
                if (intervalRef.current) clearInterval(intervalRef.current);

                const imageSrc = webcamRef.current?.getScreenshot({
                  width: webcamRef.current.video?.width as number,
                  height: webcamRef.current.video?.height as number,
                });
                if (imageSrc) {
                  console.log("画像のキャプチャに成功しました。");
                  setImgSrc(imageSrc);
                  handleUpload(imageSrc);
                } else {
                  console.log("画像のキャプチャに失敗しました。");
                }

                console.log("トリガーをリセットします。");
                updateDoc(triggerDocRef, { triggered: false });
                return null;
              }
              console.log("カウントダウン:", prevCountdown - 1);
              return prevCountdown - 1;
            });
          }, 1000);
        } else {
          console.log(
            "トリガー条件が満たされていません（triggeredがtrueではありません）。",
          );
        }
      } else {
        console.log("トリガードキュメントが存在しません。");
      }
    });

    return () => {
      console.log("Firestoreリスナーとインターバルをクリーンアップします。");
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleUpload]);

  // 共通のボタンスタイル
  const buttonClasses =
    "px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center p-4 text-center font-sans">
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          className="h-auto w-full"
        />
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="text-9xl font-bold text-white"
              style={{ textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}
            >
              {countdown}
            </p>
          </div>
        )}
        {isLoading && (
          <div className="bg-opacity-50 absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-white">アップロード中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
