import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GradientBlob } from '@/components/gradient-blob'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'HR Governance Audit',
  description: 'HR Governance Audit dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <GradientBlob className="-right-32 -top-40 h-[520px] w-[520px] opacity-40" />
          <GradientBlob className="-bottom-48 -left-40 h-[440px] w-[440px] opacity-25" />
        </div>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
