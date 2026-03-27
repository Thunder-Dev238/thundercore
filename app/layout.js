import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'ThunderCore - Discord AI Moderation Bot',
  description: 'Professional Discord moderation dashboard. Control AI moderation, automod, anti-nuke, and more.',
  icons: { icon: '/thundercore-logo.jpg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
