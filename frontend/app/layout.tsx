import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { PaymentProvider } from "@/lib/payment-context"
import { NotificationProvider } from "@/lib/notification-context"
import { Chatbot } from "@/components/chatbot"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Travel Savings Circle - Save Together, Travel Together",
  description: "Join a circle of friends to save money together for your dream vacation",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isProd = process.env.NODE_ENV === 'production'
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <PaymentProvider>
            <NotificationProvider>
              {children}
              <Chatbot />
            </NotificationProvider>
          </PaymentProvider>
        </AuthProvider>
        {isProd && <Analytics />}
      </body>
    </html>
  )
}
