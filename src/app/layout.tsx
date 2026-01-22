import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientSessionProvider } from './login/ClientSessionProvider'; // Correct path if in login folder

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UrsaDeFi',
  description: 'DeFi invoicing for freelancers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}