"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = { day: string; leads: number };

function buildEmptyDays(): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = i === 0 ? "hoy" : `${d.getDate()} ${d.toLocaleString("es-CL", { month: "short" })}`;
    points.push({ day: label, leads: 0 });
  }
  return points;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F172A", borderRadius: 10, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
      <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 700 }}>
        {payload[0].value} <span style={{ color: "#64748B", fontWeight: 400 }}>leads</span>
      </p>
    </div>
  );
}

export default function LeadsChart() {
  const [data, setData] = useState<ChartPoint[]>(buildEmptyDays());
  const supabase = createClient();

  useEffect(() => {
    async function fetchChart() {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);

      const { data: rows } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", since.toISOString());

      if (!rows) return;

      const points = buildEmptyDays();
      const today = new Date();

      for (const row of rows) {
        const d = new Date(row.created_at);
        const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
        const idx = 13 - diffDays;
        if (idx >= 0 && idx < 14) points[idx].leads += 1;
      }

      setData(points);
    }

    fetchChart();
    const interval = setInterval(fetchChart, 10000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FACC15" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#FACC15" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#CBD5E1" }} axisLine={false} tickLine={false} interval={1} />
        <YAxis tick={{ fontSize: 11, fill: "#CBD5E1" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#111827"
          strokeWidth={2}
          fill="url(#leadsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#111827", stroke: "#FACC15", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
