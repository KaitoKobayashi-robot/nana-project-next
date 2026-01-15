import React from "react";

type Props = {
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
};

export const ThemeForm = ({ onSubmit, isSubmitting }: Props) => {
  const [text, setText] = React.useState("");
  const MAX_LENGTH = 22;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_LENGTH) return;
    await onSubmit(text);
    // 成功時はクリア
    setText("");
  };
  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border-4 border-gray-800 p-3 pr-16 text-gray-800 transition-all outline-none focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="新しいお題を入力..."
        />
        <span
          className={`absolute top-3.5 right-3 text-xs ${text.length > MAX_LENGTH ? "font-bold text-red-500" : "text-gray-400"}`}
        ></span>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !text || text.length > MAX_LENGTH}
        className="rounded-lg bg-[#5fc5be] px-4 py-2 font-bold text-white transition-colors hover:bg-[#51a8a2] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "送信中..." : "追加する"}
      </button>
    </form>
  );
};
