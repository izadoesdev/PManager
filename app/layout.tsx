import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: 'PManager | Modern Project Management',
    template: '%s | PManager'
  },
  description: 'A modern, intuitive project management tool for organizing tasks, managing projects, and collaborating with your team.',
  keywords: ['project management', 'task management', 'kanban board', 'team collaboration', 'productivity'],
  creator: 'Izadoesdev',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'PManager | Modern Project Management',
    description: 'A modern, intuitive project management tool for organizing tasks, managing projects, and collaborating with your team.',
    siteName: 'PManager'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PManager | Modern Project Management',
    description: 'A modern, intuitive project management tool for organizing tasks, managing projects, and collaborating with your team.'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} font-sans bg-background antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
