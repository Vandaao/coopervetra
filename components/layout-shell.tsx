"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

// Rotas sem o "chrome" do app (sem sidebar/footer): páginas de acesso
const ROTAS_SEM_SIDEBAR = ["/", "/home", "/login"]

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const semSidebar = ROTAS_SEM_SIDEBAR.includes(pathname)

  // Páginas de acesso ocupam a tela inteira, sem sidebar/footer
  if (semSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-64 overflow-auto">
        {/* Header (mobile) */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 md:hidden">
          <div className="h-16" />
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">{children}</div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 text-center py-3 text-xs text-gray-500 mt-auto">
          Grupo Modelo - Excelência que inspira confiança
        </footer>
      </main>
    </div>
  )
}
