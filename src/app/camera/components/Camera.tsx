"use client";

import { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

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

  const handleUpload = async (): Promise<void> => {
    if (!imgSrc) return;

    setIsLoading(true);
    setMessage("アップロード中...");

    try {
      const blob = await fetch(imgSrc).then((res) => res.blob());
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
    }
  };

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
      </div>

      <div className="mt-4">
        <button
          onClick={capture}
          disabled={isLoading}
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
              onClick={handleUpload}
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
