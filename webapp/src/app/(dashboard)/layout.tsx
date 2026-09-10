import { AppHeader } from "@/app/(dashboard)/AppHeader";
import { SidebarNav } from "@/app/(dashboard)/SidebarNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <SidebarNav />

      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

