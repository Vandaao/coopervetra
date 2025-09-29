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
import { ArrowLeft, Plus, Trash2, Edit, FileText, Download } from "lucide-react"
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
  const [dataRelatorioInicio, setDataRelatorioInicio] = useState("")
  const [dataRelatorioFim, setDataRelatorioFim] = useState("")
  const [relatorioDebitos, setRelatorioDebitos] = useState<any>(null)
  const [loadingRelatorio, setLoadingRelatorio] = useState(false)
  const [showRelatorio, setShowRelatorio] = useState(false)
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

  const handleGerarRelatorioDebitos = async () => {
    if (!dataRelatorioInicio || !dataRelatorioFim) {
      toast({
        title: "Erro",
        description: "Preencha as datas para gerar o relatório",
        variant: "destructive",
      })
      return
    }

    setLoadingRelatorio(true)
    try {
      const response = await fetch(
        `/api/relatorios/debitos?data_inicio=${dataRelatorioInicio}&data_fim=${dataRelatorioFim}`,
      )
      const data = await response.json()

      if (response.ok) {
        setRelatorioDebitos(data)
        setShowRelatorio(true)
        toast({
          title: "Sucesso",
          description: "Relatório de débitos gerado com sucesso",
        })
      } else {
        throw new Error(data.error || "Erro ao gerar relatório")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de débitos",
        variant: "destructive",
      })
    } finally {
      setLoadingRelatorio(false)
    }
  }

  const handleImprimirRelatorio = () => {
    window.print()
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

          {/* Seção de Relatório */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Relatório de Débitos por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="dataRelatorioInicio">Data Início</Label>
                  <Input
                    id="dataRelatorioInicio"
                    type="date"
                    value={dataRelatorioInicio}
                    onChange={(e) => setDataRelatorioInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dataRelatorioFim">Data Fim</Label>
                  <Input
                    id="dataRelatorioFim"
                    type="date"
                    value={dataRelatorioFim}
                    onChange={(e) => setDataRelatorioFim(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleGerarRelatorioDebitos} disabled={loadingRelatorio} className="w-full">
                    {loadingRelatorio ? "Gerando..." : "Gerar Relatório"}
                  </Button>
                </div>
                {relatorioDebitos && (
                  <div className="flex items-end">
                    <Button
                      onClick={handleImprimirRelatorio}
                      variant="outline"
                      className="w-full print:hidden bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                )}
              </div>

              {showRelatorio && relatorioDebitos && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4 print:hidden">
                    <h3 className="text-lg font-semibold">Relatório Gerado</h3>
                    <Button variant="outline" onClick={() => setShowRelatorio(false)} size="sm">
                      Fechar Relatório
                    </Button>
                  </div>

                  {/* Versão para tela */}
                  <div className="print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total de Débitos</p>
                        <p className="text-2xl font-bold text-red-600">{relatorioDebitos.total_debitos}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Cooperados</p>
                        <p className="text-2xl font-bold text-orange-600">{relatorioDebitos.total_cooperados}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Empresas</p>
                        <p className="text-2xl font-bold text-purple-600">{relatorioDebitos.total_empresas}</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold text-gray-600">R$ {relatorioDebitos.valor_total.toFixed(2)}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Cooperado</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioDebitos.debitos.map((debito: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{formatarData(debito.data)}</TableCell>
                            <TableCell>{debito.cooperado_nome}</TableCell>
                            <TableCell>{debito.empresa_nome}</TableCell>
                            <TableCell>{debito.descricao}</TableCell>
                            <TableCell>R$ {Number(debito.valor).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Versão para impressão */}
                  <div className="hidden print:block print:text-black">
                    <div className="text-center mb-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h1 className="text-lg font-bold mb-2">
                            COOPERATIVA DE TRANSPORTADORES AUTÔNOMOS DE RIO POMBA E REGIÃO
                          </h1>
                          <div className="text-sm space-y-1">
                            <p>CNPJ: 05.332.862/0001-35</p>
                            <p>AVENIDA DOUTOR JOSÉ NEVES, 415</p>
                            <p>RIO POMBA - MG 36180-000</p>
                          </div>
                        </div>
                        <div className="w-32 h-20 flex-shrink-0">
                          <img
                            src="/logo-coopervetra.jpg"
                            alt="Logo COOPERVETRA"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="border-t-2 border-b-2 border-black py-2 my-4">
                        <h2 className="text-xl font-bold">RELATÓRIO DE DÉBITOS</h2>
                        <p className="text-sm">
                          Período: {formatarData(dataRelatorioInicio)} a {formatarData(dataRelatorioFim)}
                        </p>
                      </div>
                    </div>

                    {/* Resumo */}
                    <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                      <div className="border border-black p-2">
                        <p className="text-xs font-bold">TOTAL DÉBITOS</p>
                        <p className="text-lg font-bold">{relatorioDebitos.total_debitos}</p>
                      </div>
                      <div className="border border-black p-2">
                        <p className="text-xs font-bold">COOPERADOS</p>
                        <p className="text-lg font-bold">{relatorioDebitos.total_cooperados}</p>
                      </div>
                      <div className="border border-black p-2">
                        <p className="text-xs font-bold">EMPRESAS</p>
                        <p className="text-lg font-bold">{relatorioDebitos.total_empresas}</p>
                      </div>
                      <div className="border border-black p-2">
                        <p className="text-xs font-bold">VALOR TOTAL</p>
                        <p className="text-lg font-bold">R$ {relatorioDebitos.valor_total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Tabela de Débitos */}
                    <div className="mb-6">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-2 border-black">
                            <th className="border border-black p-1 font-bold">DATA</th>
                            <th className="border border-black p-1 font-bold">COOPERADO</th>
                            <th className="border border-black p-1 font-bold">EMPRESA</th>
                            <th className="border border-black p-1 font-bold">DESCRIÇÃO</th>
                            <th className="border border-black p-1 font-bold">VALOR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioDebitos.debitos.map((debito: any, index: number) => (
                            <tr key={index}>
                              <td className="border border-black p-1">{formatarData(debito.data)}</td>
                              <td className="border border-black p-1">{debito.cooperado_nome}</td>
                              <td className="border border-black p-1">{debito.empresa_nome}</td>
                              <td className="border border-black p-1">{debito.descricao}</td>
                              <td className="border border-black p-1 text-right">
                                R$ {Number(debito.valor).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-200 font-bold">
                            <td className="border-2 border-black p-1" colSpan={4}>
                              TOTAL GERAL
                            </td>
                            <td className="border-2 border-black p-1 text-right">
                              R$ {relatorioDebitos.valor_total.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Assinaturas */}
                    <div className="mt-12 pt-6">
                      <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                          <div className="border-t border-black mb-2"></div>
                          <p className="text-sm">RESPONSÁVEL FINANCEIRO</p>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-black mb-2"></div>
                          <p className="text-sm">FILIPE BENTO COSTA (PRESIDENTE)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
