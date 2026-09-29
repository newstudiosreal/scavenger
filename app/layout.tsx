import './globals.css'

export const metadata = {
  title: 'Scavenger',
  description: 'Esplora, raccogli e commercia!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-slate-900 text-white min-h-screen">{children}</body>
    </html>
  )
}
