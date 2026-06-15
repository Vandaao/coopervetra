"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download, Printer, FileSpreadsheet, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Empresa {
  id: number
  nome: string
}

interface EmpresaResumo {
  empresa_id: number
  empresa_nome: string
  valor_bruto: number
  total_fretes: number
}

interface CooperadoResumo {
  cooperado_id: number
  cooperado_nome: string
  empresas: EmpresaResumo[]
  total_geral: number
}

interface RelatorioFechamento {
  data_inicio: string
  data_fim: string
  cooperados: CooperadoResumo[]
  totais: {
    total_cooperados: number
    total_fretes: number
    valor_total: number
  }
}

export default function FechamentoMensalPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState("todas")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<RelatorioFechamento | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
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
    if (!dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Preencha as datas de início e fim",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let url = `/api/relatorios/fechamento-mensal?data_inicio=${dataInicio}&data_fim=${dataFim}`

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
    if (!dataInicio || !dataFim) return

    setRefreshing(true)
    await handleGerarRelatorio()
    setRefreshing(false)
  }

  const formatarData = (dataString: string) => {
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const handlePrint = async () => {
    if (!relatorio) return

    setLoading(true)
    try {
      const { default: html2canvas } = await import("html2canvas")

      const printContent = document.createElement("div")
      printContent.style.width = "210mm"
      printContent.style.padding = "10mm"
      printContent.style.margin = "0"
      printContent.style.backgroundColor = "white"
      printContent.style.fontFamily = "Arial, sans-serif"
      printContent.style.fontSize = "10px"
      printContent.style.color = "black"
      printContent.style.lineHeight = "1.3"
      printContent.style.boxSizing = "border-box"

      printContent.innerHTML = gerarHTML()

      document.body.appendChild(printContent)

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowHeight: 1123,
        windowWidth: 794,
        logging: false,
      })

      document.body.removeChild(printContent)

      const printWindow = window.open("", "", "height=800,width=1000")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Imprimir Fechamento Mensal</title></head><body style='margin:0;padding:0;'>")
        printWindow.document.write(
          `<img src="${canvas.toDataURL("image/png")}" style="width:100%;height:auto;display:block;" />`,
        )
        printWindow.document.write("</body></html>")
        printWindow.document.close()

        setTimeout(() => {
          printWindow.print()
        }, 250)
      }

      toast({
        title: "Sucesso",
        description: "Janela de impressão aberta",
      })
    } catch (error) {
      console.error("Erro ao imprimir:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar impressão",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePDF = async () => {
    if (!relatorio) return

    setLoading(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")])

      const pdfContent = document.createElement("div")
      pdfContent.style.width = "210mm"
      pdfContent.style.padding = "10mm"
      pdfContent.style.margin = "0"
      pdfContent.style.backgroundColor = "white"
      pdfContent.style.fontFamily = "Arial, sans-serif"
      pdfContent.style.fontSize = "10px"
      pdfContent.style.color = "black"
      pdfContent.style.lineHeight = "1.3"
      pdfContent.style.boxSizing = "border-box"

      pdfContent.innerHTML = gerarHTML()

      document.body.appendChild(pdfContent)

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowHeight: 1123,
        windowWidth: 794,
        logging: false,
      })

      document.body.removeChild(pdfContent)

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const nomeArquivo = `fechamento-mensal-${relatorio.data_inicio}-${relatorio.data_fim}.pdf`
      pdf.save(nomeArquivo)

      toast({
        title: "Sucesso",
        description: "PDF salvo com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (!relatorio) return

    try {
      // Criar CSV
      let csv = "Cooperado;Empresa;Quantidade Fretes;Valor Bruto\n"

      for (const cooperado of relatorio.cooperados) {
        for (const empresa of cooperado.empresas) {
          csv += `"${cooperado.cooperado_nome}";"${empresa.empresa_nome}";${empresa.total_fretes};"R$ ${empresa.valor_bruto.toFixed(2).replace(".", ",")}"\n`
        }
      }

      // Linha de total geral
      csv += `\n"TOTAL GERAL";"${relatorio.totais.total_cooperados} cooperados";"${relatorio.totais.total_fretes} fretes";"R$ ${relatorio.totais.valor_total.toFixed(2).replace(".", ",")}"\n`

      // Criar blob e download
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `fechamento-mensal-${relatorio.data_inicio}-${relatorio.data_fim}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Planilha exportada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro",
        description: "Erro ao exportar planilha",
        variant: "destructive",
      })
    }
  }

  const gerarHTML = () => {
    if (!relatorio) return ""

    return `
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div style="flex: 1; padding-right: 15px;">
            <h1 style="font-size: 13px; font-weight: bold; margin: 0 0 5px 0; line-height: 1.1;">
              COOPERATIVA DE TRANSPORTADORES AUTÔNOMOS DE RIO POMBA E REGIÃO
            </h1>
            <div style="font-size: 9px; line-height: 1.3; margin: 0;">
              <p style="margin: 0;">CNPJ: 05.332.862/0001-35</p>
              <p style="margin: 0;">AVENIDA DOUTOR JOSÉ NEVES, 415</p>
              <p style="margin: 0;">RIO POMBA - MG 36180-000</p>
            </div>
          </div>
        </div>
        <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 8px; margin: 10px 0;">
          <h2 style="font-size: 14px; font-weight: bold; margin: 0;">FECHAMENTO MENSAL - FRETES PAGOS</h2>
          <p style="font-size: 9px; margin: 3px 0;">Período de Pagamento: ${formatarData(relatorio.data_inicio)} a ${formatarData(relatorio.data_fim)}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 12px; text-align: center;">
        <div style="border: 1px solid black; padding: 6px;">
          <p style="font-size: 8px; font-weight: bold; margin: 0;">COOPERADOS</p>
          <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">${relatorio.totais.total_cooperados}</p>
        </div>
        <div style="border: 1px solid black; padding: 6px;">
          <p style="font-size: 8px; font-weight: bold; margin: 0;">TOTAL FRETES</p>
          <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">${relatorio.totais.total_fretes}</p>
        </div>
        <div style="border: 1px solid black; padding: 6px;">
          <p style="font-size: 8px; font-weight: bold; margin: 0;">VALOR TOTAL BRUTO</p>
          <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">R$ ${relatorio.totais.valor_total.toFixed(2)}</p>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #e8e8e8;">
              <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: left;">COOPERADO</th>
              <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: left;">EMPRESA</th>
              <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: center;">QTD FRETES</th>
              <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: right;">VALOR BRUTO</th>
            </tr>
          </thead>
          <tbody>
            ${relatorio.cooperados
              .map(
                (cooperado) => `
                ${cooperado.empresas
                  .map(
                    (empresa, index) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 3px;">${index === 0 ? cooperado.cooperado_nome : ""}</td>
                    <td style="border: 1px solid black; padding: 3px;">${empresa.empresa_nome}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: center;">${empresa.total_fretes}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">R$ ${empresa.valor_bruto.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              `,
              )
              .join("")}
            <tr style="background-color: #d4edda; font-weight: bold;">
              <td colspan="2" style="border: 2px solid black; padding: 4px; text-align: right;">TOTAL GERAL:</td>
              <td style="border: 2px solid black; padding: 4px; text-align: center;">${relatorio.totais.total_fretes}</td>
              <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.valor_total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 40px;">
        <div style="display: flex; justify-content: space-between; gap: 20px;">
          <div style="text-align: center; flex: 1;">
            <div style="border-top: 1px solid black; height: 50px; margin-bottom: 5px;"></div>
            <p style="font-size: 9px; margin: 0;">RESPONSÁVEL</p>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="border-top: 1px solid black; height: 50px; margin-bottom: 5px;"></div>
            <p style="font-size: 9px; margin: 0;">FILIPE BENTO COSTA</p>
            <p style="font-size: 9px; margin: 0;">(PRESIDENTE)</p>
          </div>
        </div>
      </div>
    `
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fechamento Mensal</h1>
            {relatorio && (
              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
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

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="h-5 w-5 mr-2" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este relatório mostra todos os fretes pagos no período selecionado, agrupados por cooperado e empresa.
              A data considerada é a <strong>data de pagamento</strong> do frete.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="empresa">Empresa (opcional)</Label>
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
                <Label htmlFor="dataInicio">Data Início (Pagamento)</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim (Pagamento)</Label>
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

        {relatorio && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-bold">Relatório Gerado</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button onClick={handlePrint} disabled={loading} variant="outline" className="flex-1 sm:flex-none">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleSavePDF} disabled={loading} className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4 mr-2" />
                  Salvar PDF
                </Button>
                <Button onClick={handleExportExcel} disabled={loading} variant="secondary" className="flex-1 sm:flex-none">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Planilha
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Fechamento Mensal - Fretes Pagos</CardTitle>
                <p className="text-center text-muted-foreground">
                  Período de Pagamento: {formatarData(dataInicio)} a {formatarData(dataFim)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Cooperados</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{relatorio.totais.total_cooperados}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Fretes</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{relatorio.totais.total_fretes}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Valor Total Bruto</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">
                      R$ {relatorio.totais.valor_total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Cooperado</TableHead>
                        <TableHead className="min-w-[150px]">Empresa</TableHead>
                        <TableHead className="min-w-[100px] text-center">Qtd Fretes</TableHead>
                        <TableHead className="min-w-[120px] text-right">Valor Bruto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.cooperados.map((cooperado) => (
                        <>
                          {cooperado.empresas.map((empresa, index) => (
                            <TableRow key={`${cooperado.cooperado_id}-${empresa.empresa_id}`}>
                              <TableCell className="font-medium">
                                {index === 0 ? cooperado.cooperado_nome : ""}
                              </TableCell>
                              <TableCell>{empresa.empresa_nome}</TableCell>
                              <TableCell className="text-center">{empresa.total_fretes}</TableCell>
                              <TableCell className="text-right">R$ {empresa.valor_bruto.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                      <TableRow className="bg-green-100 font-bold">
                        <TableCell colSpan={2} className="text-right">
                          TOTAL GERAL:
                        </TableCell>
                        <TableCell className="text-center">{relatorio.totais.total_fretes}</TableCell>
                        <TableCell className="text-right">R$ {relatorio.totais.valor_total.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
