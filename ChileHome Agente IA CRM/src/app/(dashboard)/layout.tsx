import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: "#F8FAFC" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
