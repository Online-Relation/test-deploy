// app/layout.tsx
import './globals.css';
import { Poppins } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import AppShell from '@/components/AppShell';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata = {
  title: 'Mit Dashboard',
  description: 'Personligt overblik med gamification',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={poppins.className} suppressHydrationWarning>
      <body className="flex bg-gray-100">
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
      </body>
    </html>
  );
}
