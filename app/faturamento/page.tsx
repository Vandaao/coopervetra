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
import { Plus, Edit, Trash2, Printer, Users, Fuel, ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface AbastecimentoCredito {
  id: number
  data_credito: string
  valor: number
  saldo_disponivel: number
  observacao: string | null
  created_at: string
}

interface AbastecimentoDocumento {
  id: number
  numero_documento: string
  data_documento: string
  valor: number
  valor_abatido: number
  valor_pendente: number
  status: string
  descricao: string | null
  created_at: string
}

interface AbastecimentoAlocacao {
  id: number
  valor: number
  credito_id: number
  credito_data: string
  credito_observacao: string | null
}

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
  observacao: string | null
  data_pagamento: string | null
  status: string
  created_at: string
}

export default function FaturamentoPage() {
  const { toast } = useToast()
  const [creditos, setCreditos] = useState<AbastecimentoCredito[]>([])
  const [documentos, setDocumentos] = useState<AbastecimentoDocumento[]>([])
  const [loadingAbastecimento, setLoadingAbastecimento] = useState(true)
  const [isCreditoDialogOpen, setIsCreditoDialogOpen] = useState(false)
  const [isDocumentoDialogOpen, setIsDocumentoDialogOpen] = useState(false)
  const [documentoExpandidoId, setDocumentoExpandidoId] = useState<number | null>(null)
  const [alocacoesPorDocumento, setAlocacoesPorDocumento] = useState<Record<number, AbastecimentoAlocacao[]>>({})
  const [creditoFormData, setCreditoFormData] = useState({
    data_credito: "",
    valor: "",
    observacao: "",
  })
  const [documentoFormData, setDocumentoFormData] = useState({
    numero_documento: "",
    data_documento: "",
    valor: "",
    descricao: "",
  })

  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [pagamentoId, setPagamentoId] = useState<number | null>(null)
  const [dataPagamento, setDataPagamento] = useState(() => new Date().toISOString().slice(0, 10))
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  const [formData, setFormData] = useState({
    cliente_id: "",
    documento_referencia: "",
    data_emissao: "",
    data_vencimento: "",
    valor: "",
    observacao: "",
    status: "pendente",
    data_pagamento: "",
  })

  const [clientFormData, setClientFormData] = useState({
    nome: "",
    cnpj: "",
  })

  useEffect(() => {
    carregarClientes()
    carregarFaturamentos()
  }, [filtroStatus, filtroDataInicio, filtroDataFim])

  useEffect(() => {
    carregarAbastecimento()
  }, [])

  const carregarAbastecimento = async () => {
    try {
      setLoadingAbastecimento(true)
      const [resCreditos, resDocumentos] = await Promise.all([
        fetch("/api/abastecimento/creditos"),
        fetch("/api/abastecimento/documentos"),
      ])
      if (!resCreditos.ok || !resDocumentos.ok) throw new Error("Erro ao carregar dados de abastecimento")
      const [dataCreditos, dataDocumentos] = await Promise.all([resCreditos.json(), resDocumentos.json()])
      setCreditos(Array.isArray(dataCreditos) ? dataCreditos : [])
      setDocumentos(Array.isArray(dataDocumentos) ? dataDocumentos : [])
    } catch (error) {
      console.error("Erro ao carregar abastecimento:", error)
      setCreditos([])
      setDocumentos([])
    } finally {
      setLoadingAbastecimento(false)
    }
  }

  const handleCreditoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/abastecimento/creditos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creditoFormData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao lançar crédito")
      }
      setIsCreditoDialogOpen(false)
      setCreditoFormData({ data_credito: "", valor: "", observacao: "" })
      await carregarAbastecimento()
      toast({ title: "Crédito lançado", description: "O crédito foi lançado e as pendências foram atualizadas." })
    } catch (error) {
      console.error("Erro ao lançar crédito:", error)
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao lançar crédito",
        variant: "destructive",
      })
    }
  }

  const handleDocumentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/abastecimento/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentoFormData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao lançar documento")
      }
      const documentoCriado = await response.json()
      setIsDocumentoDialogOpen(false)
      setDocumentoFormData({ numero_documento: "", data_documento: "", valor: "", descricao: "" })
      await carregarAbastecimento()
      toast({
        title: "Documento lançado",
        description:
          documentoCriado.status === "pago"
            ? "Documento lançado e totalmente abatido do crédito disponível."
            : `Documento lançado. Restam R$ ${Number(documentoCriado.valor_pendente).toFixed(2)} pendentes por falta de saldo.`,
      })
    } catch (error) {
      console.error("Erro ao lançar documento:", error)
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao lançar documento",
        variant: "destructive",
      })
    }
  }

  const handleExcluirCredito = async (credito: AbastecimentoCredito) => {
    const confirmou = window.confirm(
      `Excluir o crédito de R$ ${Number(credito.valor || 0).toFixed(2)}? Se ele já foi utilizado, todos os documentos e lançamentos vinculados também serão excluídos. Essa ação não pode ser desfeita.`,
    )
    if (!confirmou) return

    try {
      const response = await fetch(`/api/abastecimento/creditos/${credito.id}`, { method: "DELETE" })
      const resultado = await response.json()
      if (!response.ok) throw new Error(resultado.error || "Erro ao excluir crédito")

      setDocumentoExpandidoId(null)
      setAlocacoesPorDocumento({})
      await carregarAbastecimento()
      toast({
        title: "Crédito excluído",
        description: `${resultado.documentos_excluidos || 0} documento(s) relacionado(s) também foram excluídos.`,
      })
    } catch (error) {
      console.error("Erro ao excluir crédito:", error)
      toast({
        title: "Erro ao excluir crédito",
        description: (error as Error).message || "Não foi possível excluir o crédito.",
        variant: "destructive",
      })
    }
  }

  const handleToggleAlocacoes = async (documentoId: number) => {
    if (documentoExpandidoId === documentoId) {
      setDocumentoExpandidoId(null)
      return
    }
    setDocumentoExpandidoId(documentoId)
    if (!alocacoesPorDocumento[documentoId]) {
      try {
        const response = await fetch(`/api/abastecimento/documentos/${documentoId}/alocacoes`)
        if (!response.ok) throw new Error("Erro ao buscar alocações")
        const data = await response.json()
        setAlocacoesPorDocumento((prev) => ({ ...prev, [documentoId]: Array.isArray(data) ? data : [] }))
      } catch (error) {
        console.error("Erro ao buscar alocações:", error)
        setAlocacoesPorDocumento((prev) => ({ ...prev, [documentoId]: [] }))
      }
    }
  }

  const formatarDataAbastecimento = (dataString: string | null) => {
    if (!dataString) return "-"
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString).toLocaleDateString("pt-BR")
  }

  const saldoDisponivelTotal = creditos.reduce((sum, c) => sum + Number(c.saldo_disponivel || 0), 0)
  const totalCreditado = creditos.reduce((sum, c) => sum + Number(c.valor || 0), 0)
  const totalPendenteAbastecimento = documentos.reduce((sum, d) => sum + Number(d.valor_pendente || 0), 0)
  const totalPagoAbastecimento = documentos.reduce((sum, d) => sum + Number(d.valor_abatido || 0), 0)

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
        observacao: "",
        status: "pendente",
        data_pagamento: "",
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

  const handleMarcarComoPago = async (faturamento: Faturamento) => {
    const data = dataPagamento || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast({ title: "Data inválida", description: "Informe uma data de pagamento válida.", variant: "destructive" })
      return
    }

    try {
      const response = await fetch(`/api/faturamento/${faturamento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pago", data_pagamento: data }),
      })
      const resultado = await response.json()
      if (!response.ok) throw new Error(resultado.error || "Erro ao marcar como pago")

      setPagamentoId(null)
      await carregarFaturamentos()
      toast({ title: "Faturamento marcado como pago", description: `Pagamento registrado em ${data.split("-").reverse().join("/")}.` })
    } catch (error) {
      toast({ title: "Erro ao marcar como pago", description: (error as Error).message, variant: "destructive" })
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

  const formatarDataRelatorio = (valor: string | null | undefined) => {
    if (!valor) return "-"
    const texto = String(valor)
    const somenteData = texto.match(/^(\\d{4})-(\\d{2})-(\\d{2})/)
    if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`

    const data = new Date(texto)
    return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-BR")
  }

  const escaparHtml = (valor: unknown) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")

  const handleExportarXLS = () => {
    const cabecalho = ["Cliente", "Documento", "Data Emissão", "Data Vencimento", "Data Pagamento", "Valor", "Observação", "Status"]
    const linhas = faturamentos.map((fat) => [
      fat.cliente,
      fat.documento_referencia || "",
      formatarDataRelatorio(fat.data_emissao),
      formatarDataRelatorio(fat.data_vencimento),
      formatarDataRelatorio(fat.data_pagamento),
      `R$ ${Number(fat.valor || 0).toFixed(2).replace(".", ",")}`,
      fat.observacao || "",
      fat.status === "pago" ? "Pago" : fat.status === "pendente" ? "Pendente" : "Cancelado",
    ])

    const tabela = [cabecalho, ...linhas]
      .map((linha, indice) => `<tr>${linha.map((celula) => `<${indice === 0 ? "th" : "td"}>${escaparHtml(celula)}</${indice === 0 ? "th" : "td"}>`).join("")}</tr>`)
      .join("")
    const conteudo = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1">${tabela}</table></body></html>`
    const blob = new Blob(["\\ufeff", conteudo], { type: "application/vnd.ms-excel;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `faturamentos-${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleImprimirRelatorio = () => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">COOPERVETRA</h1>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Relatório de Faturamento</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
            ${filtroDataInicio && filtroDataFim
              ? `Período: ${formatarDataRelatorio(filtroDataInicio)} a ${formatarDataRelatorio(filtroDataFim)}`
              : filtroDataInicio
                ? `A partir de: ${formatarDataRelatorio(filtroDataInicio)}`
                : filtroDataFim
                  ? `Até: ${formatarDataRelatorio(filtroDataFim)}`
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
  <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Data Pagamento</th>
  <th style="border: 1px solid #ccc; padding: 10px; text-align: right; font-weight: bold;">Valor</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold;">Status</th>
            </tr>
            ${faturamentos
              .map(
                (fat) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="border: 1px solid #ccc; padding: 8px;">${fat.cliente}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${fat.documento_referencia || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${formatarDataRelatorio(fat.data_emissao)}</td>
  <td style="border: 1px solid #ccc; padding: 8px;">${formatarDataRelatorio(fat.data_vencimento)}</td>
  <td style="border: 1px solid #ccc; padding: 8px;">${formatarDataRelatorio(fat.data_pagamento)}</td>
  <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">R$ ${Number(fat.valor || 0).toFixed(2)}</td>
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
              <p style="font-size: 14px; font-weight: bold;">R$ ${faturamentos.reduce((sum, f) => sum + Number(f.valor || 0), 0).toFixed(2)}</p>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Pendente:</p>
              <p style="font-size: 14px; font-weight: bold; color: #f59e0b;">R$ ${faturamentos
                .filter((f) => f.status === "pendente")
                .reduce((sum, f) => sum + Number(f.valor || 0), 0)
                .toFixed(2)}</p>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Recebido:</p>
              <p style="font-size: 14px; font-weight: bold; color: #10b981;">R$ ${faturamentos
                .filter((f) => f.status === "pago")
                .reduce((sum, f) => sum + Number(f.valor || 0), 0)
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

  const totalFaturado = faturamentos.reduce((sum, f) => sum + Number(f.valor || 0), 0)
  const totalPendente = faturamentos
    .filter((f) => f.status === "pendente")
    .reduce((sum, f) => sum + Number(f.valor || 0), 0)
  const totalPago = faturamentos
    .filter((f) => f.status === "pago")
    .reduce((sum, f) => sum + Number(f.valor || 0), 0)

  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-gray-600 mt-1">Gerenciar boletos e lançamentos</p>
          </div>
  <div className="flex gap-2 flex-wrap">
  <Button variant="outline" onClick={handleExportarXLS}>
  <FileSpreadsheet className="w-4 h-4 mr-2" />
  Exportar XLS
  </Button>
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
                      observacao: "",
                      status: "pendente",
                      data_pagamento: "",
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
                  <div>
                    <Label htmlFor="observacao">Observação</Label>
                    <Textarea
                      id="observacao"
                      value={formData.observacao}
                      onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                      placeholder="Digite observações sobre o faturamento..."
                      className="h-24"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Atualizar" : "Criar"} Faturamento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-gray-700" />
              <div>
                <h2 className="text-xl font-bold">Controle de Abastecimento — Posto Modelo</h2>
                <p className="text-sm text-gray-600">Créditos/adiantamentos e documentos abatidos automaticamente</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={isCreditoDialogOpen} onOpenChange={setIsCreditoDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setCreditoFormData({ data_credito: "", valor: "", observacao: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Crédito
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lançar Novo Crédito</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreditoSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="credito-data">Data do Crédito</Label>
                      <Input
                        id="credito-data"
                        type="date"
                        value={creditoFormData.data_credito}
                        onChange={(e) =>
                          setCreditoFormData({ ...creditoFormData, data_credito: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="credito-valor">Valor (R$)</Label>
                      <Input
                        id="credito-valor"
                        type="number"
                        step="0.01"
                        value={creditoFormData.valor}
                        onChange={(e) => setCreditoFormData({ ...creditoFormData, valor: e.target.value })}
                        placeholder="50000.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="credito-observacao">Observação</Label>
                      <Textarea
                        id="credito-observacao"
                        value={creditoFormData.observacao}
                        onChange={(e) =>
                          setCreditoFormData({ ...creditoFormData, observacao: e.target.value })
                        }
                        placeholder="Ex: Recarga de adiantamento"
                        className="h-20"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Ao salvar, documentos pendentes mais antigos serão abatidos automaticamente deste crédito.
                    </p>
                    <Button type="submit" className="w-full">
                      Lançar Crédito
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isDocumentoDialogOpen} onOpenChange={setIsDocumentoDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() =>
                      setDocumentoFormData({ numero_documento: "", data_documento: "", valor: "", descricao: "" })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Lançar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lançar Documento de Abastecimento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDocumentoSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="documento-numero">Número do Documento</Label>
                      <Input
                        id="documento-numero"
                        value={documentoFormData.numero_documento}
                        onChange={(e) =>
                          setDocumentoFormData({ ...documentoFormData, numero_documento: e.target.value })
                        }
                        placeholder="NF 12345"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="documento-data">Data do Documento</Label>
                      <Input
                        id="documento-data"
                        type="date"
                        value={documentoFormData.data_documento}
                        onChange={(e) =>
                          setDocumentoFormData({ ...documentoFormData, data_documento: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="documento-valor">Valor (R$)</Label>
                      <Input
                        id="documento-valor"
                        type="number"
                        step="0.01"
                        value={documentoFormData.valor}
                        onChange={(e) => setDocumentoFormData({ ...documentoFormData, valor: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="documento-descricao">Descrição</Label>
                      <Textarea
                        id="documento-descricao"
                        value={documentoFormData.descricao}
                        onChange={(e) =>
                          setDocumentoFormData({ ...documentoFormData, descricao: e.target.value })
                        }
                        placeholder="Detalhes do abastecimento..."
                        className="h-20"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Se o crédito disponível não cobrir o valor, o documento será lançado com status "Pendente" pelo
                      restante.
                    </p>
                    <Button type="submit" className="w-full">
                      Lançar Documento
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Saldo Disponível</p>
              <p className="text-2xl font-bold text-blue-600 break-words">R$ {saldoDisponivelTotal.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Total Creditado</p>
              <p className="text-2xl font-bold break-words">R$ {totalCreditado.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Pendente</p>
              <p className="text-2xl font-bold text-amber-600 break-words">
                R$ {totalPendenteAbastecimento.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Abatido</p>
              <p className="text-2xl font-bold text-green-600 break-words">
                R$ {totalPagoAbastecimento.toFixed(2)}
              </p>
            </div>
          </div>

          {loadingAbastecimento ? (
            <p className="text-center text-gray-500 py-4">Carregando...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Créditos Lançados</h3>
                {creditos.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Nenhum crédito lançado ainda</p>
                ) : (
                  <div className="overflow-x-auto w-full border rounded-lg">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditos.map((credito) => (
                          <TableRow key={credito.id}>
                            <TableCell>{formatarDataAbastecimento(credito.data_credito)}</TableCell>
                            <TableCell className="text-right">R$ {Number(credito.valor || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">R$ {Number(credito.saldo_disponivel || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  credito.saldo_disponivel > 0
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {credito.saldo_disponivel > 0 ? "Ativo" : "Esgotado"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir crédito e lançamentos vinculados"
                                onClick={() => handleExcluirCredito(credito)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Excluir crédito e lançamentos vinculados</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Documentos de Abastecimento</h3>
                {documentos.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Nenhum documento lançado ainda</p>
                ) : (
                  <div className="overflow-x-auto w-full border rounded-lg">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Pendente</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Alocações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentos.map((documento) => (
                          <>
                            <TableRow key={documento.id}>
                              <TableCell>{documento.numero_documento}</TableCell>
                              <TableCell>{formatarDataAbastecimento(documento.data_documento)}</TableCell>
                              <TableCell className="text-right">R$ {Number(documento.valor || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">R$ {Number(documento.valor_pendente || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    documento.status === "pago"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {documento.status === "pago" ? "Pago" : "Pendente"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleAlocacoes(documento.id)}
                                >
                                  {documentoExpandidoId === documento.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {documentoExpandidoId === documento.id && (
                              <TableRow key={`${documento.id}-alocacoes`}>
                                <TableCell colSpan={6} className="bg-gray-50">
                                  {!alocacoesPorDocumento[documento.id] ? (
                                    <p className="text-xs text-gray-500 py-1">Carregando alocações...</p>
                                  ) : alocacoesPorDocumento[documento.id].length === 0 ? (
                                    <p className="text-xs text-gray-500 py-1">
                                      Nenhuma alocação de crédito ainda para este documento.
                                    </p>
                                  ) : (
                                    <div className="space-y-1 py-1">
                                      <p className="text-xs font-medium text-gray-600">
                                        Créditos usados para abater este documento:
                                      </p>
                                      {alocacoesPorDocumento[documento.id].map((alocacao) => (
                                        <p key={alocacao.id} className="text-xs text-gray-700">
                                          Crédito de {formatarDataAbastecimento(alocacao.credito_data)}: R${" "}
                                          {alocacao.valor.toFixed(2)}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Faturado</p>
            <p className="text-2xl font-bold break-words">R$ {totalFaturado.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pendente</p>
            <p className="text-2xl font-bold text-amber-600 break-words">R$ {totalPendente.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Recebido</p>
            <p className="text-2xl font-bold text-green-600 break-words">R$ {totalPago.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
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

          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : faturamentos.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum faturamento encontrado</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
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
                      <TableCell>{fat.data_pagamento ? new Date(fat.data_pagamento).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-right">R$ {Number(fat.valor || 0).toFixed(2)}</TableCell>
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
                        <div className="flex flex-wrap gap-2 justify-center">
                          {fat.status === "pendente" && (
                            <>
                              {pagamentoId === fat.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    aria-label={`Data de pagamento de ${fat.cliente}`}
                                    type="date"
                                    value={dataPagamento}
                                    onChange={(e) => setDataPagamento(e.target.value)}
                                    className="w-36"
                                  />
                                  <Button size="sm" onClick={() => handleMarcarComoPago(fat)}>
                                    Confirmar
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setPagamentoId(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setDataPagamento(new Date().toISOString().slice(0, 10))
                                    setPagamentoId(fat.id)
                                  }}
                                >
                                  Marcar como pago
                                </Button>
                              )}
                            </>
                          )}
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
                                observacao: fat.observacao || "",
                                status: fat.status,
                                data_pagamento: fat.data_pagamento || "",
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
  
  )
}
