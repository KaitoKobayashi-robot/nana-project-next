"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import SpeechBubble from "../../../../public/speech_bubble.svg";

const widthVideo = 3000;
const heightVideo = 3000;

const videoConstraints: MediaStreamConstraints["video"] = {
  width: { ideal: widthVideo },
  height: { ideal: heightVideo },
  facingMode: "environment",
};

interface CameraProps {
  startCapture: boolean;
  onComplete: () => void;
  aspectRatio?: number;
}

const Camera = ({
  startCapture,
  onComplete,
  aspectRatio = 3 / 4,
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

      // ここから反転処理
      // 現在のコンテキストの状態を保存
      context.save();
      // 水平方向に反転
      context.scale(-1, 1);
      // 描画基準点を右端に移動
      context.translate(-sWidth, 0);

      // ビデオから計算した領域を切り抜いてCanvasに描画
      context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      context.restore(); // コンテキストの状態を元に戻す

      // 画像をBlobとして取得し、アップロード処理へ渡す
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
  }, [handleUpload, aspectRatio]);

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
    let timeoutId = null;

    if (startCapture) {
      timeoutId = setTimeout(() => {
        setCountdown(9);
        intervalRef.current = setInterval(() => {
          setCountdown((prevCountdown) => {
            if (prevCountdown === null) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return null;
            }
            if (prevCountdown <= 0) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              takePhoto();
              return null;
            }
            return prevCountdown - 1;
          });
        }, 1000);
      }, 3000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCapture, takePhoto]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center overflow-hidden text-center">
      <div
        className="relative flex w-full items-center justify-center overflow-hidden"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scaleX(-1)",
            minWidth: "100%",
            minHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "cover",
          }}
        />
        <SpeechBubble
          width={400}
          height={160}
          className="absolute bottom-0 left-1/2 mb-0 -translate-x-1/2"
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {countdown !== null && (
          <div className="z-10 flex items-center justify-center pb-20">
            <Image
              src={`/countdown/${countdown}.png`}
              alt={{ countdown }.toString()}
              width={240}
              height={180}
              priority
            />{" "}
            {/* <p
              className="text-9xl font-bold text-[#5fc5be]"
              // style={{ textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}
            >
              {countdown}
            </p> */}
          </div>
        )}
        {isLoading && (
          <div className="bg-opacity-50 absolute inset-0 flex flex-col items-center justify-center bg-[#eed243]">
            <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-[#2c2522]"></div>
            <p className="mt-4 font-bold">アップロード中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
