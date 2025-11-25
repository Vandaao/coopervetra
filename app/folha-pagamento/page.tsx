"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Download, DollarSign, RefreshCw, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { PDFGeneratorFolha } from "@/components/pdf-generator-folha"

interface Empresa {
  id: number
  nome: string
}

interface FolhaPagamentoData {
  empresa_nome: string
  data_inicio: string
  data_fim: string
  cooperados: Array<{
    cooperado_id: number
    cooperado_nome: string
    conta_bancaria: string
    valor_bruto: number
    desconto_inss: number
    desconto_administrativo: number
    total_debitos: number
    total_descontos: number
    valor_liquido: number
  }>
  total_geral: number
}

export default function FolhaPagamentoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<FolhaPagamentoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
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
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/relatorios/folha-pagamento?empresa_id=${empresaId}&data_inicio=${dataInicio}&data_fim=${dataFim}&_t=${timestamp}`,
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
        console.log("[v0] Folha de pagamento carregada com sucesso")
        setShowPagamentoDialog(true)
      } else {
        throw new Error(data.error || "Erro ao gerar folha de pagamento")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar folha de pagamento",
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
        `/api/relatorios/folha-pagamento?empresa_id=${empresaId}&data_inicio=${dataInicio}&data_fim=${dataFim}&_t=${timestamp}`,
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
        console.log("[v0] Folha de pagamento atualizada com sucesso")
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

  const handleProcessarPagamentos = async () => {
    if (!relatorio) return

    setProcessandoPagamento(true)
    try {
      const cooperadosIds = relatorio.cooperados.map((c) => c.cooperado_id)

      const response = await fetch("/api/relatorios/folha-pagamento/processar-pagamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          cooperados_ids: cooperadosIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${data.fretes_pagos} fretes e ${data.debitos_pagos} débitos marcados como pagos`,
        })
        setShowPagamentoDialog(false)
      } else {
        throw new Error(data.error || "Erro ao processar pagamentos")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamentos",
        variant: "destructive",
      })
    } finally {
      setProcessandoPagamento(false)
    }
  }

  const handlePularPagamento = () => {
    setShowPagamentoDialog(false)
    toast({
      title: "Folha Gerada",
      description: "Folha de pagamento gerada com sucesso",
    })
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
              <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
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
                <DollarSign className="h-5 w-5 mr-2" />
                Gerar Folha de Pagamento
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
                    {loading ? "Gerando..." : "Gerar Folha"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {relatorio && (
            <div className="space-y-6">
              <div className="flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold">Folha de Pagamento Gerada</h2>
                <div className="flex gap-2">
                  <Button onClick={handleImprimir}>
                    <Download className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <PDFGeneratorFolha relatorio={relatorio} />
                </div>
              </div>

              {/* Versão para tela */}
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="text-center">Folha de Pagamento - {relatorio.empresa_nome}</CardTitle>
                  <p className="text-center text-muted-foreground">
                    Período: {formatarData(relatorio.data_inicio)} a {formatarData(relatorio.data_fim)}
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cooperado</TableHead>
                        <TableHead>Dados Bancários</TableHead>
                        <TableHead>Valor Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.cooperados.map((cooperado) => (
                        <TableRow key={cooperado.cooperado_id}>
                          <TableCell className="font-medium">{cooperado.cooperado_nome}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm whitespace-pre-wrap">{cooperado.conta_bancaria}</div>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            R$ {cooperado.valor_liquido.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold text-lg">
                        <TableCell colSpan={2}>TOTAL GERAL</TableCell>
                        <TableCell className="text-green-600">R$ {relatorio.total_geral.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Versão para impressão */}
              <div id="folha-pagamento-pdf" className="hidden print:block print:text-black">
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
                    <h2 className="text-xl font-bold">FOLHA DE PAGAMENTO</h2>
                    <p className="text-lg font-semibold">{relatorio.empresa_nome}</p>
                    <p className="text-sm">
                      Período: {formatarData(relatorio.data_inicio)} a {formatarData(relatorio.data_fim)}
                    </p>
                  </div>
                </div>

                {/* Tabela de Pagamento */}
                <div className="mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-2 border-black">
                        <th className="border border-black p-3 font-bold text-left">COOPERADO</th>
                        <th className="border border-black p-3 font-bold text-left">DADOS BANCÁRIOS</th>
                        <th className="border border-black p-3 font-bold text-right">VALOR LÍQUIDO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.cooperados.map((cooperado, index) => (
                        <tr key={cooperado.cooperado_id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="border border-black p-3">{cooperado.cooperado_nome}</td>
                          <td className="border border-black p-3 text-sm whitespace-pre-wrap">
                            {cooperado.conta_bancaria}
                          </td>
                          <td className="border border-black p-3 text-right font-bold">
                            R$ {cooperado.valor_liquido.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-200 font-bold text-lg">
                        <td className="border-2 border-black p-3" colSpan={2}>
                          TOTAL GERAL
                        </td>
                        <td className="border-2 border-black p-3 text-right">R$ {relatorio.total_geral.toFixed(2)}</td>
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

        <Dialog open={showPagamentoDialog} onOpenChange={setShowPagamentoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Dar Baixa Automática?
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <div>Folha de pagamento gerada com sucesso!</div>
                <div className="font-semibold">
                  Deseja marcar como pagos todos os fretes e débitos dos cooperados deste relatório no período
                  selecionado?
                </div>
                {relatorio && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                    <div>
                      <strong>Período:</strong> {formatarData(relatorio.data_inicio)} a{" "}
                      {formatarData(relatorio.data_fim)}
                    </div>
                    <div>
                      <strong>Cooperados:</strong> {relatorio.cooperados.length}
                    </div>
                    <div>
                      <strong>Empresa:</strong> {relatorio.empresa_nome}
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handlePularPagamento} disabled={processandoPagamento}>
                Não, apenas gerar folha
              </Button>
              <Button onClick={handleProcessarPagamentos} disabled={processandoPagamento}>
                {processandoPagamento ? "Processando..." : "Sim, dar baixa automática"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
