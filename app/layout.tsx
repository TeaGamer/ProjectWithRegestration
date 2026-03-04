import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alex Site",
  description: "Welcome to Alex Site",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
