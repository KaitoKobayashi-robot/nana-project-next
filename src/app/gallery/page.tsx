"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

// Firebaseの設定 (変更なし)
const firebaseConfig = {
  apiKey: "AIzaSyBS_S8Tfa_nNqH5TtrooC9EY4Be1qapIAk",
  authDomain: "nana-project-firebase.firebaseapp.com",
  projectId: "nana-project-firebase",
  storageBucket: "nana-project-firebase.firebasestorage.app",
  messagingSenderId: "146917195160",
  appId: "1:146917195160:web:5ceaf0d6333e0eb644bfed",
  measurementId: "G-CNDQ5N1D5P",
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ローカル環境でのエミュレータ接続
if (
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default function HomePage() {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestImageId, setLatestImageId] = useState<string | null>(null);

  useEffect(() => {
    // API Routeを呼び出して同期を実行
    fetch("/api/synchronize");

    const q = query(collection(db, "images"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, async snapshot => {
      setLoading(true);
      const imageList = await Promise.all(
        snapshot.docs.map(async doc => {
          const data = doc.data();
          const url = await getDownloadURL(ref(storage, data.path));
          return { id: doc.id, url };
        })
      );
      setImages(imageList);

      if (snapshot.docs.length > 0) {
        setLatestImageId(snapshot.docs[0].id);
      } else {
        setLatestImageId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 画像が0枚の時はアニメーションを止める
  const animationClass = images.length > 0 ? "animate-scroll" : "";
  const duplicatedImages = images.length > 0 ? [...images, ...images] : [];

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Gallery
        </h1>
        {loading && (
          <div className="flex flex-col items-center gap-4 my-8">
            {/* Tailwind CSS標準のspinアニメーション */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">画像を更新しているよ！</p>
          </div>
        )}
        {/* globals.cssで定義した .mask-gradient を適用 */}
        <div className="w-full overflow-hidden p-8 mask-gradient">
          <div className={`w-max flex gap-4 p-4 ${animationClass}`}>
            {duplicatedImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                // transitionとtransformユーティリティでハイライトを表現
                className={`transition-transform duration-300 ease-in-out ${
                  image.id === latestImageId
                    ? "scale-105 shadow-2xl shadow-yellow-400/50 mx-4"
                    : ""
                }`}
              >
                <Image
                  src={image.url}
                  alt="gallery image"
                  width={500}
                  height={500}
                  className="h-[500px] w-auto rounded-lg shadow-lg"
                  priority
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
