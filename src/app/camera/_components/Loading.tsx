"use cliant";
import { useState, useEffect, use } from "react";
import Logo from "../../../../public/tablet.svg";
import Arrows from "../../../../public/arrows_right.svg";

export const Loading = () => {
  const [animationKey, setAnimationKey] = useState(0);
  const totalDuration = 3000;

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationKey((prev) => prev + 1);
    }, totalDuration);
    return () => clearInterval(timer);
  }, []);

  const bouncingText = "待機中...".split("");
  const animationInterval = 200;

  return (
    <h1 className="flex flex-col items-center">
      {/* <div key={animationKey} className="flex">
        {bouncingText.map((char, index) => (
          <span
            key={index}
            className="animate-text-animation inline-block text-4xl font-bold opacity-0"
            style={{ animationDelay: `${index * animationInterval}ms` }}
          >
            {char}
          </span>
        ))}
      </div> */}
      <Logo width={250} />
      <Arrows width={250} className="p-4" />
      <p className="mt-4 text-2xl font-black text-[#2c2522]">
        タブレットの画面を見てね！
      </p>
    </h1>
  );
};
