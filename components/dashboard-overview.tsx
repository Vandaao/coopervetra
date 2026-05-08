"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, DollarSign, TrendingUp, AlertCircle, CheckCircle, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DashboardData {
  topCooperados: Array<{ id: number; nome: string; placa: string; total_km: number; total_fretes: number }>
  debitosPendentes: { quantidade: number; valor: number }
  fretesSemana: { quantidade: number; valor: number }
  pagamentosPendentes: { quantidade: number; valor: number }
  movimentoMensal: Array<{ dia: string; fretes: number; valor: number; debitos: number }>
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const dataInicio = firstDay.toISOString().split("T")[0]
      const dataFim = lastDay.toISOString().split("T")[0]
      const dataSemanaPassa = weekAgo.toISOString().split("T")[0]

      const timestamp = new Date().getTime()

      // Buscar dados em paralelo
      const [rankingRes, debitosRes, fretesRes, movimentoRes] = await Promise.all([
        fetch(`/api/ranking-km?dataInicio=${dataInicio}&dataFim=${dataFim}&_t=${timestamp}`),
        fetch(`/api/debitos?status=pendente&_t=${timestamp}`),
        fetch(`/api/fretes?dataInicio=${dataSemanaPassa}&dataFim=${dataFim}&_t=${timestamp}`),
        fetch(`/api/relatorios/movimento-mensal?dataInicio=${dataInicio}&dataFim=${dataFim}&_t=${timestamp}`),
      ])

      const ranking = await rankingRes.json()
      const debitos = await debitosRes.json()
      const fretes = await fretesRes.json()
      const movimento = await movimentoRes.json()

      // Processar dados de débitos
      const debitosPendentes = Array.isArray(debitos)
        ? debitos.reduce(
            (acc, d) => ({
              quantidade: acc.quantidade + 1,
              valor: acc.valor + (Number(d.valor) || 0),
            }),
            { quantidade: 0, valor: 0 }
          )
        : { quantidade: 0, valor: 0 }

      // Processar dados de fretes da semana
      const fretesSemana = Array.isArray(fretes)
        ? fretes.reduce(
            (acc, f) => ({
              quantidade: acc.quantidade + 1,
              valor: acc.valor + (Number(f.valor) || 0) + (Number(f.chapada) || 0),
            }),
            { quantidade: 0, valor: 0 }
          )
        : { quantidade: 0, valor: 0 }

      setData({
        topCooperados: Array.isArray(ranking) ? ranking.slice(0, 3) : [],
        debitosPendentes,
        fretesSemana,
        pagamentosPendentes: { quantidade: 0, valor: 0 }, // Será calculado depois
        movimentoMensal: Array.isArray(movimento) ? movimento : [],
      })
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              KM Rodados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.topCooperados[0]
                ? Number(data.topCooperados[0].total_km).toLocaleString("pt-BR")
                : 0}{" "}
              km
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data?.topCooperados[0]?.nome || "N/A"} (Mês)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Débitos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.debitosPendentes.quantidade || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              R$ {(data?.debitosPendentes.valor || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Fretes Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.fretesSemana.quantidade || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              R$ {(data?.fretesSemana.valor || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pagamentosPendentes.quantidade || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              R$ {(data?.pagamentosPendentes.valor || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Movimento Mensal */}
      {data?.movimentoMensal && data.movimentoMensal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Movimento Mensal
            </CardTitle>
            <CardDescription>
              Evolução de fretes e débitos durante o mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.movimentoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fretes" stroke="#3b82f6" name="Fretes" />
                <Line type="monotone" dataKey="debitos" stroke="#ef4444" name="Débitos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Cooperados */}
      {data?.topCooperados && data.topCooperados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3 KM - Mês Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCooperados.map((cooperado, idx) => (
                <div
                  key={cooperado.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                        idx === 0
                          ? "bg-yellow-500"
                          : idx === 1
                            ? "bg-gray-400"
                            : "bg-amber-600"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{cooperado.nome}</p>
                      <p className="text-xs text-gray-500">
                        Placa: {cooperado.placa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {Number(cooperado.total_km).toLocaleString("pt-BR")} km
                    </p>
                    <p className="text-xs text-gray-500">
                      {cooperado.total_fretes} frete(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
