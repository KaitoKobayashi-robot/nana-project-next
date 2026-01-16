"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GalleryImage {
  id: string;
  url: string;
  path: string;
  updatedAt?: any;
}

interface UseGalleryOptions {
  limitCount?: number;
}

export const useGallery = ({ limitCount = 50 }: UseGalleryOptions = {}) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // クエリの構築
    const constraints: QueryConstraint[] = [orderBy("updatedAt", "desc")];
    if (limitCount > 0) {
      constraints.push(limit(limitCount));
    }
    const q = query(collection(db, "images"), ...constraints);

    // リアルタイムリスナーの設定
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const imageList: GalleryImage[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            // ガード: URLがないデータ（古いデータなど）は除外してクラッシュを防ぐ
            if (data.url) {
              imageList.push({
                id: doc.id,
                url: data.url,
                path: data.path,
                updatedAt: data.updatedAt,
              });
            }
          });

          setImages(imageList);
          setLoading(false);
        } catch (err) {
          console.error("Data processing error:", err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError(err);
        setLoading(false);
      },
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, [limitCount]);

  return { images, loading, error };
};
