"use client";
import { useEffect, useState, useLayoutEffect } from "react";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

// --- 設定値 ---
const IMAGES_PER_ROW = 5;
const TOTAL_ROWS = 2;
const ANIMATION_DURATION = 120;

// --- 親コンポーネントから受け取るPropsの型定義 ---
interface ImageGalleryProps {
  // 親要素の幅を受け取る
  width: number;
}

export const ImageGallery = ({ width }: ImageGalleryProps) => {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestImageId, setLatestImageId] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);

  // Firebaseからのデータ取得ロジック (変更なし)
  useEffect(() => {
    fetch("/api/synchronize");
    const totalImagesToFetch = IMAGES_PER_ROW * TOTAL_ROWS;
    const q = query(
      collection(db, "images"),
      orderBy("updatedAt", "desc"),
      limit(totalImagesToFetch),
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      const imageList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const url = await getDownloadURL(ref(storage, data.path));
          return { id: doc.id, url };
        }),
      );
      setImages([...imageList].reverse());
      if (snapshot.docs.length > 0) {
        setLatestImageId(snapshot.docs[0].id);
      } else {
        setLatestImageId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 親から渡された 'width' props を基に画像サイズを計算
  useLayoutEffect(() => {
    // width が有効な値の場合にのみ計算を実行
    if (width > 0) {
      const gap = 16; // Tailwindのgap-4に相当 (1rem = 16px)
      const containerWidth = width;
      const totalGaps = IMAGES_PER_ROW - 1;
      const newImageWidth = (containerWidth - gap * totalGaps) / IMAGES_PER_ROW;
      setImageWidth(newImageWidth);
    }
  }, [width]); // 'width' props が変更されたときに再計算

  const duplicatedImages = images.length > 0 ? [...images, ...images] : [];

  const animationStyle = {
    "--animation-duration": `${ANIMATION_DURATION}s`,
  } as React.CSSProperties;

  return (
    <div className="w-full">
      {loading && (
        <div className="my-8 flex flex-col items-center gap-4">
          <div className="h-20 w-20 animate-spin rounded-full border-t-2 border-[#2c2222]"></div>
          <p className="mt-8 text-4xl">画像を更新しているよ！</p>
        </div>
      )}
      {!loading && (
        <div
          className="mask-gradient w-full overflow-hidden"
          style={animationStyle}
        >
          <div className="w-full">
            {imageWidth > 0 && (
              <div className="flex flex-col gap-4">
                {/* --- 上段 --- */}
                <div className="animate-scroll-custom flex w-max gap-4">
                  {duplicatedImages.map((image, index) => (
                    <ImageCard
                      key={`top-${image.id}-${index}`}
                      image={image}
                      imageWidth={imageWidth}
                      isLatest={image.id === latestImageId}
                    />
                  ))}
                </div>
                {/* --- 下段 --- */}
                <div
                  className="animate-scroll-custom flex w-max gap-4"
                  style={{ animationDelay: `-${ANIMATION_DURATION / 2}s` }}
                >
                  {duplicatedImages.map((image, index) => (
                    <ImageCard
                      key={`bottom-${image.id}-${index}`}
                      image={image}
                      imageWidth={imageWidth}
                      isLatest={image.id === latestImageId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 画像カードコンポーネント
const ImageCard = ({
  image,
  imageWidth,
  isLatest,
}: {
  image: { id: string; url: string };
  imageWidth: number;
  isLatest: boolean;
}) => {
  return (
    <div
      className={`relative rounded-lg transition-transform duration-300 ease-in-out ${
        isLatest
          ? "border-8 border-[#5fc5be] shadow-lg shadow-[#5fc5be]/80"
          : ""
      }`}
      style={{
        width: `${imageWidth}px`,
        height: `${(imageWidth * 4) / 3}px`,
      }}
    >
      <Image
        src={image.url}
        alt="gallery image"
        fill
        sizes={`${Math.ceil(100 / IMAGES_PER_ROW)}vw`}
        className="rounded-lg object-cover shadow-lg"
        priority
      />
    </div>
  );
};
