import Link from "next/link";

export const NavButtons = () => {
  const buttonStyle =
    "hover:opacity-50 w-60 h-20 flex justify-center border-2 box-border border-[#2c2522] items-center cursor-pointer rounded-md px-4 py-2 text-center font-bold shadow-xl transition-colors duration-200 text-2xl";

  return (
    <div className="flex flex-col space-y-6">
      <Link href="/camera">
        <div className={`${buttonStyle} `}>本番</div>
      </Link>

      <Link href="/camera/adjustment">
        <div className={`${buttonStyle} `}>カメラ調節</div>
      </Link>

      <Link href="/gallery">
        <div className={`${buttonStyle} `}>ギャラリー</div>
      </Link>
    </div>
  );
};
