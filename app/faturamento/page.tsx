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
import { Plus, Edit, Trash2 } from "lucide-react"
import LayoutShell from "@/components/layout-shell"

interface Faturamento {
  id: number
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
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  const [formData, setFormData] = useState({
    cliente: "",
    documento_referencia: "",
    data_emissao: "",
    data_vencimento: "",
    valor: "",
    status: "pendente",
  })

  useEffect(() => {
    carregarFaturamentos()
  }, [filtroStatus, filtroDataInicio, filtroDataFim])

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
          body: JSON.stringify({
            ...formData,
            valor: parseFloat(formData.valor),
          }),
        })

        if (!response.ok) throw new Error("Erro ao atualizar")
      } else {
        const response = await fetch("/api/faturamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            valor: parseFloat(formData.valor),
          }),
        })

        if (!response.ok) throw new Error("Erro ao criar")
      }

      setIsDialogOpen(false)
      setFormData({
        cliente: "",
        documento_referencia: "",
        data_emissao: "",
        data_vencimento: "",
        valor: "",
        status: "pendente",
      })
      setEditingId(null)
      carregarFaturamentos()
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  const handleEdit = (faturamento: Faturamento) => {
    setFormData({
      cliente: faturamento.cliente,
      documento_referencia: faturamento.documento_referencia || "",
      data_emissao: faturamento.data_emissao,
      data_vencimento: faturamento.data_vencimento,
      valor: faturamento.valor.toString(),
      status: faturamento.status,
    })
    setEditingId(faturamento.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este faturamento?")) return

    try {
      const response = await fetch(`/api/faturamento/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar")
      carregarFaturamentos()
    } catch (error) {
      console.error("Erro ao deletar:", error)
    }
  }

  const formatarData = (data: string) => {
    if (!data) return "-"
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    cliente: "",
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
                <DialogTitle>
                  {editingId ? "Editar Faturamento" : "Novo Faturamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) =>
                      setFormData({ ...formData, cliente: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="documento">Documento de Referência</Label>
                  <Input
                    id="documento"
                    value={formData.documento_referencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documento_referencia: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_emissao">Data Emissão *</Label>
                    <Input
                      id="data_emissao"
                      type="date"
                      value={formData.data_emissao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_emissao: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_vencimento">Data Vencimento *</Label>
                    <Input
                      id="data_vencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_vencimento: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) =>
                        setFormData({ ...formData, valor: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
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
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="font-semibold">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filtro-status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger id="filtro-status">
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

            <div>
              <Label htmlFor="filtro-data-inicio">Data Início</Label>
              <Input
                id="filtro-data-inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>

            <div>
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

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total Faturado</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatarMoeda(totalFaturado)}
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatarMoeda(totalPendente)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Recebido</p>
            <p className="text-2xl font-bold text-green-600">
              {formatarMoeda(totalPago)}
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando...</div>
          ) : faturamentos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhum faturamento encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento Ref.</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturamentos.map((fat) => (
                  <TableRow key={fat.id}>
                    <TableCell className="font-medium">{fat.cliente}</TableCell>
                    <TableCell>{fat.documento_referencia || "-"}</TableCell>
                    <TableCell>{formatarData(fat.data_emissao)}</TableCell>
                    <TableCell>{formatarData(fat.data_vencimento)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatarMoeda(fat.valor)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          fat.status === "pago"
                            ? "bg-green-100 text-green-800"
                            : fat.status === "pendente"
                              ? "bg-yellow-100 text-yellow-800"
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
                    <TableCell className="text-right space-x-2">
                      <button
                        onClick={() => handleEdit(fat)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fat.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </LayoutShell>
  )
}
