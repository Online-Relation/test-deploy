import './globals.css';
import Sidebar from '../components/Sidebar';
import { Poppins } from 'next/font/google';
import { XpProvider } from '@/context/XpContext';
import { CategoryProvider } from '@/context/CategoryContext';

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
        <XpProvider>
          <CategoryProvider>
            <Sidebar />
            <div className="flex-1 min-h-screen p-6 bg-white shadow-inner">
              {children}
            </div>
          </CategoryProvider>
        </XpProvider>
      </body>
    </html>
  );
}
