import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/utils";
import { logout } from "@/app/logout-action";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
  const name = session.user.name ?? "Usuária";

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col gap-2 border-r border-line bg-card px-5 py-8 box-border">
        <div className="px-3 pb-6">
          <div className="font-serif text-[34px] font-medium tracking-wide text-ink">
            Élan<span className="text-gold">.</span>
          </div>
          <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-muted">
            Estética Avançada
          </div>
        </div>

        <SidebarNav />

        <div className="flex-1" />

        <div className="flex items-center gap-3 rounded-xl bg-card2 px-3.5 py-4">
          <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-goldsoft font-serif text-[17px] font-semibold text-gold">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold">{name}</div>
            <div className="text-[11px] text-muted">
              {session.user.role === "ADMIN" ? "Diretora clínica" : "Equipe"}
            </div>
          </div>
        </div>

        <ThemeToggle initialTheme={theme} />

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-bad hover:text-bad"
          >
            Sair
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 box-border px-11 pb-16 pt-9">{children}</main>
    </div>
  );
}
