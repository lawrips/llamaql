// app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers."; // Import the Providers component

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "llamaql",
  description: "by lawrips",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
