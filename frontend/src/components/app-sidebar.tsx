
import { useState } from "react"
import { 
  BarChart3, 
  FileText, 
  Folder, 
  Plus, 
  Search, 
  Settings 
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { title: "דשבורד", url: "/", icon: BarChart3 },
  { title: "דיווחים", url: "/reports", icon: FileText },
  { title: "ניהול פרויקטים", url: "/projects", icon: Folder },
  { title: "דוחות", url: "/analytics", icon: Search },
  { title: "ניהול מערכת", url: "/admin", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const isExpanded = items.some((i) => isActive(i.url))
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"

  return (
    <Sidebar
      side="right"
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="text-right">
              <h2 className="text-lg font-bold text-sidebar-foreground">מערכת תב"ר</h2>
              <p className="text-sm text-sidebar-foreground/70">ניהול פרויקטים</p>
            </div>
          )}
          <SidebarTrigger className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent" />
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-right px-2">
            {!isCollapsed && "תפריט עיקרי"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="ml-3 h-4 w-4" />
                      {!isCollapsed && <span className="text-right">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
