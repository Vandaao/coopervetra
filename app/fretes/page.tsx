"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Edit, CheckCircle, RefreshCw, AlertCircle, Trophy, Medal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Cooperado {
  id: number
  nome: string
}

interface Empresa {
  id: number
  nome: string
}

interface Frete {
  id: number
  cooperado_nome: string
  empresa_nome: string
  carga: string
  km: number
  valor: number
  chapada: number
  data: string
  status?: string
  data_pagamento?: string
}

interface RankingItem {
  id: number
  nome: string
  placa: string
  total_km: number
  total_fretes: number
}

export default function FretesPage() {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [cooperadoId, setCooperadoId] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [carga, setCarga] = useState("")
  const [km, setKm] = useState("")
  const [valor, setValor] = useState("")
  const [chapada, setChapada] = useState("0.00")
  const [data, setData] = useState("")
  const [loading, setLoading] = useState(false)
  const [filtroCooperado, setFiltroCooperado] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [editingFrete, setEditingFrete] = useState<Frete | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPagamentoDialogOpen, setIsPagamentoDialogOpen] = useState(false)
  const [freteParaPagar, setFreteParaPagar] = useState<Frete | null>(null)
  const [dataPagamento, setDataPagamento] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [fretesSelecionados, setFretesSelecionados] = useState<number[]>([])
  const [isPagamentoLoteDialogOpen, setIsPagamentoLoteDialogOpen] = useState(false)
  const [dataPagamentoLote, setDataPagamentoLote] = useState("")

  const [rankingMensal, setRankingMensal] = useState<RankingItem[]>([])
  const [dataInicioRanking, setDataInicioRanking] = useState("")
  const [dataFimRanking, setDataFimRanking] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    checkMigration()
    fetchFretes()
    fetchCooperados()
    fetchEmpresas()

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDataInicioRanking(firstDay.toISOString().split("T")[0])
    setDataFimRanking(lastDay.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (dataInicioRanking && dataFimRanking) {
      fetchRanking()
    }
  }, [dataInicioRanking, dataFimRanking])

  const fetchRanking = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/ranking-km?dataInicio=${dataInicioRanking}&dataFim=${dataFimRanking}&_t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      )
      const data = await response.json()
      setRankingMensal(data.slice(0, 10)) // Top 10
    } catch (error) {
      console.error("Erro ao carregar ranking:", error)
    }
  }

  const checkMigration = async () => {
    try {
      const response = await fetch("/api/fretes/check-migration")
      const data = await response.json()
      setNeedsMigration(data.needsMigration)
    } catch (error) {
      console.error("Erro ao verificar migração:", error)
    }
  }

  const executeMigration = async () => {
    setMigrating(true)
    try {
      toast({
        title: "Executando migração",
        description: "Atualizando estrutura do banco de dados...",
      })

      const response = await fetch("/api/fretes/migrate", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Migração executada com sucesso!",
        })
        setNeedsMigration(false)
        setTimeout(() => fetchFretes(), 300)
      } else {
        throw new Error("Erro ao executar migração")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar migração",
        variant: "destructive",
      })
    } finally {
      setMigrating(false)
    }
  }

  const fetchFretes = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/fretes?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      console.log("[v0] Fretes carregados:", data.length)
      const fretesFormatados = data.map((frete: any) => ({
        ...frete,
        valor: Number(frete.valor),
        chapada: Number(frete.chapada),
        km: Number(frete.km),
      }))
      setFretes(fretesFormatados)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fretes",
        variant: "destructive",
      })
    }
  }

  const fetchCooperados = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/cooperados?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      setCooperados(data)
    } catch (error) {
      console.error("Erro ao carregar cooperados:", error)
    }
  }

  const fetchEmpresas = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/empresas?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      setEmpresas(data)
    } catch (error) {
      console.error("Erro ao carregar empresas:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFretes()
    await fetchCooperados()
    await fetchEmpresas()
    // Atualiza o ranking também no refresh
    await fetchRanking()
    setRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    })
  }

  const resetForm = () => {
    setCooperadoId("")
    setEmpresaId("")
    setCarga("")
    setKm("")
    setValor("")
    setChapada("0.00")
    setData("")
    setEditingFrete(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingFrete ? `/api/fretes/${editingFrete.id}` : "/api/fretes"
      const method = editingFrete ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          cooperado_id: Number.parseInt(cooperadoId),
          empresa_id: Number.parseInt(empresaId),
          carga,
          km: Number.parseInt(km),
          valor: Number.parseFloat(valor),
          chapada: Number.parseFloat(chapada),
          data,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingFrete ? "Frete atualizado com sucesso" : "Frete cadastrado com sucesso",
        })
        resetForm()
        setIsDialogOpen(false)
        setTimeout(() => {
          fetchFretes()
          // Atualiza o ranking após salvar frete
          fetchRanking()
        }, 300)
      } else {
        throw new Error("Erro ao salvar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar frete",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (frete: Frete) => {
    setEditingFrete(frete)

    const cooperado = cooperados.find((c) => c.nome === frete.cooperado_nome)
    const empresa = empresas.find((e) => e.nome === frete.empresa_nome)

    setCooperadoId(cooperado?.id.toString() || "")
    setEmpresaId(empresa?.id.toString() || "")
    setCarga(frete.carga)
    setKm(frete.km.toString())
    setValor(frete.valor.toString())
    setChapada(frete.chapada.toString())
    setData(frete.data)
    setIsDialogOpen(true)
  }

  const handleNewFrete = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este frete?")) {
      return
    }

    try {
      const response = await fetch(`/api/fretes/${id}`, {
        method: "DELETE",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Frete excluído com sucesso",
        })
        setTimeout(() => {
          fetchFretes()
          // Atualiza o ranking após excluir frete
          fetchRanking()
        }, 300)
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir frete",
        variant: "destructive",
      })
    }
  }

  const handleMarcarPago = async (frete: Frete) => {
    if (needsMigration) {
      toast({
        title: "Migração necessária",
        description: "Executando migração do banco de dados...",
      })

      setMigrating(true)
      try {
        const response = await fetch("/api/fretes/migrate", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Erro ao executar migração")
        }

        toast({
          title: "Sucesso",
          description: "Migração executada com sucesso!",
        })
        setNeedsMigration(false)
        await fetchFretes()
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao executar migração",
          variant: "destructive",
        })
        setMigrating(false)
        return
      } finally {
        setMigrating(false)
      }
    }

    setFreteParaPagar(frete)
    setDataPagamento(new Date().toISOString().split("T")[0])
    setIsPagamentoDialogOpen(true)
  }

  const handleConfirmarPagamento = async () => {
    if (!freteParaPagar || !dataPagamento) {
      toast({
        title: "Erro",
        description: "Data de pagamento é obrigatória",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/fretes/${freteParaPagar.id}/pagar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          data_pagamento: dataPagamento,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Frete marcado como pago",
        })
        setIsPagamentoDialogOpen(false)
        setFreteParaPagar(null)
        setDataPagamento("")
        setTimeout(() => fetchFretes(), 300)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao marcar como pago")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar frete como pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelecionarTodos = (checked: boolean) => {
    if (checked) {
      const fretesPendentes = fretesFiltrados.filter((f) => !f.status || f.status === "pendente").map((f) => f.id)
      setFretesSelecionados(fretesPendentes)
    } else {
      setFretesSelecionados([])
    }
  }

  const handleSelecionarFrete = (freteId: number, checked: boolean) => {
    if (checked) {
      setFretesSelecionados([...fretesSelecionados, freteId])
    } else {
      setFretesSelecionados(fretesSelecionados.filter((id) => id !== freteId))
    }
  }

  const handlePagamentoLote = () => {
    setDataPagamentoLote(new Date().toISOString().split("T")[0])
    setIsPagamentoLoteDialogOpen(true)
  }

  const handleConfirmarPagamentoLote = async () => {
    if (!dataPagamentoLote) {
      toast({
        title: "Erro",
        description: "Data de pagamento é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (fretesSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um frete",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/fretes/pagar-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          frete_ids: fretesSelecionados,
          data_pagamento: dataPagamentoLote,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Sucesso",
          description: `${result.count} frete(s) marcado(s) como pago(s)`,
        })
        setIsPagamentoLoteDialogOpen(false)
        setFretesSelecionados([])
        setDataPagamentoLote("")
        setTimeout(() => fetchFretes(), 300)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao marcar como pago")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar fretes como pagos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataString: string) => {
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const fretesFiltrados = fretes.filter((frete) => {
    const matchCooperado =
      filtroCooperado === "todos" || frete.cooperado_nome.toLowerCase().includes(filtroCooperado.toLowerCase())

    const matchStatus = filtroStatus === "todos" || (frete.status || "pendente") === filtroStatus

    return matchCooperado && matchStatus
  })

  const fretesPendentesFiltrados = fretesFiltrados.filter((f) => !f.status || f.status === "pendente")
  const todosSelecionados =
    fretesPendentesFiltrados.length > 0 && fretesPendentesFiltrados.every((f) => fretesSelecionados.includes(f.id))

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gerenciar Fretes</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {needsMigration && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-800">
                O banco de dados precisa ser atualizado para suportar o controle de pagamentos.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={executeMigration}
                disabled={migrating}
                className="ml-4 border-yellow-600 text-yellow-700 hover:bg-yellow-100 bg-transparent"
              >
                {migrating ? "Executando..." : "Executar Migração"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center text-xl">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                Ranking de KM Rodados
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dataInicioRanking}
                  onChange={(e) => setDataInicioRanking(e.target.value)}
                  className="w-[140px] bg-white"
                />
                <span className="text-sm">até</span>
                <Input
                  type="date"
                  value={dataFimRanking}
                  onChange={(e) => setDataFimRanking(e.target.value)}
                  className="w-[140px] bg-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rankingMensal.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Nenhum frete registrado no período selecionado.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Pos.</TableHead>
                      <TableHead>Cooperado</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead className="text-right">Total KM</TableHead>
                      <TableHead className="text-right">Fretes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingMensal.map((item, index) => (
                      <TableRow key={item.id} className={index < 3 ? "bg-yellow-50/50" : ""}>
                        <TableCell>
                          <Badge className={getMedalColor(index)}>
                            <span className="flex items-center gap-1">
                              {index === 0 ? (
                                <Trophy className="h-3 w-3" />
                              ) : index < 3 ? (
                                <Medal className="h-3 w-3" />
                              ) : null}
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
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Fim Seção de Ranking */}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg sm:text-xl">
                Fretes Cadastrados
                {(filtroCooperado !== "todos" || filtroStatus !== "todos") && (
                  <span className="text-sm font-normal text-muted-foreground ml-2 block sm:inline">
                    ({fretesFiltrados.length} de {fretes.length} fretes)
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                {fretesSelecionados.length > 0 && (
                  <Button onClick={handlePagamentoLote} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pagar Selecionados ({fretesSelecionados.length})
                  </Button>
                )}
                <Button onClick={handleNewFrete} className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Frete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="filtroCooperado">Filtrar por Cooperado</Label>
                <Select value={filtroCooperado} onValueChange={setFiltroCooperado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os cooperados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cooperados</SelectItem>
                    {cooperados.map((cooperado) => (
                      <SelectItem key={cooperado.id} value={cooperado.nome}>
                        {cooperado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filtroStatus">Filtrar por Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroCooperado("todos")
                    setFiltroStatus("todos")
                  }}
                  disabled={filtroCooperado === "todos" && filtroStatus === "todos"}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={todosSelecionados}
                        onCheckedChange={handleSelecionarTodos}
                        disabled={fretesPendentesFiltrados.length === 0}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="min-w-[120px]">Cooperado</TableHead>
                    <TableHead className="min-w-[120px]">Empresa</TableHead>
                    <TableHead className="min-w-[100px]">Carga</TableHead>
                    <TableHead className="text-right">KM</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Chapada</TableHead>
                    <TableHead className="text-right">Valor Final</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fretesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Nenhum frete encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    fretesFiltrados.map((frete) => {
                      const isPago = frete.status === "pago"
                      const isPendente = !frete.status || frete.status === "pendente"

                      return (
                        <TableRow key={frete.id}>
                          <TableCell>
                            {isPendente && (
                              <Checkbox
                                checked={fretesSelecionados.includes(frete.id)}
                                onCheckedChange={(checked) => handleSelecionarFrete(frete.id, checked as boolean)}
                                aria-label={`Selecionar frete ${frete.id}`}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{frete.cooperado_nome}</TableCell>
                          <TableCell>{frete.empresa_nome}</TableCell>
                          <TableCell>{frete.carga}</TableCell>
                          <TableCell className="text-right">{frete.km}</TableCell>
                          <TableCell className="text-right">
                            {frete.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {frete.chapada.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(frete.valor + frete.chapada).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>{formatarData(frete.data)}</TableCell>
                          <TableCell>
                            <Badge variant={isPago ? "default" : "secondary"}>{isPago ? "Pago" : "Pendente"}</Badge>
                            {isPago && frete.data_pagamento && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatarData(frete.data_pagamento)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isPendente && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarcarPago(frete)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleEdit(frete)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(frete.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Novo/Editar Frete */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingFrete ? "Editar Frete" : "Novo Frete"}</DialogTitle>
              <DialogDescription>
                {editingFrete ? "Edite os dados do frete" : "Preencha os dados do novo frete"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooperado">Cooperado</Label>
                  <Select value={cooperadoId} onValueChange={setCooperadoId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperados.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={empresaId} onValueChange={setEmpresaId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carga">Carga</Label>
                <Input id="carga" value={carga} onChange={(e) => setCarga(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="km">KM</Label>
                  <Input id="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapada">Chapada (R$)</Label>
                  <Input
                    id="chapada"
                    type="number"
                    step="0.01"
                    value={chapada}
                    onChange={(e) => setChapada(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Pagamento Individual */}
        <Dialog open={isPagamentoDialogOpen} onOpenChange={setIsPagamentoDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Marcar Frete como Pago</DialogTitle>
              <DialogDescription>
                Confirme a data de pagamento para o frete de {freteParaPagar?.cooperado_nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPagamentoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarPagamento}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Pagamento em Lote */}
        <Dialog open={isPagamentoLoteDialogOpen} onOpenChange={setIsPagamentoLoteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Pagamento em Lote</DialogTitle>
              <DialogDescription>Marcar {fretesSelecionados.length} frete(s) como pago(s)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-[200px] overflow-y-auto border rounded p-2">
                {fretes
                  .filter((f) => fretesSelecionados.includes(f.id))
                  .map((frete) => (
                    <div key={frete.id} className="flex justify-between py-1 border-b last:border-0">
                      <span>{frete.cooperado_nome}</span>
                      <span className="font-medium">
                        {(frete.valor + frete.chapada).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>
                  {fretes
                    .filter((f) => fretesSelecionados.includes(f.id))
                    .reduce((acc, f) => acc + f.valor + f.chapada, 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPagamentoLote">Data de Pagamento</Label>
                <Input
                  id="dataPagamentoLote"
                  type="date"
                  value={dataPagamentoLote}
                  onChange={(e) => setDataPagamentoLote(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPagamentoLoteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarPagamentoLote}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
