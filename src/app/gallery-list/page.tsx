"use client";
import Image from "next/image";
import { GalleryImage, useGallery } from "./hooks/useGallaery";
import { useState } from "react";

export default function GalleryListPage() {
  const { images, loading, error } = useGallery({ limitCount: 1000 });

  // 選択した画像を管理する状態
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  // モーダルを閉じる関数
  const closeModal = () => setSelectedImage(null);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
          <p className="font-medium text-gray-500">画像を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-red-500">
        <p>画像の取得に失敗しました。</p>
      </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 pt-24 pb-8">
        <header className="fixed top-0 right-0 left-0 z-20 bg-[#eed243]/80 shadow-md backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-end justify-between">
              <h1 className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">
                今までのみんなのほめて
              </h1>
              <p className="text-sm text-gray-500">{images.length} 枚のほめて</p>
            </div>
          </div>
        </header>

        {images.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            画像がまだありません
          </div>
        ) : (
          /* レスポンシブレイアウト */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="relative aspect-[3118/4499] w-full overflow-hidden rounded-sm shadow-sm transition-all hover:scale-[1.08] hover:shadow-md"
                type="button"
              >
                <Image
                  src={image.url}
                  alt="Gallery thumbnail"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88OjpfwAIuQOs0827hAAAAABJRU5ErkJggg=="
                  unoptimized={false}
                />
              </button>
            ))}
          </div>
        )}
      </main>
      {/** 画像モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 p-4 backdrop-blur-md"
          onClick={closeModal}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/** 閉じるボタン */}
            {/*
            <button
              onClick={closeModal}
              className="absolute -top-10 -right-10 p-2 text-black/50 transition-colors hover:text-black"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button> */}

            <Image
              src={selectedImage.url}
              alt="Full screen preview"
              width={3118}
              height={4499}
              className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-sm object-contain drop-shadow-2xl"
              priority
              unoptimized={false}
            />
          </div>
        </div>
      )}{" "}
    </>
  );
}
