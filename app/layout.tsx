import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Coopervetra - Sistema de Fretes",
  description: "Sistema de gerenciamento de fretes da Cooperativa de Transportadores Autônomos de Rio Pomba e Região",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 flex flex-col md:ml-64 overflow-auto">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 md:hidden">
              <div className="h-16" />
            </header>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 text-center py-3 text-xs text-gray-500 mt-auto">
              Grupo Modelo - Excelência que inspira confiança
            </footer>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
