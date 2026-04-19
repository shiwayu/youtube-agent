import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube戦略台本エージェント',
  description: 'AIがYouTube台本を自動生成',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Noto Sans JP', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
