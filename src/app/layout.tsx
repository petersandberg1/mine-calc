import "./globals.css";

export const metadata = {
  title: "Pre-Sales  Mining Calculator (Prototype)",
  description: "Prototype calculator for mining autonomy pre-sales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}