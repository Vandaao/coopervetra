import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Users, Building2, Receipt, FileText, DollarSign, Database } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { UserInfo } from "@/components/user-info"

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-white mr-3" />
                <h1 className="text-2xl font-bold text-white">Coopervetra - Sistema Gerenciador de Fretes</h1>
              </div>
              <UserInfo />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Painel Principal</h2>
            <p className="text-gray-600">Gerencie cooperados, empresas, fretes e gere relatórios</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Cooperados
                </CardTitle>
                <CardDescription>Cadastre e gerencie os cooperados</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/cooperados">
                  <Button className="w-full">Gerenciar Cooperados</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Empresas
                </CardTitle>
                <CardDescription>Cadastre e gerencie as empresas</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/empresas">
                  <Button className="w-full">Gerenciar Empresas</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-purple-600" />
                  Fretes
                </CardTitle>
                <CardDescription>Registre e gerencie os fretes</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/fretes">
                  <Button className="w-full">Gerenciar Fretes</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-red-600" />
                  Débitos
                </CardTitle>
                <CardDescription>Registre e gerencie os débitos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/debitos">
                  <Button className="w-full">Gerenciar Débitos</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Relatórios
                </CardTitle>
                <CardDescription>Gere relatórios detalhados de fretes com cálculos automáticos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/relatorios">
                  <Button className="w-full">Gerar Relatórios</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                  Relatórios por Empresa
                </CardTitle>
                <CardDescription>Gere relatórios consolidados por empresa com resumo completo</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/relatorios-empresa">
                  <Button className="w-full">Relatórios por Empresa</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                  Folha de Pagamento
                </CardTitle>
                <CardDescription>Gere folha de pagamento com valores líquidos e contas bancárias</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/folha-pagamento">
                  <Button className="w-full">Folha de Pagamento</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-cyan-600" />
                  Backup de Dados
                </CardTitle>
                <CardDescription>Faça backup local de todos os dados do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/backup">
                  <Button className="w-full">Backup de Dados</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="bg-white text-black text-center py-3 mt-auto">
            Grupo Modelo - Excelência que inspira confiança
        </footer>
      </div>
    </AuthGuard>
  )
}
