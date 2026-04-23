"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Star,
  UserCheck,
  BarChart2,
  Settings,
  ShieldAlert,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/mis-leads", label: "Mis leads", icon: Star },
  { href: "/ejecutivos", label: "Ejecutivos", icon: UserCheck },
  { href: "/analitica", label: "Analítica", icon: BarChart2 },
  { href: "/reportes", label: "Reportes", icon: ShieldAlert },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="w-[232px] flex-shrink-0 flex flex-col h-full"
      style={{ background: "#ffffff", borderRight: "1px solid #F1F5F9" }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <Image
          src="/logo-negro.svg"
          alt="ChileHome"
          width={148}
          height={40}
          priority
          className="h-8 w-auto object-contain"
        />
        <p className="text-[10px] mt-2" style={{ color: "#CBD5E1" }}>
          CRM · v2.0
        </p>
      </div>

      {/* Section label */}
      <div className="px-6 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#CBD5E1" }}>
          Menú
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors duration-150"
              style={
                active
                  ? { background: "#111827", color: "#ffffff" }
                  : { color: "#64748B" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#0F172A";
                  (e.currentTarget as HTMLElement).style.background = "#F8FAFC";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#64748B";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.8}
                style={{ color: active ? "#FACC15" : "currentColor", flexShrink: 0 }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User card */}
      <div
        className="mx-3 mb-5 p-3 rounded-xl flex items-center gap-3"
        style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: "#111827", color: "#FACC15" }}
        >
          GM
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: "#0F172A" }}>
            Gonzalo M.
          </p>
          <p className="text-[11px] leading-tight" style={{ color: "#94A3B8" }}>
            Administrador
          </p>
        </div>
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }}
        />
      </div>
    </aside>
  );
}
