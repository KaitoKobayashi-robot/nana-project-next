"use cliant";
import { useState, useEffect, use } from "react";

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
      <div key={animationKey} className="flex">
        {bouncingText.map((char, index) => (
          <span
            key={index}
            className="animate-text-animation inline-block text-4xl font-bold opacity-0"
            style={{ animationDelay: `${index * animationInterval}ms` }}
          >
            {char}
          </span>
        ))}
      </div>
      <p className="mt-4 text-lg">タブレットを操作してね</p>
    </h1>
  );
};
