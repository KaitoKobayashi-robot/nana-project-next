"use client";

import { useRef, useCallback, useState, useEffect } from "react";

const widthVideo = 6000;
const heightVideo = 8000;

const videoConstraints: MediaStreamConstraints["video"] = {
  width: { ideal: widthVideo },
  height: { ideal: heightVideo },
  facingMode: "environment",
};

interface CameraProps {
  startCapture: boolean;
  onComplete: () => void;
  aspectRatio?: number; // ✅ 変更点: アスペクト比をpropsとして受け取る
}

const Camera = ({
  startCapture,
  onComplete,
  aspectRatio = 3 / 4, // ✅ 変更点: デフォルト値を設定 (例: 16:9)
}: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturing = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleUpload = useCallback(
    async (blob: Blob | null): Promise<void> => {
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

  // ✅ 変更点: takePhoto関数全体をアスペクト比に合わせてクロップするロジックに修正
  const takePhoto = useCallback(async () => {
    if (isCapturing.current || !videoRef.current || !canvasRef.current) return;

    isCapturing.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoAspectRatio = videoWidth / videoHeight;

      let sWidth, sHeight, sx, sy; // ソース(ビデオ)から切り抜く領域を定義

      // ビデオのアスペクト比と目的のアスペクト比を比較して、クロップ領域を計算
      if (videoAspectRatio > aspectRatio) {
        // ビデオが目的より横長の場合: 高さを基準に幅を計算
        sHeight = videoHeight;
        sWidth = videoHeight * aspectRatio;
        sx = (videoWidth - sWidth) / 2;
        sy = 0;
      } else {
        // ビデオが目的より縦長の場合: 幅を基準に高さを計算
        sWidth = videoWidth;
        sHeight = videoWidth / aspectRatio;
        sx = 0;
        sy = (videoHeight - sHeight) / 2;
      }

      // Canvasのサイズを、最終的に出力したい画像の解像度（切り抜くサイズ）に設定
      canvas.width = sWidth;
      canvas.height = sHeight;

      // ビデオから計算した領域を切り抜いてCanvasに描画
      context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setImgSrc(imageUrl); // プレビュー用
          await handleUpload(blob);
        }
        isCapturing.current = false;
      }, "image/png");
    } else {
      isCapturing.current = false;
    }
  }, [handleUpload, aspectRatio]); // 依存配列にaspectRatioを追加

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center p-4 text-center font-sans">
      {/* ✅ 変更点: ビデオのコンテナにCSSの aspect-ratio を適用 */}
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black shadow-lg"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            // ✅ 変更点: コンテナいっぱいに広がるように絶対配置
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
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
