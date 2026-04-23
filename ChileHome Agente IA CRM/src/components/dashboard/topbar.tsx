"use client";

import { Search, Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="flex items-center justify-between px-7 py-4 flex-shrink-0"
      style={{ background: "#ffffff", borderBottom: "1px solid #E2E8F0" }}
    >
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#94A3B8" }}
        />
        <input
          type="text"
          placeholder="Buscar lead, teléfono, ejecutivo…"
          className="w-64 pl-9 pr-4 py-2 text-[13px] outline-none transition-all"
          style={{
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            color: "#334155",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#FACC15";
            e.target.style.background = "#fff";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E2E8F0";
            e.target.style.background = "#F8FAFC";
          }}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-100"
          style={{ color: "#64748B" }}
        >
          <Bell size={16} strokeWidth={1.8} />
          <span
            className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full"
            style={{ background: "#EF4444", border: "1.5px solid #fff" }}
          />
        </button>

        <div className="w-px h-7 mx-1" style={{ background: "#E2E8F0" }} />

        <div className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
            style={{ background: "#111827", color: "#FACC15" }}
          >
            GM
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "#0F172A" }}>
              Gonzalo M.
            </p>
            <p className="text-[11px] leading-tight" style={{ color: "#94A3B8" }}>
              Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
