"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  FileClock,
  Gauge,
  Home,
  LogOut,
  Settings2,
  ShieldCheck,
  UserRound,
  Wrench,
  PackageSearch,
  CarFront,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { BrandMark } from "@/components/brand";

const customerLinks = [
  { label: "Início", href: "/app/home", icon: Home },
  { label: "Meu veículo", href: "/app/vehicles", icon: CarFront },
  { label: "Encontrar oficina", href: "/app/workshops", icon: Wrench },
  { label: "Encontrar peça", href: "/app/parts", icon: PackageSearch },
  { label: "Solicitar atendimento", href: "/app/request", icon: ClipboardList },
  { label: "Meus serviços", href: "/app/services", icon: FileClock },
  { label: "Diagnóstico inicial", href: "/app/diagnosis", icon: Gauge },
  { label: "Preciso de ajuda", href: "/app/tow", icon: AlertTriangle },
  { label: "Meu perfil", href: "/app/profile", icon: UserRound },
];

const workshopLinks = [
  { label: "Visão geral", href: "/workshop/dashboard", icon: Home },
  { label: "Solicitações", href: "/workshop/dashboard#solicitacoes", icon: ClipboardList },
  { label: "Perfil e serviços", href: "/workshop/profile", icon: Settings2 },
];

const mobileCustomer = [
  { label: "Início", href: "/app/home", icon: Home },
  { label: "Serviços", href: "/app/services", icon: FileClock },
  { label: "Ajuda", href: "/app/tow", icon: AlertTriangle },
  { label: "Histórico", href: "/app/history", icon: ClipboardList },
  { label: "Perfil", href: "/app/profile", icon: UserRound },
];

const mobileWorkshop = [
  { label: "Visão geral", href: "/workshop/dashboard", icon: Home },
  { label: "Solicitações", href: "/workshop/dashboard#solicitacoes", icon: ClipboardList },
  { label: "Oficina", href: "/workshop/profile", icon: Settings2 },
];

function isLinkActive(pathname: string, href: string, currentHash: string) {
  const target = href.split("?")[0].split("#")[0];
  const requestedHash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  if (target === "/workshop/dashboard") {
    return pathname === target && (requestedHash ? currentHash === requestedHash : currentHash !== "#solicitacoes");
  }
  if (target === "/app/home") return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function DashboardShell({ user, children, workspace = false }: { user: PublicUser; children: React.ReactNode; workspace?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const links = workspace ? workshopLinks : customerLinks;
  const mobileLinks = workspace ? mobileWorkshop : mobileCustomer;
  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);
  const title = pathname === "/app/history" ? "Histórico" : links.find((item) => isLinkActive(pathname, item.href, currentHash))?.label ?? (workspace ? "Área da oficina" : "AutoLink");

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar-brand"><BrandMark inverse /></div>
        <p className="sidebar-label">{workspace ? "Painel da oficina" : "Área do cliente"}</p>
        <nav className="sidebar-nav">
          {links.map(({ label, href, icon: Icon }) => (
            <Link key={href} className={`sidebar-link${isLinkActive(pathname, href, currentHash) ? " active" : ""}`} href={href} aria-current={isLinkActive(pathname, href, currentHash) ? "page" : undefined}>
              <Icon size={19} strokeWidth={1.9} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        {workspace ? (
          <div className="sidebar-help">
            <ShieldCheck size={19} color="#ffb35d" />
            <strong>AutoLink para negócios</strong>
            <p>Atenda clientes e organize sua agenda por aqui.</p>
            <Link className="button button-outline button-wide" href="/app/home">Área do cliente <ArrowUpRight size={15} /></Link>
          </div>
        ) : (
          <div className="sidebar-help">
            <ShieldCheck size={19} color="#ffb35d" />
            <strong>Precisa de ajuda agora?</strong>
            <p>Conte onde você está para pedir assistência.</p>
            <Link className="button button-primary button-wide" href="/app/tow">Pedir um guincho</Link>
          </div>
        )}
        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">{initials(user.fullName)}</div>
          <div className="sidebar-user-copy"><strong>{user.fullName}</strong><span>{workspace ? "Conta da oficina" : "Minha conta"}</span></div>
          <button className="sidebar-logout" type="button" onClick={logout} aria-label="Sair da conta" title="Sair da conta" disabled={loggingOut}><LogOut size={18} /></button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <Link className="mobile-brand" href={workspace ? "/workshop/dashboard" : "/app/home"}><BrandMark compact /></Link>
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            <span className="topbar-greeting">Olá, <strong>{user.fullName.split(" ")[0]}</strong></span>
            <div className="user-avatar" aria-label={`Conta de ${user.fullName}`} style={{ width: 37, height: 37, minWidth: 37 }}>{initials(user.fullName)}</div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação inferior">
        {mobileLinks.map(({ label, href, icon: Icon }) => (
          <Link key={href} className={`mobile-nav-link${isLinkActive(pathname, href, currentHash) ? " active" : ""}`} href={href} aria-current={isLinkActive(pathname, href, currentHash) ? "page" : undefined}>
            <Icon size={20} strokeWidth={2} /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
