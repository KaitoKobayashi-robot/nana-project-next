"use client";

import useMeasure from "react-use-measure";
import { ImageGallery } from "@/app/gallery/_components/ImageGallery";
import Logo from "../../../public/home_port.svg";
import Image from "next/image";

export default function HomePage() {
  const [ref, { width, height }] = useMeasure();

  const isMounted = width > 0;

  return (
    <div
      ref={ref}
      className="flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      {isMounted && (
        <>
          <div className="m-4 flex flex-row items-center justify-center gap-2 text-2xl font-black text-[#2c2522]">
            <Image
              src="/home_port.svg"
              alt="Home Port Logo"
              width={width * 0.2}
              height={height * 0.1}
            />
          </div>
          <ImageGallery width={width} />
        </>
      )}
    </div>
  );
}
