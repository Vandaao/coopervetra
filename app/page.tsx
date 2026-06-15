"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/session"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Se não estiver autenticado, redirecionar para home
    if (!isAuthenticated()) {
      router.push("/home")
    }
  }, [router])

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
          <p className="text-gray-600 mt-1">Bem-vindo ao Coopervetra - Sistema de Gerenciamento de Fretes</p>
        </div>

        <DashboardOverview />
      </div>
    </AuthGuard>
  )
}
