import { AlertTriangle, ArrowRight, BadgeCheck, CarFront, ClipboardCheck, MapPin, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  await ensureDemoData();
  const user = await getCurrentUser();
  if (user) redirect(user.role === "WORKSHOP" ? "/workshop/dashboard" : "/app/home");

  return (
    <main className="landing">
      <header className="landing-header">
        <BrandMark />
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <Link href="/login?perfil=oficina">Para oficinas</Link>
          <Link href="/login">Entrar</Link>
        </nav>
        <Link className="button button-primary button-small" href="/register">Criar minha conta <ArrowRight size={17} /></Link>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Cuidado com o carro, sem complicação</span>
          <h1 className="landing-title">Seu carro. Seus serviços. <span className="accent">Tudo em um só lugar.</span></h1>
          <p className="landing-description">Encontre oficinas de confiança, solicite ajuda e acompanhe cada serviço do seu carro com mais tranquilidade.</p>
          <div className="landing-cta">
            <Link className="button button-primary" href="/register">Criar minha conta <ArrowRight size={18} /></Link>
            <Link className="button button-outline" href="/login">Já tenho uma conta</Link>
          </div>
          <div className="landing-assurance"><ShieldCheck size={19} /> Seus dados protegidos e serviços em um só lugar.</div>
          <p className="landing-emergency"><AlertTriangle size={17} /> Está na estrada? <Link href="/login?ajuda=guincho">Preciso de ajuda agora</Link></p>
        </div>

        <div className="landing-visual" aria-label="Prévia da área do cliente AutoLink">
          <div className="landing-orb" />
          <div className="demo-window">
            <div className="demo-window-top">
              <div className="demo-user"><div className="demo-avatar"><CarFront size={22} /></div><div><small>Bom dia,</small><strong>João Mendes</strong></div></div>
              <span className="demo-tag">Tudo em dia</span>
            </div>
            <div className="demo-car">
              <div className="demo-car-copy"><small>SEU VEÍCULO</small><strong>Toyota Corolla</strong><small>2020 · XEi 2.0</small></div>
              <div className="demo-car-icon"><CarFront size={30} /></div>
            </div>
            <p className="demo-section-title">Como podemos ajudar?</p>
            <div className="demo-quick-grid">
              <div className="demo-quick"><span className="demo-quick-icon"><Wrench size={17} /></span> Encontrar oficina</div>
              <div className="demo-quick"><span className="demo-quick-icon"><MapPin size={17} /></span> Pedir guincho</div>
              <div className="demo-quick"><span className="demo-quick-icon"><ClipboardCheck size={17} /></span> Diagnosticar</div>
              <div className="demo-quick"><span className="demo-quick-icon"><BadgeCheck size={17} /></span> Meus serviços</div>
            </div>
            <p className="demo-section-title">Próximos serviços</p>
            <div className="demo-service"><span><strong>Revisão preventiva</strong><small>Centro Automotivo Avenida</small></span><span className="demo-service-status">Agendada</span></div>
          </div>
          <div className="demo-float"><span className="demo-float-icon"><ShieldCheck size={19} /></span>Mais tranquilidade para você</div>
        </div>
      </section>

      <section className="landing-trust" id="como-funciona">
        <div className="trust-inner">
          <span className="trust-label">O que você resolve com a AutoLink</span>
          <span className="trust-item"><Wrench size={18} /> Oficinas próximas</span>
          <span className="trust-item"><MapPin size={18} /> Ajuda na estrada</span>
          <span className="trust-item"><ClipboardCheck size={18} /> Serviços organizados</span>
          <span className="trust-item"><ShieldCheck size={18} /> Mais confiança</span>
        </div>
      </section>
      <footer className="landing-footer"><span>© 2026 AutoLink · Uma forma mais simples de cuidar do seu carro.</span><span>Para pessoas e oficinas.</span></footer>
    </main>
  );
}
