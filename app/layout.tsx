import type { Metadata } from "next";
import "./Primary.css";

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
    <html lang = "en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('interfaceTheme');var l=localStorage.getItem('interfaceLanguage');document.documentElement.dataset.theme=t==='dark'?'dark':'light';if(l==='uk'||l==='pl'||l==='en'){document.documentElement.lang=l;}}catch(e){document.documentElement.dataset.theme='light';}})();`,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}