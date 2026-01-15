import { useEffect, useState } from "react";
import { Theme } from "@/app/_features/themes/types";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { getThemeCollection } from "../api";

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // クエリの構築
    const q = query(getThemeCollection(), orderBy("createdAt", "desc"));

    // リアルタイムリスナーの登録
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newThemes = snapshot.docs.map((doc) => doc.data());
        setThemes(newThemes);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setError(error);
        setLoading(false);
      },
    );
    // クリーンアップ
    return () => unsubscribe();
  }, []);

  return { themes, loading, error };
};
