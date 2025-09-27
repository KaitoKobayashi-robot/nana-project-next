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
  const [message, setMessage] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoConstraints: VideoConstraints = {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    facingMode: "environment",
  };

  const capture = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const imageSrc = webcamRef.current.getScreenshot({
        width: videoWidth,
        height: videoHeight,
      });
      setImgSrc(imageSrc);
      setMessage("");
    }
  }, [webcamRef]);

  const handleUpload = useCallback(async (src: string): Promise<void> => {
    if (!src) return;

    setIsLoading(true);
    setMessage("アップロード中...");

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
        setMessage("アップロードに成功しました！");
      } else {
        setMessage("アップロードに失敗しました。");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("エラーが発生しました。");
    } finally {
      setIsLoading(false);
      setImgSrc(null);
    }
  }, []);

  useEffect(() => {
    const triggerDocRef = doc(db, "camera", "trigger");
    const unsubscribe = onSnapshot(triggerDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().triggered === true) {
        setCountdown(10);
        const countdownInterval = setInterval(() => {
          setCountdown((prevCountdown) => {
            if (prevCountdown === null) {
              clearInterval(countdownInterval);
              return null;
            }
            if (prevCountdown <= 1) {
              clearInterval(countdownInterval);
              const imageSrc = webcamRef.current?.getScreenshot();
              if (imageSrc) {
                setImgSrc(imageSrc);
                handleUpload(imageSrc);
              }
              // トリガーをリセット
              updateDoc(triggerDocRef, { triggered: false });
              return null;
            }
            return prevCountdown - 1;
          });
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, [handleUpload]);

  // 共通のボタンスタイル
  const buttonClasses =
    "px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-full overflow-hidden rounded-lg shadow-lg">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          className="h-auto w-full"
        />
        {countdown !== null && (
          <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-9xl font-bold text-white">{countdown}</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={capture}
          disabled={isLoading || countdown !== null}
          className={buttonClasses}
        >
          キャプチャ
        </button>
      </div>

      {imgSrc && (
        <div className="mt-6 w-full max-w-xs text-center">
          <p className="font-semibold text-gray-700">プレビュー:</p>
          <img
            src={imgSrc}
            alt="capture"
            className="mt-2 h-auto w-full rounded-lg border border-gray-300 shadow-md"
          />
          <div className="mt-4">
            <button
              onClick={() => handleUpload(imgSrc)}
              disabled={isLoading}
              className={buttonClasses}
            >
              {isLoading ? "処理中..." : "アップロード"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 font-medium text-gray-800">{message}</p>}
    </div>
  );
};

export default Camera;
