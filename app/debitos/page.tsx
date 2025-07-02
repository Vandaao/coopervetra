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
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Cooperado {
  id: number
  nome: string
}

interface Debito {
  id: number
  cooperado_nome: string
  descricao: string
  data: string
  valor: number
}

export default function DebitosPage() {
  const [debitos, setDebitos] = useState<Debito[]>([])
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [cooperadoId, setCooperadoId] = useState("")
  const [descricao, setDescricao] = useState("")
  const [data, setData] = useState("")
  const [valor, setValor] = useState("")
  const [loading, setLoading] = useState(false)
  const [filtroCooperado, setFiltroCooperado] = useState("todos")
  const { toast } = useToast()

  useEffect(() => {
    fetchDebitos()
    fetchCooperados()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/debitos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cooperado_id: Number.parseInt(cooperadoId),
          descricao,
          data,
          valor: Number.parseFloat(valor),
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Débito cadastrado com sucesso",
        })
        setCooperadoId("")
        setDescricao("")
        setData("")
        setValor("")
        fetchDebitos()
      } else {
        throw new Error("Erro ao cadastrar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar débito",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
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

  const debitosFiltrados =
    filtroCooperado === "todos"
      ? debitos
      : debitos.filter((debito) => debito.cooperado_nome.toLowerCase().includes(filtroCooperado.toLowerCase()))

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
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Débito
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
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
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Cadastrando..." : "Cadastrar Débito"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>
                Débitos Cadastrados
                {filtroCooperado !== "todos" && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({debitosFiltrados.length} de {debitos.length} débitos)
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
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
                <Button
                  variant="outline"
                  onClick={() => setFiltroCooperado("todos")}
                  disabled={filtroCooperado === "todos"}
                >
                  Limpar Filtro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cooperado</TableHead>
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
                        <TableCell>{debito.descricao}</TableCell>
                        <TableCell>{formatarData(debito.data)}</TableCell>
                        <TableCell>R$ {Number(debito.valor).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(debito.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
