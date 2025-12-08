"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Medal, RefreshCw, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RankingItem {
  id: number
  nome: string
  placa: string
  total_km: number
  total_fretes: number
}

export default function RankingKmPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Define o período padrão como o mês atual
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDataInicio(firstDay.toISOString().split("T")[0])
    setDataFim(lastDay.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (dataInicio && dataFim) {
      fetchRanking()
    }
  }, [dataInicio, dataFim])

  const fetchRanking = async () => {
    setLoading(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/ranking-km?dataInicio=${dataInicio}&dataFim=${dataFim}&_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      setRanking(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar ranking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRanking()
    setRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Ranking atualizado com sucesso",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-yellow-500 text-white"
      case 1:
        return "bg-gray-400 text-white"
      case 2:
        return "bg-amber-600 text-white"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="h-4 w-4" />
    if (position < 3) return <Medal className="h-4 w-4" />
    return null
  }

  const formatarData = (dataString: string) => {
    if (!dataString) return ""
    const [ano, mes, dia] = dataString.split("-")
    return `${dia}/${mes}/${ano}`
  }

  const totalKm = ranking.reduce((acc, item) => acc + Number(item.total_km), 0)
  const totalFretes = ranking.reduce((acc, item) => acc + Number(item.total_fretes), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Ranking de KM Rodados</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle>Filtrar por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <Button onClick={fetchRanking} disabled={loading}>
                {loading ? "Carregando..." : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 em destaque */}
        {ranking.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {ranking.slice(0, 3).map((item, index) => (
              <Card
                key={item.id}
                className={`${
                  index === 0
                    ? "border-yellow-400 border-2 bg-gradient-to-br from-yellow-50 to-yellow-100"
                    : index === 1
                      ? "border-gray-300 border-2 bg-gradient-to-br from-gray-50 to-gray-100"
                      : "border-amber-400 border-2 bg-gradient-to-br from-amber-50 to-amber-100"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${getMedalColor(index)}`}
                      >
                        {index === 0 ? <Trophy className="h-6 w-6" /> : <Medal className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="text-lg font-bold">{item.nome}</div>
                        <div className="text-sm text-gray-500">Placa: {item.placa}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Number(item.total_km).toLocaleString("pt-BR")} km
                      </div>
                      <div className="text-sm text-gray-500">{item.total_fretes} frete(s)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabela completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Ranking Completo
            </CardTitle>
            <CardDescription>
              Período: {formatarData(dataInicio)} a {formatarData(dataFim)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-gray-500">Carregando ranking...</div>
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum frete encontrado no período selecionado.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Posição</TableHead>
                      <TableHead>Cooperado</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead className="text-right">Total KM</TableHead>
                      <TableHead className="text-right">Qtd. Fretes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((item, index) => (
                      <TableRow key={item.id} className={index < 3 ? "bg-yellow-50/50" : ""}>
                        <TableCell>
                          <Badge className={getMedalColor(index)}>
                            <span className="flex items-center gap-1">
                              {getMedalIcon(index)}
                              {index + 1}º
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.placa}</TableCell>
                        <TableCell className="text-right font-bold">
                          {Number(item.total_km).toLocaleString("pt-BR")} km
                        </TableCell>
                        <TableCell className="text-right">{item.total_fretes}</TableCell>
                      </TableRow>
                    ))}
                    {/* Linha de totais */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={3} className="text-right">
                        TOTAL:
                      </TableCell>
                      <TableCell className="text-right">{totalKm.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell className="text-right">{totalFretes}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
