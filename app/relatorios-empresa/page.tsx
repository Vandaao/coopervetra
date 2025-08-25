"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { PDFGeneratorEmpresa } from "@/components/pdf-generator-empresa"

interface Empresa {
  id: number
  nome: string
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
      const response = await fetch(
        `/api/relatorios/empresa?empresa_id=${empresaId}&data_inicio=${dataInicio}&data_fim=${dataFim}`,
      )
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
