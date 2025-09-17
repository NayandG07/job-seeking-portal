import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { ToastProvider } from '../components/common/Toast.jsx';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Job Seeking Portal',
  description: 'A comprehensive job seeking portal for students and recruiters',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}