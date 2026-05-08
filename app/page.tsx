"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function HomePage() {
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
