"use client";

import { useRef, useCallback, useState, useEffect } from "react";

// videoConstraintsの型定義
interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "user" | "environment";
  aspectRatio: number; // aspectRatioプロパティを追加
}

const idealWidth: number = 2160;
const idealHeight: number = 3840;

// コンポーネントの外で定義することで、再レンダリングによる再生成を防ぐ
const videoConstraints: VideoConstraints = {
  width: { ideal: idealWidth },
  height: { ideal: idealHeight },
  facingMode: "environment",
  aspectRatio: idealWidth / idealHeight, // アスペクト比を指定
};

interface CameraProps {
  startCapture: boolean;
  onComplete: () => void;
}

const Camera = ({ startCapture, onComplete }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // 撮影中フラグ
  const isCapturing = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleUpload = useCallback(
    async (src: string): Promise<void> => {
      if (!src) return;
      setIsLoading(true);
      try {
        const blob = await fetch(src).then((res) => res.blob());
        const formData = new FormData();
        formData.append("file", blob, ".png");
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Upload successful:", data);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsLoading(false);
        setImgSrc(null);
        onComplete();
      }
    },
    [onComplete],
  );

  const takePhoto = useCallback(async () => {
    // 撮影中であれば処理を中断
    if (isCapturing.current) return;
    if (!streamRef.current) {
      console.log("カメラの準備ができていません。");
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState === "ended") {
      console.error("ビデオトラックが無効な状態です。");
      return;
    }

    try {
      // 撮影中フラグを立てる
      isCapturing.current = true;
      await new Promise((resolve) => setTimeout(resolve, 500));

      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();
      const imageUrl = URL.createObjectURL(blob);
      setImgSrc(imageUrl);
      await handleUpload(imageUrl);
    } catch (error) {
      console.error("写真の撮影に失敗しました:", error);
    } finally {
      // 撮影完了後、フラグを解除
      isCapturing.current = false;
    }
  }, [handleUpload]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        console.error("カメラへのアクセスに失敗しました:", err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // 依存配列を空にして、マウント時に一度だけ実行されるようにする

  useEffect(() => {
    if (startCapture) {
      setCountdown(10);
      intervalRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown === null) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return null;
          }
          if (prevCountdown <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            takePhoto();
            return null;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCapture, takePhoto]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center p-4 text-center font-sans">
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-auto w-full"
          style={{ aspectRatio: "3 / 4", objectFit: "cover" }} // style属性を追加
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
          <div className="bg-opacity-50 absolute inset-0 flex flex-col items-center justify-center bg-white">
            <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-black"></div>
            <p className="mt-4 text-black">アップロード中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
