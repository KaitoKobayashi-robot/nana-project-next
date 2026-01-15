import {
  FirestoreDataConverter,
  serverTimestamp,
  QueryDocumentSnapshot,
  collection,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FirestoreTheme, Theme } from "./types";
import { db } from "@/lib/firebase";

// Firestoreのデータを扱いやすい型へ変換するコンバータ
const themeConverter: FirestoreDataConverter<Theme> = {
  toFirestore(theme: Theme): FirestoreTheme {
    return {
      content: theme.content,
      createdAt: serverTimestamp() as any,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Theme {
    const data = snapshot.data() as FirestoreTheme;
    return {
      id: snapshot.id,
      content: data.content,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  },
};

// コレクション参照の取得ヘルパー
export const getThemeCollection = () =>
  collection(db, "theme").withConverter(themeConverter);

// 追加処理
export const addTheme = async (content: string) => {
  if (!content.trim()) throw new Error("Empty data");
  if (content.length > 25) throw new Error("Overflow");

  await addDoc(getThemeCollection(), {
    content,
  } as Theme);
};

// 削除処理
export const deleteTheme = async (id: string) => {
  await deleteDoc(doc(getThemeCollection(), id));
};
