"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface PDFGeneratorFolhaProps {
  relatorio: FolhaPagamentoData
}

export function PDFGeneratorFolha({ relatorio }: PDFGeneratorFolhaProps) {
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

      const pdfContent = document.createElement("div")
      pdfContent.style.width = "210mm"
      pdfContent.style.minHeight = "297mm"
      pdfContent.style.padding = "15mm"
      pdfContent.style.backgroundColor = "white"
      pdfContent.style.fontFamily = "Arial, sans-serif"
      pdfContent.style.fontSize = "12px"
      pdfContent.style.color = "black"

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div style="flex: 1; padding-right: 20px;">
              <h1 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; line-height: 1.2;">
                COOPERATIVA DE TRANSPORTADORES AUTÔNOMOS DE RIO POMBA E REGIÃO
              </h1>
              <div style="font-size: 12px; line-height: 1.4;">
                <p>CNPJ: 05.332.862/0001-35</p>
                <p>AVENIDA DOUTOR JOSÉ NEVES, 415</p>
                <p>RIO POMBA - MG 36180-000</p>
              </div>
            </div>
          </div>
          <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 10px; margin: 20px 0;">
            <h2 style="font-size: 18px; font-weight: bold; margin: 0;">FOLHA DE PAGAMENTO</h2>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${relatorio.empresa_nome}</p>
            <p style="font-size: 12px; margin: 0;">Período: ${formatarData(relatorio.data_inicio)} a ${formatarData(relatorio.data_fim)}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border: 2px solid black;">
                <th style="border: 1px solid black; padding: 12px; font-weight: bold; text-align: left;">COOPERADO</th>
                <th style="border: 1px solid black; padding: 12px; font-weight: bold; text-align: center;">CONTA BANCÁRIA</th>
                <th style="border: 1px solid black; padding: 12px; font-weight: bold; text-align: right;">VALOR LÍQUIDO</th>
              </tr>
            </thead>
            <tbody>
              ${relatorio.cooperados
                .map(
                  (cooperado, index) => `
                <tr style="${index % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
                  <td style="border: 1px solid black; padding: 12px;">${cooperado.cooperado_nome}</td>
                  <td style="border: 1px solid black; padding: 12px; text-align: center;">${cooperado.conta_bancaria}</td>
                  <td style="border: 1px solid black; padding: 12px; text-align: right; font-weight: bold;">R$ ${cooperado.valor_liquido.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background-color: #e0e0e0; font-weight: bold; font-size: 16px;">
                <td style="border: 2px solid black; padding: 12px;" colspan="2">TOTAL GERAL</td>
                <td style="border: 2px solid black; padding: 12px; text-align: right;">R$ ${relatorio.total_geral.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 60px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid black; margin-bottom: 5px;"></div>
              <p style="font-size: 10px;">RESPONSÁVEL DA EMPRESA</p>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid black; margin-bottom: 5px;"></div>
              <p style="font-size: 10px;">FILIPE BENTO COSTA (PRESIDENTE)</p>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(pdfContent)

      const canvas = await html2canvas(pdfContent, {
        scale: 1.2, // Reduzido de 2 para 1.2 para diminuir tamanho
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      document.body.removeChild(pdfContent)

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true, // Ativa compressão do PDF
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.85)

      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
        heightLeft -= pageHeight
      }

      const nomeArquivo = `folha-pagamento-${relatorio.empresa_nome.replace(/\s+/g, "-")}-${relatorio.data_inicio}-${relatorio.data_fim}.pdf`
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
