import './globals.css'

export const metadata = {
  title: 'Dashboard Builder — AI-Powered Analytics',
  description: 'Generate beautiful dashboards from any data source using natural language',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
