import type { Metadata } from "next";
import "./css/Global.css";

// Метадані для сторінки
export const metadata: Metadata = {
  title: "Alex Site",
  description: "Welcome to Alex Site",
};

// Кореневий layout для всього додатку
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // HTML структура з мовою англійською
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
