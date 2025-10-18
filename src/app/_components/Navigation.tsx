import Link from "next/link";

export const NavButtons = () => {
  const buttonStyle =
    "hover:opacity-50 w-60 h-20 flex justify-center border-2 box-border border-[#2c2522] items-center cursor-pointer rounded-md px-4 py-2 text-center font-bold shadow-xl transition-colors duration-200 text-2xl";
  const liquidGlassStyle =
    " text-white p-10 active:bg-[#5fc5be]/50 active:scale-110 active:rounded-4xl hover:scale-105 hover:rounded-3xl hover:border-b-3 hover:bg-[#5fc5be]/35 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] container mx-auto rounded-2xl bg-[#2c2522]/10 backdrop-blur-[4px] p-6 border-b-2 border-white/30 shadow-lg";
  return (
    <div className="flex w-[18rem] flex-col space-y-8">
      <Link href="/camera">
        <div
          className={`${liquidGlassStyle} flex justify-center text-2xl font-bold lg:hidden`}
        >
          本番
        </div>
      </Link>

      <Link href="/camera/adjustment">
        <div
          className={`${liquidGlassStyle} flex justify-center text-2xl font-bold lg:hidden`}
        >
          カメラ調節
        </div>
      </Link>

      <Link href="/gallery">
        <div
          className={`${liquidGlassStyle} hidden justify-center text-2xl font-bold lg:flex`}
        >
          ギャラリー
        </div>
      </Link>
    </div>
  );
};
