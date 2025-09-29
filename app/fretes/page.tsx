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

interface Frete {
  id: number
  cooperado_nome: string
  empresa_nome: string
  carga: string
  km: number
  valor: number
  chapada: number
  data: string
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
  const [editingFrete, setEditingFrete] = useState<Frete | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFretes()
    fetchCooperados()
    fetchEmpresas()
  }, [])

  const fetchFretes = async () => {
    try {
      const response = await fetch("/api/fretes")
      const data = await response.json()
      // Converter valores para números
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
        headers: { "Content-Type": "application/json" },
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
        fetchFretes()
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

    // Encontrar os IDs baseados nos nomes
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
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Frete excluído com sucesso",
        })
        fetchFretes()
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

  const formatarData = (dataString: string) => {
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    // Caso contrário, tentar converter
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const fretesFiltrados =
    filtroCooperado === "todos"
      ? fretes
      : fretes.filter((frete) => frete.cooperado_nome.toLowerCase().includes(filtroCooperado.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gerenciar Fretes</h1>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg sm:text-xl">
                Fretes Cadastrados
                {filtroCooperado !== "todos" && (
                  <span className="text-sm font-normal text-muted-foreground ml-2 block sm:inline">
                    ({fretesFiltrados.length} de {fretes.length} fretes)
                  </span>
                )}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewFrete} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Frete
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle>{editingFrete ? "Editar Frete" : "Novo Frete"}</DialogTitle>
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
                      <Label htmlFor="carga">Carga</Label>
                      <Input id="carga" value={carga} onChange={(e) => setCarga(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="km">KM</Label>
                      <Input id="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} required />
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
                    <div>
                      <Label htmlFor="chapada">Chapada (R$)</Label>
                      <Input
                        id="chapada"
                        type="number"
                        step="0.01"
                        value={chapada}
                        onChange={(e) => setChapada(e.target.value)}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data">Data</Label>
                      <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? "Salvando..." : editingFrete ? "Atualizar" : "Cadastrar"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-1">
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
              <div className="sm:col-span-1 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={() => setFiltroCooperado("todos")}
                  disabled={filtroCooperado === "todos"}
                  className="w-full"
                >
                  Limpar Filtro
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Cooperado</TableHead>
                    <TableHead className="min-w-[120px]">Empresa</TableHead>
                    <TableHead className="min-w-[100px]">Carga</TableHead>
                    <TableHead className="min-w-[80px]">KM</TableHead>
                    <TableHead className="min-w-[100px]">Valor</TableHead>
                    <TableHead className="min-w-[100px]">Chapada</TableHead>
                    <TableHead className="min-w-[100px]">Data</TableHead>
                    <TableHead className="min-w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fretesFiltrados.map((frete) => (
                    <TableRow key={frete.id}>
                      <TableCell className="font-medium">{frete.cooperado_nome}</TableCell>
                      <TableCell>{frete.empresa_nome}</TableCell>
                      <TableCell>{frete.carga}</TableCell>
                      <TableCell>{frete.km}</TableCell>
                      <TableCell>R$ {Number(frete.valor).toFixed(2)}</TableCell>
                      <TableCell>R$ {Number(frete.chapada).toFixed(2)}</TableCell>
                      <TableCell>{formatarData(frete.data)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(frete)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(frete.id)}>
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
      </main>
    </div>
  )
}
