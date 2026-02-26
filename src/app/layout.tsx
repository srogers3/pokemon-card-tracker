import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { DevPanel } from "@/components/dev-panel";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cardboard Tracker",
  description: "Track trading card restocks at retail stores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={nunito.className}>
          {children}
          {process.env.NODE_ENV === "development" && <DevPanel />}
        </body>
      </html>
    </ClerkProvider>
  );
}
