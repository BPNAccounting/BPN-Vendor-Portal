import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BPN Vendor Onboarding',
  description: 'Bare Performance Nutrition — Vendor Set-Up Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
