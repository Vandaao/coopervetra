"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/session"
import { Truck, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para dashboard
    if (isAuthenticated()) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-12 text-center">
        {/* Logo e título */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4">
              <Truck className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white">COOPERVETRA</h1>
          <p className="text-xl text-blue-100">
            Cooperativa de Transportadores Autônomos de Rio Pomba e Região
          </p>
        </div>

        {/* Descrição */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-white">Sistema de Gerenciamento de Fretes</h2>
          <p className="text-blue-100 leading-relaxed">
            Plataforma completa para gerenciar fretes, cooperados, débitos e relatórios financeiros da cooperativa.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="flex-1 sm:flex-none">
            <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-blue-50">
              <LogIn className="mr-2 h-5 w-5" />
              Entrar no Sistema
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-blue-100 text-sm">
          <p>Desenvolvido com excelência por Grupo Modelo</p>
          <p>© 2026 Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  )
}
