"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PDFGenerator } from "@/components/pdf-generator"

interface Cooperado {
  id: number
  nome: string
}

interface RelatorioData {
  cooperado_nome: string
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
  const [cooperadoId, setCooperadoId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCooperados()
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

  const handleGerarRelatorio = async () => {
    if (!cooperadoId || !dataInicio || !dataFim) {
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
        `/api/relatorios?cooperado_id=${cooperadoId}&data_inicio=${dataInicio}&data_fim=${dataFim}`,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios de Fretes</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:px-8">
        <Card className="mb-8 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
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
                <PDFGenerator relatorio={relatorio} dataInicio={dataInicio} dataFim={dataFim} />
              </div>
            </div>

            {/* Versão para tela */}
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle className="text-center">Relatório de Fretes - {relatorio.cooperado_nome}</CardTitle>
                <p className="text-center text-muted-foreground">
                  Período: {formatarData(dataInicio)} a {formatarData(dataFim)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Fretes</p>
                    <p className="text-2xl font-bold text-blue-600">{relatorio.total_fretes}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Bruto</p>
                    <p className="text-2xl font-bold text-green-600">R$ {relatorio.valor_bruto.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Líquido</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {relatorio.valor_liquido.toFixed(2)}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Carga</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Chapada</TableHead>
                      <TableHead>Total</TableHead>
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

                {/* Seção de Débitos */}
                {relatorio.debitos.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Débitos no Período</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
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
                      <th className="text-left py-2 px-1 font-bold">EMPRESA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.fretes.map((frete, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2 px-1">{formatarData(frete.data)}</td>
                        <td className="py-2 px-1">{frete.carga}</td>
                        <td className="py-2 px-1">{frete.km}</td>
                        <td className="py-2 px-1">R$ {(frete.valor + frete.chapada).toFixed(2)}</td>
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
