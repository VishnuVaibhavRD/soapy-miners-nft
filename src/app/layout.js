import { Geist, Geist_Mono } from "next/font/google";
import PickaxeCursorFollower from "@/components/PickaxeCursorFollower";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Soapy Miners",
  description: "256 pixel miners hidden deep underground on Quai Network.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PickaxeCursorFollower />
      </body>
    </html>
  );
}
