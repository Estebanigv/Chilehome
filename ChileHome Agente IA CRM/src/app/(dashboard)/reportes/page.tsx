"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhoneOff, Clock, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

type FailureRow = {
  executive_name: string | null;
  lead_id: number;
  customer_name: string | null;
  customer_phone: string;
  created_at: string;
  failure_detail: string | null;
};

type PlatformError = {
  id: number;
  workflow_name: string | null;
  node_name: string | null;
  error_message: string | null;
  lead_id: number | null;
  executive_id: number | null;
  created_at: string;
};

type SectionData = {
  delivery_failed: FailureRow[];
  no_respondio: FailureRow[];
  rejected: FailureRow[];
  platform_errors: PlatformError[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  iconBg,
  iconColor,
  countBg,
  countColor,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  count: number;
  iconBg: string;
  iconColor: string;
  countBg: string;
  countColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <h2 className="text-[14px] font-bold leading-tight" style={{ color: "#0F172A" }}>{title}</h2>
        <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{subtitle}</p>
      </div>
      <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg" style={{ background: countBg, color: countColor }}>
        {count}
      </span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[13px]" style={{ color: "#CBD5E1" }}>{label}</p>
    </div>
  );
}

function FailureTable({ rows }: { rows: FailureRow[] }) {
  if (rows.length === 0) return <EmptyState label="Sin registros" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
            {["Ejecutivo", "Lead", "Teléfono", "Detalle", "Cuándo"].map((h) => (
              <th key={h} className="text-left pb-2.5 pt-1 pr-5 whitespace-nowrap"
                style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.lead_id}-${idx}`}
              style={{ borderBottom: idx < rows.length - 1 ? "1px solid #F8FAFC" : "none" }}>
              <td className="py-3 pr-5">
                <span className="text-[13px] font-semibold" style={{ color: "#0F172A" }}>
                  {row.executive_name ?? "—"}
                </span>
              </td>
              <td className="py-3 pr-5">
                <span className="text-[13px]" style={{ color: "#475569" }}>
                  {row.customer_name ?? "Sin nombre"}
                </span>
              </td>
              <td className="py-3 pr-5">
                <span className="text-[12px] font-mono" style={{ color: "#64748B" }}>
                  +{row.customer_phone}
                </span>
              </td>
              <td className="py-3 pr-5">
                <span className="text-[12px]" style={{ color: "#94A3B8" }}>
                  {row.failure_detail ?? "—"}
                </span>
              </td>
              <td className="py-3 whitespace-nowrap">
                <span className="text-[11px]" style={{ color: "#CBD5E1" }}>
                  {timeAgo(row.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlatformErrorTable({ rows }: { rows: PlatformError[] }) {
  if (rows.length === 0) return <EmptyState label="Sin errores registrados" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
            {["Workflow", "Nodo", "Error", "Lead ID", "Cuándo"].map((h) => (
              <th key={h} className="text-left pb-2.5 pt-1 pr-5 whitespace-nowrap"
                style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id}
              style={{ borderBottom: idx < rows.length - 1 ? "1px solid #F8FAFC" : "none" }}>
              <td className="py-3 pr-5">
                <span className="text-[12px] font-semibold" style={{ color: "#0F172A" }}>
                  {row.workflow_name ?? "—"}
                </span>
              </td>
              <td className="py-3 pr-5">
                <span className="text-[12px]" style={{ color: "#475569" }}>
                  {row.node_name ?? "—"}
                </span>
              </td>
              <td className="py-3 pr-5 max-w-xs">
                <span className="text-[11px] font-mono leading-relaxed block truncate" style={{ color: "#DC2626" }}
                  title={row.error_message ?? ""}>
                  {row.error_message ?? "—"}
                </span>
              </td>
              <td className="py-3 pr-5">
                <span className="text-[12px]" style={{ color: "#64748B" }}>
                  {row.lead_id ?? "—"}
                </span>
              </td>
              <td className="py-3 whitespace-nowrap">
                <span className="text-[11px]" style={{ color: "#CBD5E1" }}>
                  {timeAgo(row.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07), 0 1px 2px rgba(16,24,40,0.04)" }}>
      {children}
    </div>
  );
}

export default function ReportesPage() {
  const [data, setData] = useState<SectionData>({
    delivery_failed: [],
    no_respondio: [],
    rejected: [],
    platform_errors: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [offersRes, platformRes] = await Promise.all([
      supabase
        .from("lead_offers")
        .select(`
          lead_id, failure_type, failure_detail, created_at,
          executives(name),
          leads(customer_name, customer_phone)
        `)
        .in("failure_type", ["delivery_failed", "no_respondio", "rejected"])
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("platform_errors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (!offersRes.error && offersRes.data) {
      const mapRow = (r: any): FailureRow => ({
        lead_id: r.lead_id,
        executive_name: r.executives?.name ?? null,
        customer_name: r.leads?.customer_name ?? null,
        customer_phone: r.leads?.customer_phone ?? "",
        created_at: r.created_at,
        failure_detail: r.failure_detail,
      });

      const delivery_failed = offersRes.data.filter((r: any) => r.failure_type === "delivery_failed").map(mapRow);
      const no_respondio = offersRes.data.filter((r: any) => r.failure_type === "no_respondio").map(mapRow);
      const rejected = offersRes.data.filter((r: any) => r.failure_type === "rejected").map(mapRow);

      setData((prev) => ({ ...prev, delivery_failed, no_respondio, rejected }));
    }

    if (!platformRes.error && platformRes.data) {
      setData((prev) => ({ ...prev, platform_errors: platformRes.data }));
    }

    setLoading(false);
    setLastUpdated(new Date());
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium" style={{ color: "#94A3B8" }}>Panel administrativo</p>
          <h1 className="text-[26px] font-extrabold tracking-tight mt-0.5" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>
            Reporte de incidencias
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-[12px]" style={{ color: "#94A3B8" }}>
              Actualizado {timeAgo(lastUpdated.toISOString())}
            </p>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: "#F1F5F9", color: "#475569", border: "1.5px solid #E2E8F0" }}
          >
            <RefreshCw size={13} strokeWidth={2} /> Actualizar
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tel. apagado", count: data.delivery_failed.length, bg: "#FEF2F2", color: "#DC2626", numColor: "#991B1B" },
          { label: "Sin respuesta", count: data.no_respondio.length, bg: "#FEF3C7", color: "#92400E", numColor: "#78350F" },
          { label: "Rechazados", count: data.rejected.length, bg: "#EFF6FF", color: "#1D4ED8", numColor: "#1E3A8A" },
          { label: "Errores N8N", count: data.platform_errors.length, bg: "#FDF4FF", color: "#7E22CE", numColor: "#581C87" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#94A3B8" }}>{k.label}</p>
            <p className="text-[32px] font-extrabold leading-none mt-2" style={{ color: k.numColor, fontFamily: "var(--font-plus-jakarta)" }}>
              {loading ? "—" : k.count}
            </p>
            <div className="mt-3 h-1 rounded-full" style={{ background: k.bg }} />
          </div>
        ))}
      </div>

      {/* Delivery Failed */}
      <Card>
        <SectionHeader
          icon={PhoneOff}
          title="Teléfono apagado / no entregado"
          subtitle="Mensajes que Meta reportó como no entregados"
          count={data.delivery_failed.length}
          iconBg="#FEF2F2"
          iconColor="#DC2626"
          countBg="#FEF2F2"
          countColor="#DC2626"
        />
        <FailureTable rows={data.delivery_failed} />
      </Card>

      {/* Timeout / No response */}
      <Card>
        <SectionHeader
          icon={Clock}
          title="Sin respuesta (timeout)"
          subtitle="Ejecutivo no respondió dentro del tiempo límite"
          count={data.no_respondio.length}
          iconBg="#FEF3C7"
          iconColor="#92400E"
          countBg="#FEF3C7"
          countColor="#92400E"
        />
        <FailureTable rows={data.no_respondio} />
      </Card>

      {/* Rejected */}
      <Card>
        <SectionHeader
          icon={XCircle}
          title="Rechazados por ejecutivo"
          subtitle="El ejecutivo rechazó el lead manualmente"
          count={data.rejected.length}
          iconBg="#EFF6FF"
          iconColor="#1D4ED8"
          countBg="#EFF6FF"
          countColor="#1D4ED8"
        />
        <FailureTable rows={data.rejected} />
      </Card>

      {/* Platform errors */}
      <Card>
        <SectionHeader
          icon={AlertTriangle}
          title="Errores de plataforma N8N"
          subtitle="Errores internos registrados por los workflows de automatización"
          count={data.platform_errors.length}
          iconBg="#FDF4FF"
          iconColor="#7E22CE"
          countBg="#FDF4FF"
          countColor="#7E22CE"
        />
        <PlatformErrorTable rows={data.platform_errors} />
      </Card>

    </div>
  );
}
