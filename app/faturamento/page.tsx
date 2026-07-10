"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Printer, Users } from "lucide-react"
import LayoutShell from "@/components/layout-shell"

interface Cliente {
  id: number
  nome: string
  cnpj: string
  created_at: string
}

interface Faturamento {
  id: number
  cliente_id: number
  cliente: string
  documento_referencia: string | null
  data_emissao: string
  data_vencimento: string
  valor: number
  status: string
  created_at: string
}

export default function FaturamentoPage() {
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  const [formData, setFormData] = useState({
    cliente_id: "",
    documento_referencia: "",
    data_emissao: "",
    data_vencimento: "",
    valor: "",
    status: "pendente",
  })

  const [clientFormData, setClientFormData] = useState({
    nome: "",
    cnpj: "",
  })

  useEffect(() => {
    carregarClientes()
    carregarFaturamentos()
  }, [filtroStatus, filtroDataInicio, filtroDataFim])

  const carregarClientes = async () => {
    try {
      const response = await fetch("/api/clientes")
      if (!response.ok) throw new Error("Erro ao carregar clientes")
      const data = await response.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClientes([])
    }
  }

  const carregarFaturamentos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filtroStatus !== "todos") {
        params.append("status", filtroStatus)
      }
      if (filtroDataInicio) {
        params.append("dataInicio", filtroDataInicio)
      }
      if (filtroDataFim) {
        params.append("dataFim", filtroDataFim)
      }

      const response = await fetch(`/api/faturamento?${params}`)
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }
      const data = await response.json()
      setFaturamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar faturamentos:", error)
      setFaturamentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const response = await fetch(`/api/faturamento/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error("Erro ao atualizar")
      } else {
        const response = await fetch("/api/faturamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error("Erro ao criar")
      }

      setIsDialogOpen(false)
      setFormData({
        cliente_id: "",
        documento_referencia: "",
        data_emissao: "",
        data_vencimento: "",
        valor: "",
        status: "pendente",
      })
      carregarFaturamentos()
    } catch (error) {
      console.error("Erro ao salvar faturamento:", error)
      alert("Erro ao salvar faturamento")
    }
  }

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingClientId) {
        const response = await fetch(`/api/clientes/${editingClientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFormData),
        })
        if (!response.ok) throw new Error("Erro ao atualizar cliente")
      } else {
        const response = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFormData),
        })
        if (!response.ok) throw new Error("Erro ao criar cliente")
      }

      setIsClientDialogOpen(false)
      setClientFormData({ nome: "", cnpj: "" })
      carregarClientes()
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      alert("Erro ao salvar cliente")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar?")) return

    try {
      const response = await fetch(`/api/faturamento/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erro ao deletar")
      carregarFaturamentos()
    } catch (error) {
      console.error("Erro ao deletar:", error)
      alert("Erro ao deletar faturamento")
    }
  }

  const handleDeleteClient = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return

    try {
      const response = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar")
      }
      carregarClientes()
    } catch (error) {
      console.error("Erro ao deletar cliente:", error)
      alert((error as Error).message)
    }
  }

  const handleImprimirRelatorio = () => {
    const formatarData = (dataString: string | null) => {
      if (!dataString) return "-"
      if (dataString.includes("-") && dataString.length === 10) {
        const [ano, mes, dia] = dataString.split("-")
        return `${dia}/${mes}/${ano}`
      }
      return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">COOPERVETRA</h1>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Relatório de Faturamento</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
            ${filtroDataInicio && filtroDataFim
              ? `Período: ${formatarData(filtroDataInicio)} a ${formatarData(filtroDataFim)}`
              : filtroDataInicio
                ? `A partir de: ${formatarData(filtroDataInicio)}`
                : filtroDataFim
                  ? `Até: ${formatarData(filtroDataFim)}`
                  : "Todos os períodos"}
          </p>
          ${filtroStatus !== "todos" ? `<p style="font-size: 12px; color: #666;">Status: ${filtroStatus === "pago" ? "Pagos" : filtroStatus === "pendente" ? "Pendentes" : "Cancelados"}</p>` : ""}
          <p style="font-size: 11px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f0f0f0; border-bottom: 2px solid black;">
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Cliente</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Documento Ref.</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Data Emissão</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Data Vencimento</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: right; font-weight: bold;">Valor</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold;">Status</th>
            </tr>
            ${faturamentos
              .map(
                (fat) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="border: 1px solid #ccc; padding: 8px;">${fat.cliente}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${fat.documento_referencia || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${formatarData(fat.data_emissao)}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${formatarData(fat.data_vencimento)}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">R$ ${fat.valor.toFixed(2)}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center; ${fat.status === "pago" ? "color: green;" : fat.status === "pendente" ? "color: orange;" : "color: red;"}">${fat.status === "pago" ? "Pago" : fat.status === "pendente" ? "Pendente" : "Cancelado"}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <div style="border-top: 2px solid black; padding-top: 20px;">
          <div style="display: flex; justify-content: flex-end; gap: 40px;">
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Total Faturado:</p>
              <p style="font-size: 14px; font-weight: bold;">R$ ${faturamentos.reduce((sum, f) => sum + f.valor, 0).toFixed(2)}</p>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Pendente:</p>
              <p style="font-size: 14px; font-weight: bold; color: #f59e0b;">R$ ${faturamentos
                .filter((f) => f.status === "pendente")
                .reduce((sum, f) => sum + f.valor, 0)
                .toFixed(2)}</p>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Recebido:</p>
              <p style="font-size: 14px; font-weight: bold; color: #10b981;">R$ ${faturamentos
                .filter((f) => f.status === "pago")
                .reduce((sum, f) => sum + f.valor, 0)
                .toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    `

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }

    doc.open()
    doc.write(`
      <html>
        <head>
          <title>Relatório de Faturamento</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    doc.close()

    const acionarImpressao = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }

    setTimeout(acionarImpressao, 300)
  }

  const totalFaturado = faturamentos.reduce((sum, f) => sum + f.valor, 0)
  const totalPendente = faturamentos
    .filter((f) => f.status === "pendente")
    .reduce((sum, f) => sum + f.valor, 0)
  const totalPago = faturamentos
    .filter((f) => f.status === "pago")
    .reduce((sum, f) => sum + f.valor, 0)

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-gray-600 mt-1">Gerenciar boletos e lançamentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImprimirRelatorio}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </Button>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Clientes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clientes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {clientes.map((cliente) => (
                    <div key={cliente.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-sm text-gray-500">{cliente.cnpj}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingClientId(cliente.id)
                            setClientFormData({ nome: cliente.nome, cnpj: cliente.cnpj })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClient(cliente.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleClientSubmit} className="space-y-4 mt-4 border-t pt-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={clientFormData.nome}
                      onChange={(e) => setClientFormData({ ...clientFormData, nome: e.target.value })}
                      placeholder="Nome do Cliente"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={clientFormData.cnpj}
                      onChange={(e) => setClientFormData({ ...clientFormData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingClientId ? "Atualizar Cliente" : "Adicionar Cliente"}
                  </Button>
                  {editingClientId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setEditingClientId(null)
                        setClientFormData({ nome: "", cnpj: "" })
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({
                      cliente_id: "",
                      documento_referencia: "",
                      data_emissao: "",
                      data_vencimento: "",
                      valor: "",
                      status: "pendente",
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Faturamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Novo"} Faturamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select
                      value={formData.cliente_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cliente_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documento">Documento de Referência</Label>
                    <Input
                      id="documento"
                      value={formData.documento_referencia}
                      onChange={(e) =>
                        setFormData({ ...formData, documento_referencia: e.target.value })
                      }
                      placeholder="NF, REC, etc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data-emissao">Data de Emissão</Label>
                    <Input
                      id="data-emissao"
                      type="date"
                      value={formData.data_emissao}
                      onChange={(e) =>
                        setFormData({ ...formData, data_emissao: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                    <Input
                      id="data-vencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) =>
                        setFormData({ ...formData, data_vencimento: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Atualizar" : "Criar"} Faturamento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Faturado</p>
            <p className="text-2xl font-bold">R$ {totalFaturado.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pendente</p>
            <p className="text-2xl font-bold text-amber-600">R$ {totalPendente.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Recebido</p>
            <p className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="space-y-4 mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="filtro-status">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="filtro-data-inicio">Data Início</Label>
                <Input
                  id="filtro-data-inicio"
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="filtro-data-fim">Data Fim</Label>
                <Input
                  id="filtro-data-fim"
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : faturamentos.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum faturamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturamentos.map((fat) => (
                    <TableRow key={fat.id}>
                      <TableCell>{fat.cliente}</TableCell>
                      <TableCell>{fat.documento_referencia || "-"}</TableCell>
                      <TableCell>{new Date(fat.data_emissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{new Date(fat.data_vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">R$ {fat.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            fat.status === "pago"
                              ? "bg-green-100 text-green-800"
                              : fat.status === "pendente"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {fat.status === "pago"
                            ? "Pago"
                            : fat.status === "pendente"
                              ? "Pendente"
                              : "Cancelado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(fat.id)
                              setFormData({
                                cliente_id: fat.cliente_id.toString(),
                                documento_referencia: fat.documento_referencia || "",
                                data_emissao: fat.data_emissao,
                                data_vencimento: fat.data_vencimento,
                                valor: fat.valor.toString(),
                                status: fat.status,
                              })
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(fat.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  )
}
