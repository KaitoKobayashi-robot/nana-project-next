import type { Metadata } from "next";
import { Geist, Geist_Mono, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "ほめて！",
  description: "だれを？どのように？ほめて！",
  openGraph: {
    title: "ほめて！",
    description:
      "「だれを？どのように？ほめて！」ユーザ体験型ブースにおける主催者用のWebサイトです",
    url: "https://nana-project-next--nana-project-firebase.us-central1.hosted.app",
    siteName: "ほめて！",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${zenMaruGothic.variable} ${geistSans.variable} ${geistMono.variable} bg-[#eed243] text-[#2c2522] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
