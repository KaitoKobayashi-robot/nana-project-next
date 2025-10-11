"use client";
import Camera from "@/app/camera/_components/Camera";
import Image from "next/image";

export default function CameraAdjustmentPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center pt-16">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={100}
        height={100}
        className="absolute top-0 left-1/2 mt-4 -translate-x-1/2"
      />
      <div className="flex w-screen flex-col items-center justify-center pr-4 pl-4">
        <div className="flex w-full max-w-md items-center justify-center border-2 border-[#2c2522] px-2 py-2">
          <h2 className="text-lg font-bold">お題</h2>
        </div>{" "}
        <div className="w-full">
          <Camera startCapture={false} onComplete={() => {}} />
        </div>
      </div>{" "}
    </div>
  );
}
