"use client";

import Image from "next/image";
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
      <Logo width={width * 0.1} height={height * 0.1} className="mb-4" />
      <ImageGallery width={width} />
    </div>
  );
}
