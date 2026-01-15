import { NavButtons } from "./_components/Navigation";
import Logo from "../../public/logo.svg";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Image
        src="/home_port.svg"
        alt="Home Port Logo"
        width={150}
        height={150}
      />
      <div className="mt-10">
        <NavButtons />
      </div>
    </main>
  );
}
