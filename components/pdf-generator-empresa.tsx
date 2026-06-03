"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface PDFGeneratorEmpresaProps {
  relatorio: RelatorioEmpresaData
}

export function PDFGeneratorEmpresa({ relatorio }: PDFGeneratorEmpresaProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const formatarData = (dataString: string) => {
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const generatePDF = async () => {
    setLoading(true)

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")])

      const totalGeralKm = relatorio.cooperados.reduce((sum, c) => sum + c.fretes.reduce((s, f) => s + f.km, 0), 0)
      const totalGeralValor = relatorio.cooperados.reduce(
        (sum, c) => sum + c.fretes.reduce((s, f) => s + f.valor, 0),
        0,
      )
      const totalGeralChapada = relatorio.cooperados.reduce(
        (sum, c) => sum + c.fretes.reduce((s, f) => s + f.chapada, 0),
        0,
      )
      const totalGeralFinal = totalGeralValor + totalGeralChapada

      const pdfContent = document.createElement("div")
      pdfContent.style.width = "210mm"
      pdfContent.style.height = "297mm"
      pdfContent.style.padding = "10mm"
      pdfContent.style.margin = "0"
      pdfContent.style.backgroundColor = "white"
      pdfContent.style.fontFamily = "Arial, sans-serif"
      pdfContent.style.fontSize = "10px"
      pdfContent.style.color = "black"
      pdfContent.style.lineHeight = "1.3"
      pdfContent.style.boxSizing = "border-box"
      pdfContent.style.display = "block"

      pdfContent.innerHTML = `
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
            <h2 style="font-size: 14px; font-weight: bold; margin: 0;">RELATÓRIO DE FRETES POR EMPRESA</h2>
            <p style="font-size: 13px; font-weight: bold; margin: 3px 0;">${relatorio.empresa_nome}</p>
            <p style="font-size: 9px; margin: 0;">Período: ${formatarData(relatorio.data_inicio)} a ${formatarData(relatorio.data_fim)}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 12px; text-align: center;">
          <div style="border: 1px solid black; padding: 6px;">
            <p style="font-size: 8px; font-weight: bold; margin: 0;">COOPERADOS</p>
            <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">${relatorio.totais.total_cooperados}</p>
          </div>
          <div style="border: 1px solid black; padding: 6px;">
            <p style="font-size: 8px; font-weight: bold; margin: 0;">TOTAL FRETES</p>
            <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">${relatorio.totais.total_fretes}</p>
          </div>
          <div style="border: 1px solid black; padding: 6px;">
            <p style="font-size: 8px; font-weight: bold; margin: 0;">VALOR BRUTO</p>
            <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">R$ ${relatorio.totais.total_valor_bruto.toFixed(2)}</p>
          </div>
          <div style="border: 1px solid black; padding: 6px;">
            <p style="font-size: 8px; font-weight: bold; margin: 0;">VALOR LÍQUIDO</p>
            <p style="font-size: 12px; font-weight: bold; margin: 3px 0;">R$ ${relatorio.totais.total_valor_liquido.toFixed(2)}</p>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <h3 style="font-size: 11px; font-weight: bold; margin-bottom: 8px; background-color: #f0f0f0; padding: 4px;">RESUMO POR COOPERADO</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
            <thead>
              <tr style="background-color: #e8e8e8;">
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: left;">COOPERADO</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: center;">FRETES</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: center;">KM</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: right;">VLR BRUTO</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: right;">INSS 4,5%</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: right;">ADM 6%</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: right;">DÉBITOS</th>
                <th style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: right;">VLR LÍQUIDO</th>
              </tr>
            </thead>
            <tbody>
              ${relatorio.cooperados
                .map(
                  (cooperado) => `
                <tr>
                  <td style="border: 1px solid black; padding: 2px;">${cooperado.cooperado_nome}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: center;">${cooperado.total_fretes}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: center;">${cooperado.total_km}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: right;">R$ ${cooperado.valor_bruto.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: right;">R$ ${cooperado.desconto_inss.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: right;">R$ ${cooperado.desconto_administrativo.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: right;">R$ ${cooperado.total_debitos.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 2px; text-align: right; font-weight: bold;">R$ ${cooperado.valor_liquido.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td style="border: 2px solid black; padding: 3px;">TOTAL GERAL</td>
                <td style="border: 2px solid black; padding: 3px; text-align: center;">${relatorio.totais.total_fretes}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: center;">${relatorio.totais.total_km}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: right;">R$ ${relatorio.totais.total_valor_bruto.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: right;">R$ ${relatorio.totais.total_desconto_inss.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: right;">R$ ${relatorio.totais.total_desconto_administrativo.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: right;">R$ ${relatorio.totais.total_debitos.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 3px; text-align: right;">R$ ${relatorio.totais.total_valor_liquido.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>`

      document.body.appendChild(pdfContent)

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowHeight: 1123, // Altura A4 em pixels (297mm)
        windowWidth: 794, // Largura A4 em pixels (210mm)
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
      const imgWidth = 210 // Largura A4 em mm
      const pageHeight = 297 // Altura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Primeira página
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Páginas adicionais
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const nomeArquivo = `relatorio-empresa-${relatorio.empresa_nome.replace(/\s+/g, "-")}-${relatorio.data_inicio}-${relatorio.data_fim}.pdf`
      pdf.save(nomeArquivo)

      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso",
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

  return (
    <Button onClick={generatePDF} disabled={loading} variant="outline">
      <FileText className="h-4 w-4 mr-2" />
      {loading ? "Gerando PDF..." : "Salvar PDF"}
    </Button>
  )
}
