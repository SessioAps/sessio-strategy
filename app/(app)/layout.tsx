import Sidebar from "@/app/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="board-bg flex min-h-screen">
      <Sidebar />
      <main className="app-scroll min-w-0 flex-1">{children}</main>
    </div>
  );
}
