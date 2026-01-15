"use client";

import { useState } from "react";
import { useThemes } from "../hooks/useThemes";
import { addTheme, deleteTheme } from "../api";
import { ThemeForm } from "./ThemeForm";
import { ThemeList } from "./ThemeList";

export const THemeManager = () => {
  const { themes, loading, error } = useThemes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // お題を追加するハンドラ
  const handleAdd = async (text: string) => {
    setIsSubmitting(true);
    try {
      await addTheme(text);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // お題を削除するハンドラ
  const handleDelete = async (id: string) => {
    if (!confirm("削除してよろしいですか？")) return;
    try {
      await deleteTheme(id);
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  if (error)
    return (
      <div className="text-center text-red-500">
        読み込みエラーが発生しました
      </div>
    );

  return (
    <div className="mx-auto min-h-[500px] max-w-xl rounded-xl bg-gray-50 p-4">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
        お題管理
      </h2>
      <ThemeForm onSubmit={handleAdd} isSubmitting={isSubmitting} />
      {loading ? (
        <div className="animate-pulse py-10 text-center text-gray-400">
          読み込み中...
        </div>
      ) : (
        <ThemeList themes={themes} onDelete={handleDelete} />
      )}
    </div>
  );
};
