"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Building2, RefreshCw, AlertTriangle, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { PDFGeneratorEmpresa } from "@/components/pdf-generator-empresa"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Empresa {
  id: number
  nome: string
}

interface DebitoPendente {
  id: number
  cooperado_id: number
  cooperado_nome: string
  descricao: string
  data: string
  valor: number
  selecionado: boolean
}

interface RelatorioEmpresaData {
  empresa_nome: string
  data_inicio: string
  data_fim: string
  cooperados: Array<{
    cooperado_id: number
    cooperado_nome: string
    total_fretes: number
    total_valor_fretes: number
    total_chapada: number
    total_km: number
    valor_bruto: number
    desconto_inss: number
    desconto_administrativo: number
    total_debitos: number
    total_descontos: number
    valor_liquido: number
    fretes: Array<{
      data: string
      carga: string
      km: number
      valor: number
      chapada: number
    }>
  }>
  totais: {
    total_cooperados: number
    total_fretes: number
    total_km: number
    total_valor_bruto: number
    total_desconto_inss: number
    total_desconto_administrativo: number
    total_debitos: number
    total_descontos: number
    total_valor_liquido: number
  }
}

export default function RelatoriosEmpresaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<RelatorioEmpresaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [debitosPendentes, setDebitosPendentes] = useState<DebitoPendente[]>([])
  const [showDebitosPendentes, setShowDebitosPendentes] = useState(false)
  const [processandoDebitos, setProcessandoDebitos] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    try {
      const response = await fetch("/api/empresas")
      const data = await response.json()
      setEmpresas(data)
    } catch (error) {
      console.error("Erro ao carregar empresas:", error)
    }
  }

  const gerarRelatorioFinal = async () => {
    const timestamp = new Date().getTime()
    const response = await fetch(
      `/api/relatorios/empresa?empresa_id=${empresaId}&data_inicio=${dataInicio}&data_fim=${dataFim}&_t=${timestamp}`,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    )
    const data = await response.json()

    if (response.ok) {
      setRelatorio(data)
      toast({
        title: "Sucesso",
        description: "Relatorio gerado com sucesso",
      })
    } else {
      throw new Error(data.error || "Erro ao gerar relatorio")
    }
  }

  const handleGerarRelatorio = async () => {
    if (!empresaId || !dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Verificar debitos pendentes anteriores ao periodo
      const timestamp = new Date().getTime()
      const resPendentes = await fetch(
        `/api/relatorios/empresa/debitos-pendentes?empresa_id=${empresaId}&data_inicio=${dataInicio}&_t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      )
      const dataPendentes = await resPendentes.json()

      if (resPendentes.ok && dataPendentes.debitos_pendentes && dataPendentes.debitos_pendentes.length > 0) {
        // Ha debitos pendentes fora do periodo - perguntar ao usuario
        setDebitosPendentes(
          dataPendentes.debitos_pendentes.map((d: Omit<DebitoPendente, "selecionado">) => ({
            ...d,
            selecionado: true,
          })),
        )
        setShowDebitosPendentes(true)
        setLoading(false)
        return
      }

      // Sem debitos pendentes - gerar relatorio direto
      await gerarRelatorioFinal()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatorio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDebito = (id: number) => {
    setDebitosPendentes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selecionado: !d.selecionado } : d)),
    )
  }

  const handleToggleTodos = () => {
    const todosSelecionados = debitosPendentes.every((d) => d.selecionado)
    setDebitosPendentes((prev) =>
      prev.map((d) => ({ ...d, selecionado: !todosSelecionados })),
    )
  }

  const handleConfirmarAlteracaoDebitos = async () => {
    const selecionados = debitosPendentes.filter((d) => d.selecionado)

    setProcessandoDebitos(true)
    try {
      if (selecionados.length > 0) {
        // Alterar a data dos debitos selecionados para a data inicio do filtro
        const debitoIds = selecionados.map((d) => d.id)
        const timestamp = new Date().getTime()
        const res = await fetch(`/api/debitos/alterar-data-lote?_t=${timestamp}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({
            debito_ids: debitoIds,
            nova_data: dataInicio,
          }),
        })

        if (!res.ok) {
          throw new Error("Erro ao alterar datas dos debitos")
        }

        toast({
          title: "Debitos atualizados",
          description: `${selecionados.length} debito(s) movido(s) para o periodo do relatorio`,
        })
      }

      setShowDebitosPendentes(false)

      // Agora gerar o relatorio com os debitos incluidos
      setLoading(true)
      await gerarRelatorioFinal()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar debitos pendentes",
        variant: "destructive",
      })
    } finally {
      setProcessandoDebitos(false)
      setLoading(false)
    }
  }

  const handleIgnorarDebitos = async () => {
    setShowDebitosPendentes(false)
    setLoading(true)
    try {
      await gerarRelatorioFinal()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatorio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!empresaId || !dataInicio || !dataFim) return

    setRefreshing(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/relatorios/empresa?empresa_id=${empresaId}&data_inicio=${dataInicio}&data_fim=${dataFim}&_t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      )
      const data = await response.json()

      if (response.ok) {
        setRelatorio(data)
        console.log("[v0] Relatório atualizado com sucesso")
        toast({
          title: "Atualizado",
          description: "Dados atualizados com sucesso",
        })
      }
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

  const handleImprimir = () => {
    window.print()
  }

  const formatarData = (dataString: string) => {
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios por Empresa</h1>
              {relatorio && (
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="ml-auto bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Atualizando..." : "Atualizar"}
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:px-8">
          <Card className="mb-8 print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Gerar Relatório por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={empresaId} onValueChange={setEmpresaId}>
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
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleGerarRelatorio} disabled={loading} className="w-full">
                    {loading ? "Gerando..." : "Gerar Relatório"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog de Debitos Pendentes */}
          <Dialog open={showDebitosPendentes} onOpenChange={setShowDebitosPendentes}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Debitos Pendentes Encontrados
                </DialogTitle>
                <DialogDescription>
                  Foram encontrados debitos pendentes com data anterior ao periodo do relatorio.
                  Deseja alterar a data desses debitos para inclui-los no relatorio?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={debitosPendentes.every((d) => d.selecionado)}
                      onCheckedChange={handleToggleTodos}
                    />
                    <span className="font-medium text-sm">Selecionar / Desmarcar todos</span>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    {debitosPendentes.filter((d) => d.selecionado).length} de {debitosPendentes.length} selecionados
                  </Badge>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Cooperado</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Data Original</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debitosPendentes.map((debito) => (
                        <TableRow
                          key={debito.id}
                          className={debito.selecionado ? "bg-amber-50/50" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={debito.selecionado}
                              onCheckedChange={() => handleToggleDebito(debito.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{debito.cooperado_nome}</TableCell>
                          <TableCell className="text-sm">{debito.descricao}</TableCell>
                          <TableCell className="text-sm">{formatarData(debito.data)}</TableCell>
                          <TableCell className="text-right font-medium text-sm">
                            R$ {debito.valor.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm font-medium">Total dos selecionados:</span>
                  <span className="font-bold text-lg">
                    R$ {debitosPendentes
                      .filter((d) => d.selecionado)
                      .reduce((sum, d) => sum + d.valor, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  Os debitos selecionados terao sua data alterada para{" "}
                  <strong>{dataInicio ? formatarData(dataInicio) : ""}</strong> (inicio do periodo)
                  e serao incluidos no relatorio.
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleIgnorarDebitos}
                  disabled={processandoDebitos}
                >
                  <X className="h-4 w-4 mr-2" />
                  Ignorar e Gerar Sem Eles
                </Button>
                <Button
                  onClick={handleConfirmarAlteracaoDebitos}
                  disabled={processandoDebitos || debitosPendentes.filter((d) => d.selecionado).length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processandoDebitos
                    ? "Processando..."
                    : `Incluir ${debitosPendentes.filter((d) => d.selecionado).length} Debito(s) e Gerar`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {relatorio && (
            <div className="space-y-6">
              <div className="flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold">Relatório Gerado</h2>
                <div className="flex gap-2">
                  <Button onClick={handleImprimir}>
                    <Download className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <PDFGeneratorEmpresa relatorio={relatorio} />
                </div>
              </div>

              {/* Versão para tela */}
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="text-center">Relatório de Fretes - {relatorio.empresa_nome}</CardTitle>
                  <p className="text-center text-muted-foreground">
                    Período: {formatarData(relatorio.data_inicio)} a {formatarData(relatorio.data_fim)}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Resumo Geral */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Cooperados</p>
                      <p className="text-2xl font-bold text-blue-600">{relatorio.totais.total_cooperados}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Fretes</p>
                      <p className="text-2xl font-bold text-green-600">{relatorio.totais.total_fretes}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Valor Bruto</p>
                      <p className="text-2xl font-bold text-purple-600">
                        R$ {relatorio.totais.total_valor_bruto.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Valor Líquido</p>
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {relatorio.totais.total_valor_liquido.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Tabela por Cooperado */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Resumo por Cooperado</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cooperado</TableHead>
                          <TableHead>Fretes</TableHead>
                          <TableHead>KM Total</TableHead>
                          <TableHead>Valor Bruto</TableHead>
                          <TableHead>Desc. INSS</TableHead>
                          <TableHead>Desc. ADM</TableHead>
                          <TableHead>Débitos</TableHead>
                          <TableHead>Valor Líquido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorio.cooperados.map((cooperado) => (
                          <TableRow key={cooperado.cooperado_id}>
                            <TableCell className="font-medium">{cooperado.cooperado_nome}</TableCell>
                            <TableCell>{cooperado.total_fretes}</TableCell>
                            <TableCell>{cooperado.total_km}</TableCell>
                            <TableCell>R$ {cooperado.valor_bruto.toFixed(2)}</TableCell>
                            <TableCell className="text-red-600">R$ {cooperado.desconto_inss.toFixed(2)}</TableCell>
                            <TableCell className="text-red-600">
                              R$ {cooperado.desconto_administrativo.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-red-600">R$ {cooperado.total_debitos.toFixed(2)}</TableCell>
                            <TableCell className="font-bold text-green-600">
                              R$ {cooperado.valor_liquido.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell>TOTAL GERAL</TableCell>
                          <TableCell>{relatorio.totais.total_fretes}</TableCell>
                          <TableCell>{relatorio.totais.total_km}</TableCell>
                          <TableCell>R$ {relatorio.totais.total_valor_bruto.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">
                            R$ {relatorio.totais.total_desconto_inss.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            R$ {relatorio.totais.total_desconto_administrativo.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-red-600">R$ {relatorio.totais.total_debitos.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600">
                            R$ {relatorio.totais.total_valor_liquido.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Versão para impressão */}
              <div id="relatorio-empresa-pdf" className="hidden print:block print:text-black">
                {/* Cabeçalho da Cooperativa */}
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
                    <h2 className="text-xl font-bold">RELATÓRIO DE FRETES POR EMPRESA</h2>
                    <p className="text-lg font-semibold">{relatorio.empresa_nome}</p>
                    <p className="text-sm">
                      Período: {formatarData(relatorio.data_inicio)} a {formatarData(relatorio.data_fim)}
                    </p>
                  </div>
                </div>

                {/* Resumo Geral */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                  <div className="border border-black p-2">
                    <p className="text-xs font-bold">COOPERADOS</p>
                    <p className="text-lg font-bold">{relatorio.totais.total_cooperados}</p>
                  </div>
                  <div className="border border-black p-2">
                    <p className="text-xs font-bold">TOTAL FRETES</p>
                    <p className="text-lg font-bold">{relatorio.totais.total_fretes}</p>
                  </div>
                  <div className="border border-black p-2">
                    <p className="text-xs font-bold">VALOR BRUTO</p>
                    <p className="text-lg font-bold">R$ {relatorio.totais.total_valor_bruto.toFixed(2)}</p>
                  </div>
                  <div className="border border-black p-2">
                    <p className="text-xs font-bold">VALOR LÍQUIDO</p>
                    <p className="text-lg font-bold">R$ {relatorio.totais.total_valor_liquido.toFixed(2)}</p>
                  </div>
                </div>

                {/* Tabela Resumo por Cooperado */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">RESUMO POR COOPERADO</h3>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-2 border-black">
                        <th className="border border-black p-1 font-bold">COOPERADO</th>
                        <th className="border border-black p-1 font-bold">FRETES</th>
                        <th className="border border-black p-1 font-bold">KM</th>
                        <th className="border border-black p-1 font-bold">VLR BRUTO</th>
                        <th className="border border-black p-1 font-bold">INSS 4,5%</th>
                        <th className="border border-black p-1 font-bold">ADM 6%</th>
                        <th className="border border-black p-1 font-bold">DÉBITOS</th>
                        <th className="border border-black p-1 font-bold">VLR LÍQUIDO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.cooperados.map((cooperado) => (
                        <tr key={cooperado.cooperado_id}>
                          <td className="border border-black p-1">{cooperado.cooperado_nome}</td>
                          <td className="border border-black p-1 text-center">{cooperado.total_fretes}</td>
                          <td className="border border-black p-1 text-center">{cooperado.total_km}</td>
                          <td className="border border-black p-1 text-right">R$ {cooperado.valor_bruto.toFixed(2)}</td>
                          <td className="border border-black p-1 text-right">
                            R$ {cooperado.desconto_inss.toFixed(2)}
                          </td>
                          <td className="border border-black p-1 text-right">
                            R$ {cooperado.desconto_administrativo.toFixed(2)}
                          </td>
                          <td className="border border-black p-1 text-right">
                            R$ {cooperado.total_debitos.toFixed(2)}
                          </td>
                          <td className="border border-black p-1 text-right font-bold">
                            R$ {cooperado.valor_liquido.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-200 font-bold">
                        <td className="border-2 border-black p-1">TOTAL GERAL</td>
                        <td className="border-2 border-black p-1 text-center">{relatorio.totais.total_fretes}</td>
                        <td className="border-2 border-black p-1 text-center">{relatorio.totais.total_km}</td>
                        <td className="border-2 border-black p-1 text-right">
                          R$ {relatorio.totais.total_valor_bruto.toFixed(2)}
                        </td>
                        <td className="border-2 border-black p-1 text-right">
                          R$ {relatorio.totais.total_desconto_inss.toFixed(2)}
                        </td>
                        <td className="border-2 border-black p-1 text-right">
                          R$ {relatorio.totais.total_desconto_administrativo.toFixed(2)}
                        </td>
                        <td className="border-2 border-black p-1 text-right">
                          R$ {relatorio.totais.total_debitos.toFixed(2)}
                        </td>
                        <td className="border-2 border-black p-1 text-right">
                          R$ {relatorio.totais.total_valor_liquido.toFixed(2)}
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
                      <p className="text-sm">RESPONSÁVEL DA EMPRESA</p>
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
        </main>
      </div>
    </AuthGuard>
  )
}
