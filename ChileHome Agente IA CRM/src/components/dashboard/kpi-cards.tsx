"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type KpiData = {
  leadsHoy: number;
  pendientes: number;
  asignados: number;
  ejecutivosActivos: number;
};

function Sparkline({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 120 32" className="w-full" style={{ height: 28 }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FACC15" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${points} 120,32`} fill="url(#spark-grad)" />
      <polyline fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07)" }}>
      <div className="h-3 w-20 rounded mb-4" style={{ background: "#F1F5F9" }} />
      <div className="h-8 w-16 rounded mb-2" style={{ background: "#F1F5F9" }} />
      <div className="h-2 w-24 rounded" style={{ background: "#F1F5F9" }} />
    </div>
  );
}

export default function KpiCards() {
  const [data, setData] = useState<KpiData | null>(null);
  const supabase = createClient();

  async function fetchKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [leadsHoy, pendientes, asignados, ejecutivos] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["pending", "offered", "collecting_info"]),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["assigned", "accepted"]),
      supabase.from("executives").select("id", { count: "exact", head: true }).eq("active", true),
    ]);

    setData({
      leadsHoy: leadsHoy.count ?? 0,
      pendientes: pendientes.count ?? 0,
      asignados: asignados.count ?? 0,
      ejecutivosActivos: ejecutivos.count ?? 0,
    });
  }

  useEffect(() => {
    fetchKpis();
    const interval = setInterval(fetchKpis, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Leads hoy",
      value: String(data.leadsHoy),
      sub: "desde medianoche",
      sparkPoints: "0,28 15,22 30,25 45,16 60,20 75,11 90,14 105,7 120,9",
      badge: null,
    },
    {
      label: "En espera",
      value: String(data.pendientes),
      sub: "pendientes de ejecutivo",
      badge: data.pendientes > 0 ? { label: "Activos", up: true } : null,
    },
    {
      label: "Asignados",
      value: String(data.asignados),
      sub: "leads con ejecutivo",
      badge: data.asignados > 0 ? { label: "OK", up: true } : null,
    },
    {
      label: "Ejecutivos activos",
      value: String(data.ejecutivosActivos),
      sub: "disponibles ahora",
      badge: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((k) => (
        <div
          key={k.label}
          className="rounded-2xl p-5 flex flex-col transition-all duration-200 hover:-translate-y-px"
          style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07), 0 1px 2px rgba(16,24,40,0.04)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#94A3B8" }}>
              {k.label}
            </p>
            {k.badge && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: k.badge.up ? "#DCFCE7" : "#FEE2E2", color: k.badge.up ? "#15803D" : "#DC2626" }}>
                {k.badge.label}
              </span>
            )}
          </div>
          <p className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>
            {k.value}
          </p>
          {k.sub && <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>{k.sub}</p>}
          <div className="mt-4 flex-1 flex items-end">
            {k.sparkPoints ? (
              <div className="w-full"><Sparkline points={k.sparkPoints} /></div>
            ) : (
              <div className="w-full h-1 rounded-full" style={{ background: "#F1F5F9" }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
