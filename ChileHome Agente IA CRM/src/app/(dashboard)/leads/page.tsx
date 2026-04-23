import { Users } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-medium" style={{ color: "#94A3B8" }}>Panel administrativo</p>
        <h1 className="text-[26px] font-extrabold tracking-tight mt-0.5" style={{ color: "#0F172A", fontFamily: "var(--font-plus-jakarta)" }}>
          Leads
        </h1>
      </div>
      <div className="rounded-2xl flex flex-col items-center justify-center py-24 gap-4" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(16,24,40,0.07)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#F1F5F9" }}>
          <Users size={24} style={{ color: "#94A3B8" }} />
        </div>
        <p className="text-[15px] font-semibold" style={{ color: "#0F172A" }}>Página de Leads</p>
        <p className="text-[13px]" style={{ color: "#94A3B8" }}>Próximamente — en desarrollo</p>
      </div>
    </div>
  );
}
