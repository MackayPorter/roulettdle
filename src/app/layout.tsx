import "@mantine/core/styles.css";

import {
  ColorSchemeScript,
  MantineProvider,
  createTheme,
  mantineHtmlProps,
} from "@mantine/core";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gold = [
  "#fffaeb",
  "#fff0c2",
  "#ffe38a",
  "#ffd451",
  "#f2c02e",
  "#d4a41a",
  "#b8890f",
  "#9a700c",
  "#7c5a0a",
  "#5c4308",
] as const;

const felt = [
  "#e8f5ef",
  "#c5e6d4",
  "#9dd4b3",
  "#6cbd8c",
  "#3fa065",
  "#2d7f4e",
  "#1f5f3a",
  "#15452a",
  "#0d2e1c",
  "#061a10",
] as const;

const theme = createTheme({
  primaryColor: "gold",
  primaryShade: { light: 6, dark: 5 },
  colors: { gold: [...gold], felt: [...felt] },
  fontFamily: "var(--font-geist-sans), sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  headings: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
});

export const metadata: Metadata = {
  title: "roulettdle",
  description: "roulettdle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
