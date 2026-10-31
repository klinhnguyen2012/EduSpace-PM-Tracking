import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppShell } from '../components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduSpace PM Dashboard',
  description: 'Quản lý tiến độ dự án EduSpace.',
  icons: { icon: '/eduspace-mark.png', apple: '/eduspace-mark.png' },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body><AppShell>{children}</AppShell></body>
    </html>
  )
}
