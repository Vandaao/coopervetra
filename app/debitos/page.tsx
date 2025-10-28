"use client"

export const dynamic = "force-dynamic"
export const revalidate = 0

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Edit, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Cooperado {
  id: number
  nome: string
}

interface Empresa {
  id: number
  nome: string
}

interface Debito {
  id: number
  cooperado_nome: string
  empresa_nome: string
  descricao: string
  data: string
  valor: number
  status: "pendente" | "pago"
  data_baixa: string | null
  observacao_baixa: string | null
}

export default function DebitosPage() {
  const [debitos, setDebitos] = useState<Debito[]>([])
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [cooperadoId, setCooperadoId] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [descricao, setDescricao] = useState("")
  const [data, setData] = useState("")
  const [valor, setValor] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filtroCooperado, setFiltroCooperado] = useState("todos")
  const [filtroEmpresa, setFiltroEmpresa] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [editingDebito, setEditingDebito] = useState<Debito | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPagamentoDialogOpen, setIsPagamentoDialogOpen] = useState(false)
  const [debitoParaPagar, setDebitoParaPagar] = useState<Debito | null>(null)
  const [dataBaixa, setDataBaixa] = useState("")
  const [observacaoBaixa, setObservacaoBaixa] = useState("")
  const [loadingPagamento, setLoadingPagamento] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [isExecutingMigration, setIsExecutingMigration] = useState(false)
  const { toast } = useToast()

  const executeMigration = async () => {
    setIsExecutingMigration(true)
    try {
      const response = await fetch("/api/admin/executar-migracao", {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Migração executada com sucesso:", data)
        setNeedsMigration(false)
        // Recarregar débitos após migração
        await fetchDebitos()
        return true
      } else {
        console.error("Erro ao executar migração:", data)
        throw new Error(data.error || "Erro ao executar migração")
      }
    } catch (error) {
      console.error("Erro na migração:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao executar migração",
        variant: "destructive",
      })
      return false
    } finally {
      setIsExecutingMigration(false)
    }
  }

  const checkMigrationStatus = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/debitos?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()

      // Check if any debito has the status property
      if (data.length > 0) {
        const hasMigration = data[0].hasOwnProperty("status")
        console.log("Status da migração:", hasMigration ? "Completa" : "Necessária")
        setNeedsMigration(!hasMigration)
        return hasMigration
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar status da migração:", error)
      setNeedsMigration(true)
      return false
    }
  }

  useEffect(() => {
    fetchDebitos()
    fetchCooperados()
    fetchEmpresas()
    checkMigrationStatus()
  }, [])

  const fetchDebitos = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/debitos?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      const debitosFormatados = data.map((debito: any) => ({
        ...debito,
        valor: Number(debito.valor),
      }))
      setDebitos(debitosFormatados)
      console.log("Débitos carregados:", debitosFormatados.length)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar débitos",
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
    try {
      await Promise.all([fetchDebitos(), fetchCooperados(), fetchEmpresas(), checkMigrationStatus()])
      toast({
        title: "Atualizado",
        description: "Dados atualizados com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const resetForm = () => {
    setCooperadoId("")
    setEmpresaId("")
    setDescricao("")
    setData("")
    setValor("")
    setEditingDebito(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingDebito ? `/api/debitos/${editingDebito.id}` : "/api/debitos"
      const method = editingDebito ? "PUT" : "POST"

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
          descricao,
          data,
          valor: Number.parseFloat(valor),
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingDebito ? "Débito atualizado com sucesso" : "Débito cadastrado com sucesso",
        })
        resetForm()
        setIsDialogOpen(false)
        // Aguardar um pouco e recarregar
        await new Promise((resolve) => setTimeout(resolve, 300))
        await fetchDebitos()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar débito:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar débito",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoPago = (debito: Debito) => {
    console.log("Abrindo diálogo de pagamento para débito:", debito)
    setDebitoParaPagar(debito)
    setDataBaixa(new Date().toISOString().split("T")[0])
    setObservacaoBaixa("")
    setIsPagamentoDialogOpen(true)
  }

  const handleConfirmarPagamento = async () => {
    if (!debitoParaPagar) {
      console.error("Nenhum débito selecionado para pagamento")
      return
    }

    if (!dataBaixa) {
      toast({
        title: "Erro",
        description: "Por favor, informe a data do pagamento",
        variant: "destructive",
      })
      return
    }

    // Verificar se precisa executar migração
    if (needsMigration) {
      console.log("Migração necessária, executando automaticamente...")
      toast({
        title: "Preparando sistema",
        description: "Atualizando banco de dados, aguarde...",
      })

      const migrationSuccess = await executeMigration()

      if (!migrationSuccess) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o banco de dados. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Atualização concluída",
        description: "Sistema atualizado com sucesso! Processando pagamento...",
      })
    }

    console.log("Confirmando pagamento:", {
      debitoId: debitoParaPagar.id,
      dataBaixa,
      observacaoBaixa,
    })

    setLoadingPagamento(true)
    try {
      const response = await fetch(`/api/debitos/${debitoParaPagar.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          action: "marcar_pago",
          data_baixa: dataBaixa,
          observacao_baixa: observacaoBaixa || null,
        }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Débito marcado como pago",
        })
        setIsPagamentoDialogOpen(false)
        setDebitoParaPagar(null)
        setDataBaixa("")
        setObservacaoBaixa("")
        // Aguardar um pouco e recarregar
        await new Promise((resolve) => setTimeout(resolve, 300))
        await fetchDebitos()
      } else {
        throw new Error(data.error || data.details || "Erro ao marcar como pago")
      }
    } catch (error) {
      console.error("Erro ao marcar débito como pago:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao marcar débito como pago",
        variant: "destructive",
      })
    } finally {
      setLoadingPagamento(false)
    }
  }

  const handleMarcarComoPendente = async (debitoId: number) => {
    if (!confirm("Deseja realmente marcar este débito como pendente novamente?")) {
      return
    }

    try {
      const response = await fetch(`/api/debitos/${debitoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          action: "marcar_pendente",
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Débito marcado como pendente",
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
        await fetchDebitos()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao marcar como pendente")
      }
    } catch (error) {
      console.error("Erro ao marcar débito como pendente:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao marcar débito como pendente",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (debito: Debito) => {
    if (debito.status === "pago") {
      toast({
        title: "Atenção",
        description: "Não é possível editar um débito já pago. Marque como pendente primeiro.",
        variant: "destructive",
      })
      return
    }

    setEditingDebito(debito)

    const cooperado = cooperados.find((c) => c.nome === debito.cooperado_nome)
    const empresa = empresas.find((e) => e.nome === debito.empresa_nome)

    setCooperadoId(cooperado?.id.toString() || "")
    setEmpresaId(empresa?.id.toString() || "")
    setDescricao(debito.descricao)
    setData(debito.data)
    setValor(debito.valor.toString())
    setIsDialogOpen(true)
  }

  const handleNewDebito = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number, status: string) => {
    if (status === "pago") {
      toast({
        title: "Atenção",
        description: "Não é possível excluir um débito já pago. Marque como pendente primeiro.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Tem certeza que deseja excluir este débito?")) {
      return
    }

    try {
      const response = await fetch(`/api/debitos/${id}`, {
        method: "DELETE",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Débito excluído com sucesso",
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
        await fetchDebitos()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir")
      }
    } catch (error) {
      console.error("Erro ao excluir débito:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir débito",
        variant: "destructive",
      })
    }
  }

  const formatarData = (dataString: string | null) => {
    if (!dataString) return "-"
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    if (status === "pago") {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  // Aplicar filtros
  let debitosFiltrados = debitos

  if (filtroCooperado !== "todos") {
    debitosFiltrados = debitosFiltrados.filter((debito) =>
      debito.cooperado_nome.toLowerCase().includes(filtroCooperado.toLowerCase()),
    )
  }

  if (filtroEmpresa !== "todos") {
    debitosFiltrados = debitosFiltrados.filter((debito) =>
      debito.empresa_nome.toLowerCase().includes(filtroEmpresa.toLowerCase()),
    )
  }

  if (filtroStatus !== "todos") {
    debitosFiltrados = debitosFiltrados.filter((debito) => debito.status === filtroStatus)
  }

  // Calcular estatísticas
  const totalPendentes = debitos.filter((d) => d.status === "pendente").length
  const totalPagos = debitos.filter((d) => d.status === "pago").length
  const valorPendente = debitos.filter((d) => d.status === "pendente").reduce((sum, d) => sum + d.valor, 0)
  const valorPago = debitos.filter((d) => d.status === "pago").reduce((sum, d) => sum + d.valor, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gerenciar Débitos</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 print:px-8">
        <div className="space-y-6">
          {needsMigration && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Atualização de banco de dados necessária para habilitar o controle de pagamentos.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    A atualização será executada automaticamente quando você marcar um débito como pago.
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                      onClick={executeMigration}
                      disabled={isExecutingMigration}
                    >
                      {isExecutingMigration ? "Executando..." : "Executar Atualização Agora"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-red-600">{totalPendentes}</p>
                  <p className="text-xs text-muted-foreground mt-1">R$ {valorPendente.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pagos</p>
                  <p className="text-2xl font-bold text-green-600">{totalPagos}</p>
                  <p className="text-xs text-muted-foreground mt-1">R$ {valorPago.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold text-blue-600">{debitos.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">R$ {(valorPendente + valorPago).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Taxa Pagamento</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {debitos.length > 0 ? Math.round((totalPagos / debitos.length) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">de {debitos.length} débitos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Principal de Débitos */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg sm:text-xl">
                  Débitos Cadastrados
                  {(filtroCooperado !== "todos" || filtroEmpresa !== "todos" || filtroStatus !== "todos") && (
                    <span className="text-sm font-normal text-muted-foreground ml-2 block sm:inline">
                      ({debitosFiltrados.length} de {debitos.length} débitos)
                    </span>
                  )}
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewDebito} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Débito
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>{editingDebito ? "Editar Débito" : "Novo Débito"}</DialogTitle>
                      <DialogDescription>
                        {editingDebito
                          ? "Atualize as informações do débito existente"
                          : "Preencha os dados para cadastrar um novo débito"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="cooperado">Cooperado</Label>
                        <Select value={cooperadoId} onValueChange={setCooperadoId} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cooperado" />
                          </SelectTrigger>
                          <SelectContent>
                            {cooperados.map((cooperado) => (
                              <SelectItem key={cooperado.id} value={cooperado.id.toString()}>
                                {cooperado.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="empresa">Empresa</Label>
                        <Select value={empresaId} onValueChange={setEmpresaId} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {empresas.map((empresa) => (
                              <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                {empresa.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="data">Data</Label>
                        <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                      </div>
                      <div>
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
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? "Salvando..." : editingDebito ? "Atualizar" : "Cadastrar"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                  <Label htmlFor="filtroEmpresa">Filtrar por Empresa</Label>
                  <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as empresas</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.nome}>
                          {empresa.nome}
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
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="pago">Pagos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroCooperado("todos")
                      setFiltroEmpresa("todos")
                      setFiltroStatus("todos")
                    }}
                    disabled={filtroCooperado === "todos" && filtroEmpresa === "todos" && filtroStatus === "todos"}
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
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Cooperado</TableHead>
                      <TableHead className="min-w-[120px]">Empresa</TableHead>
                      <TableHead className="min-w-[150px]">Descrição</TableHead>
                      <TableHead className="min-w-[100px]">Data</TableHead>
                      <TableHead className="min-w-[100px]">Valor</TableHead>
                      <TableHead className="min-w-[100px]">Data Baixa</TableHead>
                      <TableHead className="min-w-[180px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debitosFiltrados.map((debito) => (
                      <TableRow key={debito.id}>
                        <TableCell>{getStatusBadge(debito.status)}</TableCell>
                        <TableCell className="font-medium">{debito.cooperado_nome}</TableCell>
                        <TableCell>{debito.empresa_nome}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={debito.descricao}>
                          {debito.descricao}
                        </TableCell>
                        <TableCell>{formatarData(debito.data)}</TableCell>
                        <TableCell>R$ {Number(debito.valor).toFixed(2)}</TableCell>
                        <TableCell>{formatarData(debito.data_baixa)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {debito.status === "pendente" ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleMarcarComoPago(debito)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="Marcar como pago"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(debito)}
                                  title="Editar débito"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(debito.id, debito.status)}
                                  title="Excluir débito"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarcarComoPendente(debito.id)}
                                  title="Marcar como pendente"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                {debito.observacao_baixa && (
                                  <Button variant="ghost" size="sm" title={debito.observacao_baixa} className="text-xs">
                                    Ver obs.
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Dialog de Pagamento */}
          <Dialog open={isPagamentoDialogOpen} onOpenChange={setIsPagamentoDialogOpen}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>Marcar Débito como Pago</DialogTitle>
                <DialogDescription>
                  Registre o pagamento do débito informando a data e observações se necessário
                </DialogDescription>
              </DialogHeader>
              {debitoParaPagar && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <strong>Cooperado:</strong> {debitoParaPagar.cooperado_nome}
                    </p>
                    <p className="text-sm">
                      <strong>Empresa:</strong> {debitoParaPagar.empresa_nome}
                    </p>
                    <p className="text-sm">
                      <strong>Descrição:</strong> {debitoParaPagar.descricao}
                    </p>
                    <p className="text-sm">
                      <strong>Valor:</strong> R$ {debitoParaPagar.valor.toFixed(2)}
                    </p>
                  </div>

                  {needsMigration && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        ℹ️ O sistema será atualizado automaticamente ao confirmar este pagamento.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="dataBaixa">Data do Pagamento *</Label>
                    <Input
                      id="dataBaixa"
                      type="date"
                      value={dataBaixa}
                      onChange={(e) => setDataBaixa(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacaoBaixa">Observações (Opcional)</Label>
                    <Textarea
                      id="observacaoBaixa"
                      value={observacaoBaixa}
                      onChange={(e) => setObservacaoBaixa(e.target.value)}
                      placeholder="Ex: Pago via PIX, Comprovante nº 12345"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleConfirmarPagamento}
                      disabled={loadingPagamento || isExecutingMigration || !dataBaixa}
                      className="flex-1"
                    >
                      {loadingPagamento || isExecutingMigration ? "Processando..." : "Confirmar Pagamento"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsPagamentoDialogOpen(false)
                        setDebitoParaPagar(null)
                        setDataBaixa("")
                        setObservacaoBaixa("")
                      }}
                      disabled={loadingPagamento || isExecutingMigration}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
