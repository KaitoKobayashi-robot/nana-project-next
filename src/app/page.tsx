import { NavButtons } from "./_components/Navigation";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main>
        <Image
          src="/logo.svg"
          alt="Logo"
          width={150}
          height={150}
          className="absolute top-0 left-1/2 mt-20 -translate-x-1/2"
        />
        <div className="mt-30">
          <NavButtons />
        </div>
      </main>
    </div>
  );
}
