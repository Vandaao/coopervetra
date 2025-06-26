"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface PDFGeneratorProps {
  relatorio: RelatorioData
  dataInicio: string
  dataFim: string
}

export function PDFGenerator({ relatorio, dataInicio, dataFim }: PDFGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const formatarData = (dataString: string) => {
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (dataString.includes("-") && dataString.length === 10) {
      const [ano, mes, dia] = dataString.split("-")
      return `${dia}/${mes}/${ano}`
    }
    // Caso contrário, tentar converter
    return new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const generatePDF = async () => {
    setLoading(true)

    try {
      // Importações dinâmicas para evitar problemas de SSR
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")])

      // Criar conteúdo HTML para o PDF
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
                <p>RIO POMBA - MG 36180.000-000</p>
              </div>
            </div>
            <div style="width: 120px; height: 80px; flex-shrink: 0;">
              <img src="/logo-coopervetra.jpg" alt="Logo COOPERVETRA" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>
          <div style="border-top: 2px solid black; border-bottom: 2px solid black; padding: 10px; margin: 20px 0;">
            <h2 style="font-size: 18px; font-weight: bold; margin: 0;">RELATÓRIO DE FRETES SEMANAIS</h2>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <p style="font-size: 14px; font-weight: bold;">NOME: ${relatorio.cooperado_nome}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid black;">
              <th style="text-align: left; padding: 8px 4px; font-weight: bold;">Data</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold;">CARGA</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold;">KM</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold;">VALOR</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold;">EMPRESA</th>
            </tr>
          </thead>
          <tbody>
            ${relatorio.fretes
              .map(
                (frete) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px 4px;">${formatarData(frete.data)}</td>
                <td style="padding: 8px 4px;">${frete.carga}</td>
                <td style="padding: 8px 4px;">${frete.km}</td>
                <td style="padding: 8px 4px;">R$ ${(frete.valor + frete.chapada).toFixed(2)}</td>
                <td style="padding: 8px 4px;">${frete.empresa_nome}</td>
              </tr>
            `,
              )
              .join("")}
            ${Array.from({ length: Math.max(0, 6 - relatorio.fretes.length) })
              .map(
                () => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px 4px;">&nbsp;</td>
                <td style="padding: 8px 4px;">&nbsp;</td>
                <td style="padding: 8px 4px;">&nbsp;</td>
                <td style="padding: 8px 4px;">&nbsp;</td>
                <td style="padding: 8px 4px;">&nbsp;</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        ${
          relatorio.debitos.length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">DÉBITOS NO PERÍODO</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid black;">
                <th style="text-align: left; padding: 8px 4px; font-weight: bold;">Data</th>
                <th style="text-align: left; padding: 8px 4px; font-weight: bold;">DESCRIÇÃO</th>
                <th style="text-align: left; padding: 8px 4px; font-weight: bold;">VALOR</th>
              </tr>
            </thead>
            <tbody>
              ${relatorio.debitos
                .map(
                  (debito) => `
                <tr style="border-bottom: 1px solid #ccc;">
                  <td style="padding: 8px 4px;">${formatarData(debito.data)}</td>
                  <td style="padding: 8px 4px;">${debito.descricao}</td>
                  <td style="padding: 8px 4px;">R$ ${debito.valor.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              ${Array.from({ length: Math.max(0, 3 - relatorio.debitos.length) })
                .map(
                  () => `
                <tr style="border-bottom: 1px solid #ccc;">
                  <td style="padding: 8px 4px;">&nbsp;</td>
                  <td style="padding: 8px 4px;">&nbsp;</td>
                  <td style="padding: 8px 4px;">&nbsp;</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <div style="border-top: 1px dashed black; margin: 20px 0;"></div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p style="font-weight: bold;">TOTAL DE KM NO PERÍODO: ${relatorio.total_km}</p>
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold;">VALOR TOTAL FRETES: R$ ${relatorio.valor_bruto.toFixed(2)}</span>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold;">DESCONTO ADM: R$ ${relatorio.desconto_administrativo.toFixed(2)}</span>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold;">DESCONTO INSS: R$ ${relatorio.desconto_inss.toFixed(2)}</span>
            </div>
            ${
              relatorio.total_debitos > 0
                ? `
              <div style="margin-bottom: 5px;">
                <span style="font-weight: bold;">DÉBITOS: R$ ${relatorio.total_debitos.toFixed(2)}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div style="border-top: 1px dashed black; margin: 20px 0;"></div>

        <div style="text-align: right; margin-bottom: 40px;">
          <p style="font-size: 18px; font-weight: bold;">TOTAL GERAL: R$ ${relatorio.valor_liquido.toFixed(2)}</p>
        </div>

        <div style="margin-top: 60px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid black; margin-bottom: 5px;"></div>
              <p style="font-size: 10px;">ASSINATURA DO COOPERADO</p>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid black; margin-bottom: 5px;"></div>
              <p style="font-size: 10px;">ASSINATURA DA COOPERATIVA</p>
            </div>
          </div>
        </div>
      `

      // Adicionar temporariamente ao DOM
      document.body.appendChild(pdfContent)

      // Gerar canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Remover elemento temporário
      document.body.removeChild(pdfContent)

      // Criar PDF
      const pdf = new jsPDF("p", "mm", "a4")
      const imgData = canvas.toDataURL("image/png")

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Salvar o PDF
      const nomeArquivo = `relatorio-${relatorio.cooperado_nome.replace(/\s+/g, "-")}-${dataInicio}-${dataFim}.pdf`
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
