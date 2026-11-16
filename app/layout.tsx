import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from './components/app-shell'
import { themeInitScript } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Productividad Pro — Hábitos, Finanzas y Metas',
  description: 'Gestiona hábitos, finanzas, horarios, metas y notas en un solo lugar',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
