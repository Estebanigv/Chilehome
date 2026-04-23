import { getGreeting } from "@/lib/utils";
import KpiCards from "@/components/dashboard/kpi-cards";
import LeadsChart from "@/components/dashboard/leads-chart";
import Leaderboard from "@/components/dashboard/leaderboard";
import LeadsTable from "@/components/dashboard/leads-table";
import AiLeadCard from "@/components/dashboard/ai-lead-card";
import { ArrowRight, TrendingUp, Bot } from "lucide-react";

export default function DashboardPage() {
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium" style={{ color: "#94A3B8" }}>Panel administrativo</p>
          <h1 className="text-[26px] font-extrabold tracking-tight mt-0.5" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>
            {greeting}, Gonzalo
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/leads"
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#111827", color: "#FACC15", boxShadow: "0 4px 14px rgba(0,0,0,0.18)", textDecoration: "none" }}
          >
            Ver leads nuevos <ArrowRight size={13} strokeWidth={2.5} />
          </a>
          <button
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#ffffff", color: "#475569", border: "1.5px solid #E2E8F0" }}
          >
            <Bot size={14} strokeWidth={1.8} /> Preguntar al IA
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Chart + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07), 0 1px 2px rgba(16,24,40,0.04)" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>Leads — hoy en vivo</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>Actualizado cada 5 seg</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#DCFCE7", color: "#15803D" }}>
              <TrendingUp size={11} strokeWidth={2.5} /> En vivo
            </span>
          </div>
          <LeadsChart />
        </div>

        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07), 0 1px 2px rgba(16,24,40,0.04)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>Top ejecutivos</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>Por conversión esta semana</p>
            </div>
            <a href="/ejecutivos" className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "#64748B", textDecoration: "none" }}>
              Ver todos <ArrowRight size={11} strokeWidth={2.5} />
            </a>
          </div>
          <Leaderboard />
        </div>
      </div>

      {/* AI Insight */}
      <div className="lg:col-span-3">
        <AiLeadCard />
      </div>

      {/* Leads table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07), 0 1px 2px rgba(16,24,40,0.04)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>Leads activos</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>Priorizados por temperatura y score IA</p>
          </div>
          <a href="/leads" className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#64748B", textDecoration: "none" }}>
            Ver todos <ArrowRight size={13} strokeWidth={2} />
          </a>
        </div>
        <div className="px-6 py-2">
          <LeadsTable />
        </div>
      </div>

    </div>
  );
}
