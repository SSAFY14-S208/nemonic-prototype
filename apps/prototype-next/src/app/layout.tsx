import type { Metadata } from 'next'
import '@/styles/index.css'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Jiwon 3D Portfolio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
