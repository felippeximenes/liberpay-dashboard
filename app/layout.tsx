import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiberPay — Dashboard de Funil de Vendas',
  description: 'Visibilidade semanal sobre a jornada do cliente LiberPay',
  icons: { icon: '/logo1.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
