"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bot, ArrowRight, MapPin } from "lucide-react";

type HotLead = {
  id: number;
  customer_name: string | null;
  customer_phone: string;
  customer_location: string | null;
  kit_type: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function AiLeadCard() {
  const [lead, setLead] = useState<HotLead | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchHotLead() {
      const { data } = await supabase
        .from("leads")
        .select("id, customer_name, customer_phone, customer_location, kit_type, created_at")
        .in("status", ["pending", "collecting_info", "offered"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLead(data ?? null);
      setLoading(false);
    }
    fetchHotLead();
    const interval = setInterval(fetchHotLead, 10000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 h-full"
      style={{ background: "#111827", boxShadow: "0 4px 32px rgba(17,24,39,0.18)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(250,204,21,0.15)" }}>
            <Bot size={14} style={{ color: "#FACC15" }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#FACC15" }}>
            Agente IA · Lead activo
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>
          En vivo
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12px]" style={{ color: "#6B7280" }}>Cargando...</p>
        </div>
      ) : !lead ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-[14px] font-semibold" style={{ color: "#9CA3AF" }}>Sin leads activos</p>
          <p className="text-[12px]" style={{ color: "#6B7280" }}>Aparecerá el próximo lead en espera</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-[20px] font-bold leading-tight" style={{ color: "#ffffff", fontFamily: "var(--font-plus-jakarta)" }}>
              {lead.customer_name ?? `+${lead.customer_phone}`}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={11} style={{ color: "#6B7280" }} />
              <span className="text-[12px]" style={{ color: "#6B7280" }}>
                {[lead.customer_location, lead.kit_type ? `Kit ${lead.kit_type}` : null].filter(Boolean).join(" · ") || "Sin ubicación"}
              </span>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#9CA3AF" }}>
            Lead ingresado <span style={{ color: "#D1D5DB" }}>{timeAgo(lead.created_at)}</span>.
            Pendiente de asignación a ejecutivo.
          </p>
        </>
      )}

      <a
        href="/leads"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold"
        style={{ background: "#FACC15", color: "#111827", textDecoration: "none", boxShadow: "0 4px 12px rgba(250,204,21,0.30)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAB308"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FACC15"; }}
      >
        Ver leads <ArrowRight size={13} strokeWidth={2.5} />
      </a>
    </div>
  );
}
