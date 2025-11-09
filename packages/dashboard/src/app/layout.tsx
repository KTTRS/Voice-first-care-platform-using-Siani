import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sainte - AI Care Platform Dashboard',
  description: 'Admin dashboard for Sainte AI care platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
