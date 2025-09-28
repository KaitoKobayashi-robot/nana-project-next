"use client";

import { useRef, useCallback, useState, useEffect } from "react";

// videoConstraintsの型定義
interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "user" | "environment";
  focusMode?: "continuous" | "manual" | "single-shot" | "none";
}

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

  const videoConstraints: VideoConstraints = {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    facingMode: "environment",
    focusMode: "continuous",
  };

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

    try {
      // 撮影中フラグを立てる
      isCapturing.current = true;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack.getCapabilities?.().facingMode) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ focusMode: "continuous" } as any],
          });
        } catch (error) {
          console.error("Failed to apply focus constraints:", error);
        }
      }
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
  }, [videoConstraints]);

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
        <video ref={videoRef} autoPlay playsInline className="h-auto w-full" />
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
