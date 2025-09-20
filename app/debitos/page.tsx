"use client"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
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
  const [filtroCooperado, setFiltroCooperado] = useState("todos")
  const [filtroEmpresa, setFiltroEmpresa] = useState("todos")
  const [editingDebito, setEditingDebito] = useState<Debito | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDebitos()
    fetchCooperados()
    fetchEmpresas()
  }, [])

  const fetchDebitos = async () => {
    try {
      const response = await fetch("/api/debitos")
      const data = await response.json()
      // Converter valores para números
      const debitosFormatados = data.map((debito: any) => ({
        ...debito,
        valor: Number(debito.valor),
      }))
      setDebitos(debitosFormatados)
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
      const response = await fetch("/api/cooperados")
      const data = await response.json()
      setCooperados(data)
    } catch (error) {
      console.error("Erro ao carregar cooperados:", error)
    }
  }

  const fetchEmpresas = async () => {
    try {
      const response = await fetch("/api/empresas")
      const data = await response.json()
      setEmpresas(data)
    } catch (error) {
      console.error("Erro ao carregar empresas:", error)
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
        headers: { "Content-Type": "application/json" },
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
        fetchDebitos()
      } else {
        throw new Error("Erro ao salvar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar débito",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (debito: Debito) => {
    setEditingDebito(debito)

    // Encontrar os IDs baseados nos nomes
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

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este débito?")) {
      return
    }

    try {
      const response = await fetch(`/api/debitos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Débito excluído com sucesso",
        })
        fetchDebitos()
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir débito",
        variant: "destructive",
      })
    }
  }

  const formatarData = (dataString: string) => {
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    // Caso contrário, tentar converter
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Débitos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Débitos Cadastrados
                  {(filtroCooperado !== "todos" || filtroEmpresa !== "todos") && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({debitosFiltrados.length} de {debitos.length} débitos)
                    </span>
                  )}
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewDebito}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Débito
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingDebito ? "Editar Débito" : "Novo Débito"}</DialogTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroCooperado("todos")
                    setFiltroEmpresa("todos")
                  }}
                  disabled={filtroCooperado === "todos" && filtroEmpresa === "todos"}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cooperado</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debitosFiltrados.map((debito) => (
                      <TableRow key={debito.id}>
                        <TableCell>{debito.cooperado_nome}</TableCell>
                        <TableCell>{debito.empresa_nome}</TableCell>
                        <TableCell>{debito.descricao}</TableCell>
                        <TableCell>{formatarData(debito.data)}</TableCell>
                        <TableCell>R$ {Number(debito.valor).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(debito)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(debito.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
