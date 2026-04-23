"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TemperatureBadge from "./temperature-badge";

type Lead = {
  id: number;
  customer_name: string | null;
  customer_phone: string;
  customer_location: string | null;
  kit_type: string | null;
  status: string;
  created_at: string;
  assigned_executive_id: number | null;
  offered_to_executive_id: number | null;
  exec_name: string | null;
};

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  collecting_info: { label: "Bot captando", bg: "#EFF6FF", color: "#1D4ED8" },
  pending:         { label: "Esperando", bg: "#FEF3C7", color: "#92400E" },
  offered:         { label: "Oferta enviada", bg: "#FEF9C3", color: "#854D0E" },
  assigned:        { label: "Asignado", bg: "#DCFCE7", color: "#15803D" },
  accepted:        { label: "Aceptado", bg: "#DCFCE7", color: "#15803D" },
  pending_next_day:{ label: "Para mañana", bg: "#F1F5F9", color: "#64748B" },
  lost:            { label: "Perdido", bg: "#FEE2E2", color: "#DC2626" },
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

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const avatarShades = ["#111827", "#1E293B", "#334155", "#475569", "#64748B"];

const HEADERS = ["Lead", "Ubicación", "Temperatura", "Ejecutivo", "Estado", ""];

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        id, customer_name, customer_phone, customer_location,
        kit_type, status, created_at,
        assigned_executive_id, offered_to_executive_id,
        executives!leads_assigned_executive_id_fkey(name)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const mapped = data.map((r: any) => ({
        ...r,
        exec_name: r.executives?.name ?? null,
      }));
      setLeads(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-center text-[13px]" style={{ color: "#94A3B8" }}>
        Cargando leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[14px] font-semibold" style={{ color: "#94A3B8" }}>Sin leads aún</p>
        <p className="text-[12px] mt-1" style={{ color: "#CBD5E1" }}>Los leads aparecerán aquí cuando llegue el primer WhatsApp</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
            {HEADERS.map((h) => (
              <th key={h} className="text-left pb-3 pt-1 pr-6 whitespace-nowrap"
                style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, idx) => {
            const st = statusLabels[lead.status] ?? { label: lead.status, bg: "#F1F5F9", color: "#64748B" };
            const isLast = idx === leads.length - 1;
            const execLabel = lead.exec_name ?? (lead.offered_to_executive_id ? "Ofrecido…" : "—");
            const avatarColor = avatarShades[idx % avatarShades.length];

            return (
              <tr key={lead.id} className="transition-colors"
                style={{ borderBottom: isLast ? "none" : "1px solid #F8FAFC" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <td className="py-3.5 pr-6">
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: "#0F172A" }}>
                    {lead.customer_name ?? "Sin nombre aún"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                    +{lead.customer_phone}
                  </p>
                </td>

                <td className="py-3.5 pr-6">
                  <span className="text-[13px]" style={{ color: "#475569" }}>
                    {lead.customer_location ?? "—"}
                  </span>
                </td>

                <td className="py-3.5 pr-6">
                  <TemperatureBadge temp="warm" />
                </td>

                <td className="py-3.5 pr-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: avatarColor, color: "#FACC15" }}>
                      {initials(execLabel)}
                    </div>
                    <span className="text-[12px]" style={{ color: "#475569" }}>{execLabel}</span>
                  </div>
                </td>

                <td className="py-3.5 pr-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </td>

                <td className="py-3.5 text-right whitespace-nowrap">
                  <span className="text-[11px]" style={{ color: "#CBD5E1" }}>
                    {timeAgo(lead.created_at)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
