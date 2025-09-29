"use client";

import { useRef, useCallback, useState, useEffect } from "react";

<<<<<<< HEAD
const widthVideo = 1080;
const heightVideo = 1920;
=======
// // videoConstraintsの型定義
// interface VideoConstraints {
//   width: { ideal: number };
//   height: { ideal: number };
//   facingMode: "user" | "environment";
// }

// // コンポーネントの外で定義することで、再レンダリングによる再生成を防ぐ
// const videoConstraints: VideoConstraints = {
//   width: { ideal: 1080 },
//   height: { ideal: 1920 },
//   facingMode: "environment",
// };

const widthVideo = 2160;
const heightVideo = 3840;
>>>>>>> parent of 801016f (🎨)

const videoConstraints: MediaStreamConstraints["video"] = {
  width: { ideal: widthVideo },
  height: { ideal: heightVideo },
  facingMode: "environment",
};

interface CameraProps {
  startCapture: boolean;
  onComplete: () => void;
}

const Camera = ({ startCapture, onComplete }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Canvasのrefを追加
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturing = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleUpload = useCallback(
    async (blob: Blob | null): Promise<void> => {
      // Blobを受け取るように変更
      if (!blob) return;
      setIsLoading(true);
      try {
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
    if (isCapturing.current || !videoRef.current || !canvasRef.current) return;

    isCapturing.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // ビデオの現在の解像度を取得
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Canvasのサイズをビデオの向きに合わせて設定
    // 縦長にするため、widthとheightを入れ替える
    canvas.width = videoHeight;
    canvas.height = videoWidth;

    const context = canvas.getContext("2d");
    if (context) {
      // Canvasを90度回転
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(Math.PI / 2);
      // ビデオフレームを描画
      context.drawImage(video, -videoWidth / 2, -videoHeight / 2);

      // CanvasからBlobを取得
      canvas.toBlob(async (blob) => {
        if (blob) {
          // imgSrcに設定してプレビュー（任意）
          const imageUrl = URL.createObjectURL(blob);
          setImgSrc(imageUrl);
          await handleUpload(blob);
        }
        isCapturing.current = false;
      }, "image/png");
    } else {
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
  }, []);

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

  // CSSでの回転はプレビューにのみ適用
  const videoStyle: React.CSSProperties = {
    transform: "rotate(90deg)",
    width: "calc(100vh)",
    height: "calc(100vw)",
    objectFit: "cover",
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center p-4 text-center font-sans">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg">
        <video ref={videoRef} autoPlay playsInline style={videoStyle} />
        {/* 非表示のCanvas要素を追加 */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
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
