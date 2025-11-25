"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

      const totalKmFretes = relatorio.fretes.reduce((sum, f) => sum + f.km, 0)
      const totalValorFretes = relatorio.fretes.reduce((sum, f) => sum + f.valor, 0)
      const totalChapadaFretes = relatorio.fretes.reduce((sum, f) => sum + f.chapada, 0)
      const totalFinalFretes = totalValorFretes + totalChapadaFretes

      const totalValorDebitos = relatorio.debitos.reduce((sum, d) => sum + d.valor, 0)

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
        <div style="text-center; margin-bottom: 20px;">
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
            <h2 style="font-size: 18px; font-weight: bold; margin: 0;">RELATÓRIO DE FRETES SEMANAIS</h2>
            ${relatorio.empresa_nome ? `<p style="font-size: 14px; font-weight: bold; margin: 5px 0;">Empresa: ${relatorio.empresa_nome}</p>` : ""}
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <p style="font-size: 14px; font-weight: bold;">NOME: ${relatorio.cooperado_nome}</p>
        </div>

        <!-- Tabela de fretes com coluna VALOR FINAL e linha de TOTAIS -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid black; background-color: #f0f0f0;">
              <th style="text-align: left; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">Data</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">CARGA</th>
              <th style="text-align: center; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">KM</th>
              <th style="text-align: right; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">VALOR</th>
              <th style="text-align: right; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">CHAPADA</th>
              <th style="text-align: right; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">VALOR FINAL</th>
              <th style="text-align: left; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">EMPRESA</th>
            </tr>
          </thead>
          <tbody>
            ${relatorio.fretes
              .map(
                (frete) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px 4px; border: 1px solid #ddd;">${formatarData(frete.data)}</td>
                <td style="padding: 8px 4px; border: 1px solid #ddd;">${frete.carga}</td>
                <td style="padding: 8px 4px; text-align: center; border: 1px solid #ddd;">${frete.km}</td>
                <td style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">R$ ${frete.valor.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">R$ ${frete.chapada.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border: 1px solid #ddd; font-weight: bold;">R$ ${(frete.valor + frete.chapada).toFixed(2)}</td>
                <td style="padding: 8px 4px; border: 1px solid #ddd;">${frete.empresa_nome}</td>
              </tr>
            `,
              )
              .join("")}
            <!-- Linha de totais dos fretes -->
            <tr style="background-color: #e8e8e8; font-weight: bold; border-top: 2px solid black;">
              <td colspan="2" style="padding: 8px 4px; text-align: right; border: 1px solid #999;">TOTAIS:</td>
              <td style="padding: 8px 4px; text-align: center; border: 1px solid #999;">${totalKmFretes}</td>
              <td style="padding: 8px 4px; text-align: right; border: 1px solid #999;">R$ ${totalValorFretes.toFixed(2)}</td>
              <td style="padding: 8px 4px; text-align: right; border: 1px solid #999;">R$ ${totalChapadaFretes.toFixed(2)}</td>
              <td style="padding: 8px 4px; text-align: right; border: 1px solid #999;">R$ ${totalFinalFretes.toFixed(2)}</td>
              <td style="padding: 8px 4px; border: 1px solid #999;"></td>
            </tr>
          </tbody>
        </table>

        ${
          relatorio.debitos.length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">DÉBITOS NO PERÍODO</h3>
          <!-- Tabela de débitos com linha de TOTAIS -->
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid black; background-color: #f0f0f0;">
                <th style="text-align: left; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">Data</th>
                <th style="text-align: left; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">DESCRIÇÃO</th>
                <th style="text-align: right; padding: 8px 4px; font-weight: bold; border: 1px solid #999;">VALOR</th>
              </tr>
            </thead>
            <tbody>
              ${relatorio.debitos
                .map(
                  (debito) => `
                <tr style="border-bottom: 1px solid #ccc;">
                  <td style="padding: 8px 4px; border: 1px solid #ddd;">${formatarData(debito.data)}</td>
                  <td style="padding: 8px 4px; border: 1px solid #ddd;">${debito.descricao}</td>
                  <td style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">R$ ${debito.valor.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <!-- Linha de total dos débitos -->
              <tr style="background-color: #e8e8e8; font-weight: bold; border-top: 2px solid black;">
                <td colspan="2" style="padding: 8px 4px; text-align: right; border: 1px solid #999;">TOTAL DÉBITOS:</td>
                <td style="padding: 8px 4px; text-align: right; border: 1px solid #999;">R$ ${totalValorDebitos.toFixed(2)}</td>
              </tr>
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
              <span style="font-weight: bold;">DESCONTO ADM 6%: R$ ${relatorio.desconto_administrativo.toFixed(2)}</span>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold;">DESCONTO INSS 4,5%: R$ ${relatorio.desconto_inss.toFixed(2)}</span>
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
              <p style="font-size: 10px;">${relatorio.cooperado_nome}</p>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid black; margin-bottom: 5px;"></div>
              <p style="font-size: 10px;">FILIPE BENTO COSTA (PRESIDENTE)</p>
            </div>
          </div>
        </div>
      `

      // Adicionar temporariamente ao DOM
      document.body.appendChild(pdfContent)

      // Gerar canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 1.2, // Reduzido de 2 para 1.2 para diminuir tamanho
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Remover elemento temporário
      document.body.removeChild(pdfContent)

      // Criar PDF
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true, // Ativa compressão do PDF
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.85)

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pageHeight

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
        heightLeft -= pageHeight
      }

      // Salvar o PDF
      const empresaSuffix = relatorio.empresa_nome ? `-${relatorio.empresa_nome.replace(/\s+/g, "-")}` : ""
      const nomeArquivo = `relatorio-${relatorio.cooperado_nome.replace(/\s+/g, "-")}${empresaSuffix}-${dataInicio}-${dataFim}.pdf`
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
    <Button onClick={generatePDF} disabled={loading} variant="outline" className="flex-1 sm:flex-none bg-transparent">
      <FileText className="h-4 w-4 mr-2" />
      {loading ? "Gerando PDF..." : "Salvar PDF"}
    </Button>
  )
}
