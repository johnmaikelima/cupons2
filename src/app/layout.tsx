import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CldUploadWidgetInfo } from 'next-cloudinary';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LinkCompra - Cupons de Desconto',
  description: 'Encontre os melhores cupons de desconto das suas lojas favoritas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          src={`https://widget.cloudinary.com/v2.0/global/all.js`}
          async
        />
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-9Q1684JPLX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-9Q1684JPLX');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
