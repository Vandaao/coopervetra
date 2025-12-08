"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Users, Building2, Receipt, FileText, DollarSign, Database, Trophy, Medal } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { UserInfo } from "@/components/user-info"

interface RankingItem {
  id: number
  nome: string
  placa: string
  total_km: number
  total_fretes: number
}

export default function HomePage() {
  const [topCooperados, setTopCooperados] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankingMensal()
  }, [])

  const fetchRankingMensal = async () => {
    try {
      // Pegar primeiro e último dia do mês atual
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const dataInicio = firstDay.toISOString().split("T")[0]
      const dataFim = lastDay.toISOString().split("T")[0]

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/ranking-km?dataInicio=${dataInicio}&dataFim=${dataFim}&_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      setTopCooperados(data.slice(0, 3))
    } catch (error) {
      console.error("Erro ao carregar ranking:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-yellow-500 text-white" // Ouro
      case 1:
        return "bg-gray-400 text-white" // Prata
      case 2:
        return "bg-amber-600 text-white" // Bronze
      default:
        return "bg-gray-200"
    }
  }

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="h-5 w-5" />
    return <Medal className="h-5 w-5" />
  }

  const getMesAtual = () => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return meses[new Date().getMonth()]
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-white mr-3" />
                <h1 className="text-2xl font-bold text-white">Coopervetra - Sistema Gerenciador de Fretes</h1>
              </div>
              <UserInfo />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Painel Principal</h2>
            <p className="text-gray-600">Gerencie cooperados, empresas, fretes e gere relatórios</p>
          </div>

          <Card className="mb-8 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                Top 3 KM Rodados - {getMesAtual()}
              </CardTitle>
              <CardDescription>Ranking dos cooperados com mais quilômetros rodados no mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse text-gray-500">Carregando ranking...</div>
                </div>
              ) : topCooperados.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhum frete registrado neste mês ainda.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topCooperados.map((cooperado, index) => (
                    <div
                      key={cooperado.id}
                      className={`flex items-center p-4 rounded-lg border-2 ${
                        index === 0
                          ? "border-yellow-400 bg-yellow-100"
                          : index === 1
                            ? "border-gray-300 bg-gray-100"
                            : "border-amber-400 bg-amber-100"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${getMedalColor(index)}`}
                      >
                        {getMedalIcon(index)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{cooperado.nome}</div>
                        <div className="text-sm text-gray-600">Placa: {cooperado.placa}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          {Number(cooperado.total_km).toLocaleString("pt-BR")} km
                        </div>
                        <div className="text-xs text-gray-500">{cooperado.total_fretes} frete(s)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Fim do Ranking */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Cooperados
                </CardTitle>
                <CardDescription>Cadastre e gerencie os cooperados</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/cooperados">
                  <Button className="w-full">Gerenciar Cooperados</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Empresas
                </CardTitle>
                <CardDescription>Cadastre e gerencie as empresas</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/empresas">
                  <Button className="w-full">Gerenciar Empresas</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-purple-600" />
                  Fretes
                </CardTitle>
                <CardDescription>Registre e gerencie os fretes</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/fretes">
                  <Button className="w-full">Gerenciar Fretes</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-red-600" />
                  Débitos
                </CardTitle>
                <CardDescription>Registre e gerencie os débitos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/debitos">
                  <Button className="w-full">Gerenciar Débitos</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Relatórios
                </CardTitle>
                <CardDescription>Gere relatórios detalhados de fretes com cálculos automáticos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/relatorios">
                  <Button className="w-full">Gerar Relatórios</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                  Relatórios por Empresa
                </CardTitle>
                <CardDescription>Gere relatórios consolidados por empresa com resumo completo</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/relatorios-empresa">
                  <Button className="w-full">Relatórios por Empresa</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                  Folha de Pagamento
                </CardTitle>
                <CardDescription>Gere folha de pagamento com valores líquidos e contas bancárias</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/folha-pagamento">
                  <Button className="w-full">Folha de Pagamento</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-cyan-600" />
                  Backup de Dados
                </CardTitle>
                <CardDescription>Faça backup local de todos os dados do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/backup">
                  <Button className="w-full">Backup de Dados</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Ranking de KM
                </CardTitle>
                <CardDescription>Veja o ranking completo de quilômetros rodados por período</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ranking-km">
                  <Button className="w-full">Ver Ranking</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="bg-white text-black text-center py-3 mt-auto">
          Grupo Modelo - Excelência que inspira confiança
        </footer>
      </div>
    </AuthGuard>
  )
}
