import { Theme } from "../types";

type Props = {
  themes: Theme[];
  onDelete: (id: string) => Promise<void>;
};

export const ThemeList = ({ themes, onDelete }: Props) => {
  if (themes.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">お題がまだありません</p>
    );
  }

  return (
    <ul className="space-y-3">
      {themes.map((theme) => (
        <li
          key={theme.id}
          className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="mr-4 font-medium break-all text-gray-800">
            {theme.content}
          </span>
          <button
            onClick={() => onDelete(theme.id)}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="削除"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
};
