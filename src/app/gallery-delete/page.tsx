"use client";
import Image from "next/image";
import { GalleryImage, useGallery } from "../gallery-list/hooks/useGallaery";
import { useState, useEffect } from "react";

export default function GalleryDeletePage() {
  const { images, loading, error } = useGallery({ limitCount: 1000 });

  // 選択した画像IDを管理
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // プレビュー用に選択した画像
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  // 削除確認モーダル
  const [showConfirm, setShowConfirm] = useState(false);
  // 削除処理中
  const [deleting, setDeleting] = useState(false);
  // メッセージ
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // メッセージを3秒後に自動で消す
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 画像選択をトグル
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全解除
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // 削除実行
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    setShowConfirm(false);
    setMessage(null);

    try {
      const paths = images
        .filter((img) => selectedIds.has(img.id))
        .map((img) => img.path);

      const res = await fetch("/api/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `${data.successCount} 枚の画像を削除しました`,
        });
        setSelectedIds(new Set());
      } else {
        setMessage({
          type: "error",
          text: data.error || "削除に失敗しました",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "削除に失敗しました",
      });
    } finally {
      setDeleting(false);
    }
  };

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
      <main className="container mx-auto px-4 pt-32 pb-8">
        {/* ヘッダー */}
        <header className="fixed top-0 right-0 left-0 z-20 bg-[#eed243]/80 shadow-md backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-end justify-between">
              <h1 className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">画像管理</h1>
              <p className="text-sm text-gray-500">{images.length} 枚の画像</p>
            </div>

            {/* 操作ボタン */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={deselectAll}
                className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                全解除
              </button>
              <span className="text-sm text-gray-600">
                {selectedIds.size} 枚選択中
              </span>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={selectedIds.size === 0 || deleting}
                className="ml-auto rounded bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "削除中..." : "選択した画像を削除"}
              </button>
            </div>

            {/* メッセージ */}
            {message && (
              <div
                className={`mt-4 rounded p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </header>

        {images.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            画像がまだありません
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-[3118/4499] w-full overflow-hidden rounded-sm shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
                  selectedIds.has(image.id) ? "ring-4 ring-blue-500" : ""
                }`}
              >
                {/* チェックボックス */}
                <label
                  className="absolute top-2 left-2 z-10 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(image.id)}
                    onChange={() => toggleSelect(image.id)}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                {/* 画像カード */}
                <button
                  onClick={() => setPreviewImage(image)}
                  className="absolute inset-0"
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
              </div>
            ))}
          </div>
        )}
      </main>

      {/* プレビューモーダル */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={previewImage.url}
              alt="Full screen preview"
              width={3118}
              height={4499}
              className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-sm object-contain drop-shadow-2xl"
              priority
              unoptimized={false}
            />
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800">削除の確認</h2>
            <p className="mt-2 text-gray-600">
              {selectedIds.size}{" "}
              枚の画像を削除します。この操作は取り消せません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
