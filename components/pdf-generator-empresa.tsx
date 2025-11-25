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
            <h2 style="font-size: 18px; font-weight: bold; margin: 0;">RELATÓRIO DE FRETES POR EMPRESA</h2>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${relatorio.empresa_nome}</p>
            <p style="font-size: 12px; margin: 0;">Período: ${formatarData(relatorio.data_inicio)} a ${formatarData(relatorio.data_fim)}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; text-align: center;">
          <div style="border: 1px solid black; padding: 10px;">
            <p style="font-size: 10px; font-weight: bold; margin: 0;">COOPERADOS</p>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${relatorio.totais.total_cooperados}</p>
          </div>
          <div style="border: 1px solid black; padding: 10px;">
            <p style="font-size: 10px; font-weight: bold; margin: 0;">TOTAL FRETES</p>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${relatorio.totais.total_fretes}</p>
          </div>
          <div style="border: 1px solid black; padding: 10px;">
            <p style="font-size: 10px; font-weight: bold; margin: 0;">VALOR BRUTO</p>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">R$ ${relatorio.totais.total_valor_bruto.toFixed(2)}</p>
          </div>
          <div style="border: 1px solid black; padding: 10px;">
            <p style="font-size: 10px; font-weight: bold; margin: 0;">VALOR LÍQUIDO</p>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">R$ ${relatorio.totais.total_valor_liquido.toFixed(2)}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">RESUMO POR COOPERADO</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="border: 2px solid black;">
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">COOPERADO</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">FRETES</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">KM</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">VLR BRUTO</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">INSS 4,5%</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">ADM 6%</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">DÉBITOS</th>
                <th style="border: 1px solid black; padding: 4px; font-weight: bold;">VLR LÍQUIDO</th>
              </tr>
            </thead>
            <tbody>
              ${relatorio.cooperados
                .map(
                  (cooperado) => `
                <tr>
                  <td style="border: 1px solid black; padding: 4px;">${cooperado.cooperado_nome}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center;">${cooperado.total_fretes}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center;">${cooperado.total_km}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: right;">R$ ${cooperado.valor_bruto.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: right;">R$ ${cooperado.desconto_inss.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: right;">R$ ${cooperado.desconto_administrativo.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: right;">R$ ${cooperado.total_debitos.toFixed(2)}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">R$ ${cooperado.valor_liquido.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td style="border: 2px solid black; padding: 4px;">TOTAL GERAL</td>
                <td style="border: 2px solid black; padding: 4px; text-align: center;">${relatorio.totais.total_fretes}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: center;">${relatorio.totais.total_km}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.total_valor_bruto.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.total_desconto_inss.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.total_desconto_administrativo.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.total_debitos.toFixed(2)}</td>
                <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${relatorio.totais.total_valor_liquido.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Detalhamento de fretes por cooperado com somatórias -->
        ${relatorio.cooperados
          .map((cooperado) => {
            // Calcular subtotais do cooperado
            const subtotalKm = cooperado.fretes.reduce((sum, f) => sum + f.km, 0)
            const subtotalValor = cooperado.fretes.reduce((sum, f) => sum + f.valor, 0)
            const subtotalChapada = cooperado.fretes.reduce((sum, f) => sum + f.chapada, 0)
            const subtotalFinal = subtotalValor + subtotalChapada

            return `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 10px; background-color: #f0f0f0; padding: 8px; border-left: 4px solid #333;">
              DETALHAMENTO DE FRETES - ${cooperado.cooperado_nome}
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 15px;">
              <thead>
                <tr style="background-color: #e0e0e0;">
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold;">DATA</th>
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold;">CARGA</th>
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: center;">KM</th>
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: right;">VALOR</th>
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: right;">CHAPADA</th>
                  <th style="border: 1px solid black; padding: 4px; font-weight: bold; text-align: right;">VALOR FINAL</th>
                </tr>
              </thead>
              <tbody>
                ${cooperado.fretes
                  .map(
                    (frete) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 3px; text-align: center;">${formatarData(frete.data)}</td>
                    <td style="border: 1px solid black; padding: 3px;">${frete.carga}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: center;">${frete.km}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">R$ ${frete.valor.toFixed(2)}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">R$ ${frete.chapada.toFixed(2)}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right; font-weight: bold;">R$ ${(frete.valor + frete.chapada).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr style="background-color: #d4edda; font-weight: bold; border-top: 2px solid black;">
                  <td colspan="2" style="border: 2px solid black; padding: 4px; text-align: right;">SUBTOTAL ${cooperado.cooperado_nome.split(" ")[0]}:</td>
                  <td style="border: 2px solid black; padding: 4px; text-align: center;">${subtotalKm}</td>
                  <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${subtotalValor.toFixed(2)}</td>
                  <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${subtotalChapada.toFixed(2)}</td>
                  <td style="border: 2px solid black; padding: 4px; text-align: right;">R$ ${subtotalFinal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
          })
          .join("")}

        <!-- Totais gerais de todos os fretes detalhados -->
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border: 2px solid #333;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">TOTAIS GERAIS DE TODOS OS FRETES</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px;"><strong>Total de KM:</strong></td>
              <td style="padding: 5px; text-align: right;"><strong>${totalGeralKm}</strong></td>
              <td style="padding: 5px;"><strong>Total Valor:</strong></td>
              <td style="padding: 5px; text-align: right;"><strong>R$ ${totalGeralValor.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>Total Chapada:</strong></td>
              <td style="padding: 5px; text-align: right;"><strong>R$ ${totalGeralChapada.toFixed(2)}</strong></td>
              <td style="padding: 5px;"><strong>Valor Final Total:</strong></td>
              <td style="padding: 5px; text-align: right; font-size: 14px; color: #006400;"><strong>R$ ${totalGeralFinal.toFixed(2)}</strong></td>
            </tr>
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
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      document.body.removeChild(pdfContent)

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
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
