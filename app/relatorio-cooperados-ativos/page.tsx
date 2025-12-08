"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, RefreshCw, Printer, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import Image from "next/image"

interface Cooperado {
  id: number
  nome: string
  placa: string
}

export default function RelatorioCooperadosAtivosPage() {
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [gerando, setGerando] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCooperadosAtivos()
  }, [])

  const fetchCooperadosAtivos = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/cooperados?_t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      // Filtrar apenas ativos e selecionar nome e placa
      const ativos = data
        .filter((c: any) => c.ativo !== false)
        .map((c: any) => ({ id: c.id, nome: c.nome, placa: c.placa }))
        .sort((a: Cooperado, b: Cooperado) => a.nome.localeCompare(b.nome))
      setCooperados(ativos)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar cooperados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCooperadosAtivos()
    setRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleGeneratePDF = async () => {
    if (!printRef.current) return

    setGerando(true)
    try {
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default

      const canvas = await html2canvas(printRef.current, {
        scale: 1.2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.85)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, "FAST")

      const dataAtual = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")
      pdf.save(`cooperados-ativos-${dataAtual}.pdf`)

      toast({
        title: "PDF Gerado",
        description: "O arquivo PDF foi gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      })
    } finally {
      setGerando(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link href="/cooperados">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Relatório de Cooperados Ativos</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="print:hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Cooperados Ativos ({cooperados.length})</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button onClick={handleGeneratePDF} disabled={gerando || loading}>
                    <FileText className="h-4 w-4 mr-2" />
                    {gerando ? "Gerando..." : "Gerar PDF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <div ref={printRef} className="bg-white p-4">
                  {/* Cabeçalho para impressão */}
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-4">
                      <Image
                        src="/logo-cooperativa.png"
                        alt="Logo Cooperativa"
                        width={60}
                        height={60}
                        className="object-contain"
                      />
                      <div>
                        <h1 className="text-xl font-bold">COOPERVETRA</h1>
                        <p className="text-sm text-gray-600">Cooperativa de Transporte</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-semibold">Relatório de Cooperados Ativos</h2>
                      <p className="text-sm text-gray-600">Data: {new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>

                  {/* Tabela de cooperados */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="font-bold text-center w-16">#</TableHead>
                        <TableHead className="font-bold">Nome do Cooperado</TableHead>
                        <TableHead className="font-bold text-center">Placa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cooperados.map((cooperado, index) => (
                        <TableRow key={cooperado.id}>
                          <TableCell className="text-center font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{cooperado.nome}</TableCell>
                          <TableCell className="text-center">{cooperado.placa}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Rodapé com total */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-right font-semibold">Total de Cooperados Ativos: {cooperados.length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Estilos de impressão */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:hidden {
              display: none !important;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </AuthGuard>
  )
}
