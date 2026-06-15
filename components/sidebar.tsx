"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Truck,
  Users,
  Building2,
  Receipt,
  Database,
  Trophy,
  LogOut,
  Menu,
  ChevronDown,
  Home,
  BarChart3,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { clearSession, isAdmin } from "@/lib/session"

export function Sidebar() {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    setAdmin(isAdmin())
  }, [])

  const isActive = (href: string) => pathname === href

  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu)
  }

  const handleLogout = () => {
    clearSession()
    window.location.href = "/home"
  }

  const menuItems = [
    {
      label: "Início",
      href: "/",
      icon: Home,
    },
    {
      label: "Cooperados",
      href: "/cooperados",
      icon: Users,
    },
    {
      label: "Empresas",
      href: "/empresas",
      icon: Building2,
    },
    {
      label: "Fretes",
      href: "/fretes",
      icon: Truck,
    },
    {
      label: "Débitos",
      href: "/debitos",
      icon: Receipt,
    },
    {
      label: "Relatórios",
      icon: BarChart3,
      submenu: [
        { label: "Relatórios de Fretes", href: "/relatorios" },
        { label: "Relatórios por Empresa", href: "/relatorios-empresa" },
        { label: "Folha de Pagamento", href: "/folha-pagamento" },
        { label: "Fechamento Mensal", href: "/fechamento-mensal" },
      ],
    },
    {
      label: "Ranking de KM",
      href: "/ranking-km",
      icon: Trophy,
    },
    {
      label: "Cooperados Ativos",
      href: "/relatorio-cooperados-ativos",
      icon: Users,
    },
    {
      label: "Backup",
      href: "/backup",
      icon: Database,
    },
    ...(admin
      ? [
          {
            label: "Usuários",
            href: "/usuarios",
            icon: UserCog,
          },
          {
            label: "Novo Usuário",
            href: "/usuarios/novo",
            icon: UserCog,
          },
        ]
      : []),
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">Coopervetra</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          if (item.submenu) {
            return (
              <Collapsible
                key={item.label}
                open={expandedMenu === item.label}
                onOpenChange={() => toggleMenu(item.label)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedMenu === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                  {item.submenu.map((subitem) => (
                    <Link key={subitem.href} href={subitem.href}>
                      <button
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          isActive(subitem.href)
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {subitem.label}
                      </button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Link key={item.href} href={item.href!}>
              <button
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive(item.href!)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.label}</span>
              </button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button onClick={handleLogout} variant="outline" className="w-full justify-start" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center gap-4 p-4 bg-white border-b border-gray-200">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-gray-900">Coopervetra</span>
        </div>
      </div>
    </>
  )
}
