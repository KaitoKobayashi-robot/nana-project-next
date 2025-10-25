"use client";

import useMeasure from "react-use-measure";
import { ImageGallery } from "@/app/gallery/_components/ImageGallery";
import Logo from "../../../public/logo.svg";

export default function HomePage() {
  const [ref, { width, height }] = useMeasure();

  return (
    <div
      ref={ref}
      className="flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <div className="m-4 flex flex-row items-center justify-center gap-2 text-2xl font-black text-[#2c2522]">
        <p>みんなの</p>
        <Logo width={width * 0.1} />
        <p>たち</p>
      </div>
      <ImageGallery width={width} />
    </div>
  );
}
