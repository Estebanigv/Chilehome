"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ExecRow = {
  id: number;
  name: string;
  leads: number;
  assigned: number;
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, { bg: string; color: string }> = {
    1: { bg: "#FACC15", color: "#111827" },
    2: { bg: "#E2E8F0", color: "#475569" },
    3: { bg: "#FEF3C7", color: "#92400E" },
  };
  const s = styles[rank] ?? { bg: "#F1F5F9", color: "#94A3B8" };
  return (
    <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {rank}
    </div>
  );
}

const avatarShades = ["#111827", "#1E293B", "#334155", "#475569"];

export default function Leaderboard() {
  const [execs, setExecs] = useState<ExecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from("executives")
      .select("id, name")
      .eq("active", true);

    if (error || !data) { setLoading(false); return; }

    const rows: ExecRow[] = await Promise.all(
      data.map(async (exec) => {
        const [offered, assigned] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true })
            .or(`offered_to_executive_id.eq.${exec.id},assigned_executive_id.eq.${exec.id}`),
          supabase.from("leads").select("id", { count: "exact", head: true })
            .eq("assigned_executive_id", exec.id)
            .in("status", ["assigned", "accepted"]),
        ]);
        return {
          id: exec.id,
          name: exec.name,
          leads: offered.count ?? 0,
          assigned: assigned.count ?? 0,
        };
      })
    );

    const sorted = rows.sort((a, b) => b.assigned - a.assigned || b.leads - a.leads);
    setExecs(sorted);
    setLoading(false);
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-[13px]" style={{ color: "#94A3B8" }}>Cargando...</div>;
  }

  if (execs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[13px]" style={{ color: "#94A3B8" }}>Sin ejecutivos activos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {execs.map((exec, idx) => (
        <div key={exec.id}
          className="flex items-center gap-3 py-3 px-1 transition-colors rounded-xl"
          style={{ borderBottom: idx < execs.length - 1 ? "1px solid #F1F5F9" : "none" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <RankBadge rank={idx + 1} />

          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: avatarShades[idx] ?? "#475569", color: "#FACC15" }}>
            {initials(exec.name)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: "#0F172A" }}>
              {exec.name}
            </p>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: "#94A3B8" }}>
              {exec.leads} ofertas · {exec.assigned} asignados
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[14px] font-bold leading-tight" style={{ color: "#0F172A" }}>
              {exec.leads > 0 ? Math.round((exec.assigned / exec.leads) * 100) : 0}%
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#CBD5E1" }}>conversión</p>
          </div>
        </div>
      ))}
    </div>
  );
}
