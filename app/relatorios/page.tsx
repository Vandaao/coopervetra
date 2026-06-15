"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PDFGenerator } from "@/components/pdf-generator"

interface Cooperado {
  id: number
  nome: string
}

interface Empresa {
  id: number
  nome: string
}

interface RelatorioData {
  cooperado_nome: string
  empresa_nome?: string
  total_fretes: number
  total_valor: number
  total_chapada: number
  valor_bruto: number
  desconto_inss: number
  desconto_administrativo: number
  total_debitos: number
  total_descontos: number
  valor_liquido: number
  total_km: number
  fretes: Array<{
    data: string
    carga: string
    empresa_nome: string
    km: number
    valor: number
    chapada: number
  }>
  debitos: Array<{
    data: string
    descricao: string
    valor: number
  }>
}

export default function RelatoriosPage() {
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [cooperadoId, setCooperadoId] = useState("")
  const [empresaId, setEmpresaId] = useState("todas")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCooperados()
    fetchEmpresas()
  }, [])

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

  const handleGerarRelatorio = async () => {
    if (!cooperadoId || !dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Preencha cooperado e datas",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let url = `/api/relatorios?cooperado_id=${cooperadoId}&data_inicio=${dataInicio}&data_fim=${dataFim}`

      if (empresaId !== "todas") {
        url += `&empresa_id=${empresaId}`
      }

      const timestamp = new Date().getTime()
      url += `&_t=${timestamp}`

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()

      if (response.ok) {
        setRelatorio(data)
        console.log("[v0] Relatório carregado com sucesso")
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso",
        })
      } else {
        throw new Error(data.error || "Erro ao gerar relatório")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!cooperadoId || !dataInicio || !dataFim) return

    setRefreshing(true)
    try {
      let url = `/api/relatorios?cooperado_id=${cooperadoId}&data_inicio=${dataInicio}&data_fim=${dataFim}`

      if (empresaId !== "todas") {
        url += `&empresa_id=${empresaId}`
      }

      const timestamp = new Date().getTime()
      url += `&_t=${timestamp}`

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
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
    if (!relatorio) return

    const linhasFretes = relatorio.fretes
      .map(
        (frete) => `
          <tr style="border-bottom: 1px solid #ccc;">
            <td style="padding: 6px 4px;">${formatarData(frete.data)}</td>
            <td style="padding: 6px 4px;">${frete.carga}</td>
            <td style="padding: 6px 4px;">${frete.km}</td>
            <td style="padding: 6px 4px;">R$ ${frete.valor.toFixed(2)}</td>
            <td style="padding: 6px 4px;">R$ ${frete.chapada.toFixed(2)}</td>
            <td style="padding: 6px 4px;">${frete.empresa_nome}</td>
          </tr>
        `,
      )
      .join("")

    const linhasVaziasFretes = Array.from({ length: Math.max(0, 6 - relatorio.fretes.length) })
      .map(
        () => `
          <tr style="border-bottom: 1px solid #ccc;">
            <td style="padding: 6px 4px;">&nbsp;</td>
            <td style="padding: 6px 4px;">&nbsp;</td>
            <td style="padding: 6px 4px;">&nbsp;</td>
            <td style="padding: 6px 4px;">&nbsp;</td>
            <td style="padding: 6px 4px;">&nbsp;</td>
            <td style="padding: 6px 4px;">&nbsp;</td>
          </tr>
        `,
      )
      .join("")

    const secaoDebitos =
      relatorio.debitos.length > 0
        ? `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">DÉBITOS NO PERÍODO</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid black;">
                  <th style="text-align: left; padding: 6px 4px; font-weight: bold;">Data</th>
                  <th style="text-align: left; padding: 6px 4px; font-weight: bold;">DESCRIÇÃO</th>
                  <th style="text-align: left; padding: 6px 4px; font-weight: bold;">VALOR</th>
                </tr>
              </thead>
              <tbody>
                ${relatorio.debitos
                  .map(
                    (debito) => `
                      <tr style="border-bottom: 1px solid #ccc;">
                        <td style="padding: 6px 4px;">${formatarData(debito.data)}</td>
                        <td style="padding: 6px 4px;">${debito.descricao}</td>
                        <td style="padding: 6px 4px;">R$ ${debito.valor.toFixed(2)}</td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        : ""

    const linhaDebitos =
      relatorio.total_debitos > 0
        ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">DÉBITOS:</span>
            <span style="font-weight: bold; color: #dc2626;">R$ ${relatorio.total_debitos.toFixed(2)}</span>
          </div>
        `
        : ""

    const html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div style="flex: 1; padding-right: 16px; text-align: left;">
            <h1 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; line-height: 1.2;">
              COOPERATIVA DE TRANSPORTADORES AUTÔNOMOS DE RIO POMBA E REGIÃO
            </h1>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 2px 0;">CNPJ: 05.332.862/0001-35</p>
              <p style="margin: 2px 0;">AVENIDA DOUTOR JOSÉ NEVES, 415</p>
              <p style="margin: 2px 0;">RIO POMBA - MG 36180-000</p>
            </div>
          </div>
          <img src="/logo-coopervetra.jpg" alt="Logo COOPERVETRA" style="width: 120px; height: auto; object-fit: contain;" />
        </div>
        <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 8px 0; margin: 16px 0;">
          <h2 style="font-size: 18px; font-weight: bold; margin: 0;">RELATÓRIO DE FRETES SEMANAIS</h2>
          ${relatorio.empresa_nome ? `<p style="font-size: 14px; font-weight: 600; margin: 4px 0 0;">Empresa: ${relatorio.empresa_nome}</p>` : ""}
          <p style="font-size: 12px; margin: 4px 0 0;">Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}</p>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <p style="font-size: 16px; font-weight: bold;">NOME: ${relatorio.cooperado_nome}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid black;">
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">Data</th>
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">CARGA</th>
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">KM</th>
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">VALOR</th>
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">CHAPADA</th>
              <th style="text-align: left; padding: 6px 4px; font-weight: bold;">EMPRESA</th>
            </tr>
          </thead>
          <tbody>
            ${linhasFretes}
            ${linhasVaziasFretes}
          </tbody>
        </table>
      </div>

      ${secaoDebitos}

      <div style="border-top: 1px dashed black; margin-bottom: 16px;"></div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; gap: 32px;">
        <div>
          <p style="font-weight: bold;">TOTAL DE KM NO PERÍODO: ${relatorio.total_km}</p>
        </div>
        <div style="min-width: 280px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">VALOR TOTAL FRETES:</span>
            <span style="font-weight: bold;">R$ ${relatorio.valor_bruto.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">DESCONTO ADM 6%:</span>
            <span style="font-weight: bold; color: #dc2626;">R$ ${relatorio.desconto_administrativo.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">DESCONTO INSS 4,5%:</span>
            <span style="font-weight: bold; color: #dc2626;">R$ ${relatorio.desconto_inss.toFixed(2)}</span>
          </div>
          ${linhaDebitos}
        </div>
      </div>

      <div style="border-top: 1px dashed black; margin-bottom: 16px;"></div>

      <div style="text-align: right; margin-bottom: 40px;">
        <p style="font-size: 20px; font-weight: bold;">TOTAL GERAL: R$ ${relatorio.valor_liquido.toFixed(2)}</p>
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: space-between; gap: 64px;">
        <div style="text-align: center; flex: 1;">
          <div style="border-top: 1px solid black; margin-bottom: 8px;"></div>
          <p style="font-size: 12px;">${relatorio.cooperado_nome}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="border-top: 1px solid black; margin-bottom: 8px;"></div>
          <p style="font-size: 12px;">FILIPE BENTO COSTA (PRESIDENTE)</p>
        </div>
      </div>
    `

    // Usa um iframe oculto para imprimir apenas o conteúdo do relatório.
    // Diferente de window.print(), não imprime a página inteira da aplicação.
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
          <title>Relatório de Fretes - ${relatorio.cooperado_nome}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: black; }
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

    const logo = doc.querySelector("img")
    if (logo && !logo.complete) {
      logo.onload = acionarImpressao
      logo.onerror = acionarImpressao
      setTimeout(acionarImpressao, 1500)
    } else {
      setTimeout(acionarImpressao, 300)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Relatórios de Fretes</h1>
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

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 print:max-w-none print:px-8">
        <Card className="mb-8 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="h-5 w-5 mr-2" />
              Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="cooperado">Cooperado</Label>
                <Select value={cooperadoId} onValueChange={setCooperadoId}>
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
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as empresas</SelectItem>
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
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGerarRelatorio} disabled={loading} className="w-full">
                  {loading ? "Gerando..." : "Gerar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {relatorio && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
              <h2 className="text-lg sm:text-xl font-bold">Relatório Gerado</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleImprimir} className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <PDFGenerator relatorio={relatorio} dataInicio={dataInicio} dataFim={dataFim} />
              </div>
            </div>

            {/* Versão para tela */}
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle className="text-center">Relatório de Fretes - {relatorio.cooperado_nome}</CardTitle>
                <p className="text-center text-muted-foreground">
                  {relatorio.empresa_nome && (
                    <span className="font-semibold">Empresa: {relatorio.empresa_nome} | </span>
                  )}
                  Período: {formatarData(dataInicio)} a {formatarData(dataFim)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total de Fretes</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{relatorio.total_fretes}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Valor Bruto</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      R$ {relatorio.valor_bruto.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg col-span-2 sm:col-span-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Valor Líquido</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">
                      R$ {relatorio.valor_liquido.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Data</TableHead>
                        <TableHead className="min-w-[120px]">Empresa</TableHead>
                        <TableHead className="min-w-[100px]">Carga</TableHead>
                        <TableHead className="min-w-[80px]">KM</TableHead>
                        <TableHead className="min-w-[100px]">Valor</TableHead>
                        <TableHead className="min-w-[100px]">Chapada</TableHead>
                        <TableHead className="min-w-[100px]">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.fretes.map((frete, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatarData(frete.data)}</TableCell>
                          <TableCell>{frete.empresa_nome}</TableCell>
                          <TableCell>{frete.carga}</TableCell>
                          <TableCell>{frete.km}</TableCell>
                          <TableCell>R$ {frete.valor.toFixed(2)}</TableCell>
                          <TableCell>R$ {frete.chapada.toFixed(2)}</TableCell>
                          <TableCell>R$ {(frete.valor + frete.chapada).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Seção de Débitos */}
                {relatorio.debitos.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Débitos no Período</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Data</TableHead>
                            <TableHead className="min-w-[200px]">Descrição</TableHead>
                            <TableHead className="min-w-[100px]">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatorio.debitos.map((debito, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatarData(debito.data)}</TableCell>
                              <TableCell>{debito.descricao}</TableCell>
                              <TableCell>R$ {debito.valor.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Versão para impressão */}
            <div id="relatorio-pdf" className="hidden print:block print:text-black">
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
                    <img src="/logo-coopervetra.jpg" alt="Logo COOPERVETRA" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="border-t-2 border-b-2 border-black py-2 my-4">
                  <h2 className="text-xl font-bold">RELATÓRIO DE FRETES SEMANAIS</h2>
                  {relatorio.empresa_nome && (
                    <p className="text-base font-semibold mt-1">Empresa: {relatorio.empresa_nome}</p>
                  )}
                </div>
              </div>

              {/* Nome do Cooperado */}
              <div className="mb-4">
                <p className="text-lg font-bold">NOME: {relatorio.cooperado_nome}</p>
              </div>

              {/* Tabela de Fretes */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-2 px-1 font-bold">Data</th>
                      <th className="text-left py-2 px-1 font-bold">CARGA</th>
                      <th className="text-left py-2 px-1 font-bold">KM</th>
                      <th className="text-left py-2 px-1 font-bold">VALOR</th>
                      <th className="text-left py-2 px-1 font-bold">CHAPADA</th>
                      <th className="text-left py-2 px-1 font-bold">EMPRESA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.fretes.map((frete, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2 px-1">{formatarData(frete.data)}</td>
                        <td className="py-2 px-1">{frete.carga}</td>
                        <td className="py-2 px-1">{frete.km}</td>
                        <td className="py-2 px-1">R$ {frete.valor.toFixed(2)}</td>
                        <td className="py-2 px-1">R$ {frete.chapada.toFixed(2)}</td>
                        <td className="py-2 px-1">{frete.empresa_nome}</td>
                      </tr>
                    ))}
                    {/* Linhas em branco para completar o espaço */}
                    {Array.from({ length: Math.max(0, 6 - relatorio.fretes.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-gray-300">
                        <td className="py-2 px-1">&nbsp;</td>
                        <td className="py-2 px-1">&nbsp;</td>
                        <td className="py-2 px-1">&nbsp;</td>
                        <td className="py-2 px-1">&nbsp;</td>
                        <td className="py-2 px-1">&nbsp;</td>
                        <td className="py-2 px-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tabela de Débitos */}
              {relatorio.debitos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">DÉBITOS NO PERÍODO</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="text-left py-2 px-1 font-bold">Data</th>
                        <th className="text-left py-2 px-1 font-bold">DESCRIÇÃO</th>
                        <th className="text-left py-2 px-1 font-bold">VALOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.debitos.map((debito, index) => (
                        <tr key={index} className="border-b border-gray-300">
                          <td className="py-2 px-1">{formatarData(debito.data)}</td>
                          <td className="py-2 px-1">{debito.descricao}</td>
                          <td className="py-2 px-1">R$ {debito.valor.toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Linhas em branco para completar o espaço se houver poucos débitos */}
                      {Array.from({ length: Math.max(0, 3 - relatorio.debitos.length) }).map((_, index) => (
                        <tr key={`empty-debito-${index}`} className="border-b border-gray-300">
                          <td className="py-2 px-1">&nbsp;</td>
                          <td className="py-2 px-1">&nbsp;</td>
                          <td className="py-2 px-1">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Linha divisória */}
              <div className="border-t border-dashed border-black mb-4"></div>

              {/* Totalizações */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="font-bold">TOTAL DE KM NO PERÍODO: {relatorio.total_km}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold">VALOR TOTAL FRETES:</span>
                    <span className="font-bold">R$ {relatorio.valor_bruto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">DESCONTO ADM 6%:</span>
                    <span className="font-bold text-red-600">R$ {relatorio.desconto_administrativo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">DESCONTO INSS 4,5%:</span>
                    <span className="font-bold text-red-600">R$ {relatorio.desconto_inss.toFixed(2)}</span>
                  </div>
                  {relatorio.total_debitos > 0 && (
                    <div className="flex justify-between">
                      <span className="font-bold">DÉBITOS:</span>
                      <span className="font-bold text-red-600">R$ {relatorio.total_debitos.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linha divisória */}
              <div className="border-t border-dashed border-black mb-4"></div>

              {/* Total Geral */}
              <div className="text-right mb-10">
                <p className="text-xl font-bold">TOTAL GERAL: R$ {relatorio.valor_liquido.toFixed(2)}</p>
              </div>

              {/* Espaço para assinaturas */}
              <div className="mt-12 pt-6">
                <div className="grid grid-cols-2 gap-16">
                  <div className="text-center">
                    <div className="border-t border-black mb-2"></div>
                    <p className="text-sm"> {relatorio.cooperado_nome}</p>
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
  )
}
