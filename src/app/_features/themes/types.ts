import { Timestamp } from "firebase/firestore";

export type Theme = {
  id: string;
  content: string;
  createdAt: Date;
};

// Firestoreに保存される生データの型
export type FirestoreTheme = {
  content: string;
  createdAt: Timestamp;
};
