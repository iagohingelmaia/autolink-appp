"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";

type Mode = "login" | "register";
type AuthFormProps = { mode: Mode };

type ApiResponse = { user?: { role?: string }; error?: string };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (mode === "login" && params.get("perfil") === "oficina") setEmail("oficina@autolink.com");
    setEmergencyMode(params.get("ajuda") === "guincho");
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setError(result.error ?? "Não foi possível continuar. Confira os dados e tente novamente.");
        return;
      }
      const wantsTow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("ajuda") === "guincho";
      router.push(result.user?.role === "WORKSHOP" ? "/workshop/dashboard" : wantsTow ? "/app/tow" : "/app/home");
      router.refresh();
    } catch {
      setError("Não conseguimos conectar agora. Verifique sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(role: "CUSTOMER" | "WORKSHOP") {
    setEmail(role === "CUSTOMER" ? "demo@autolink.com" : "oficina@autolink.com");
    setPassword(role === "CUSTOMER" ? "AutoLink2026!" : "Oficina2026!");
    setError("");
  }

  const intro = mode === "login"
    ? { title: "Conte com a AutoLink para cuidar do seu carro.", text: "Encontre oficinas, peça ajuda e acompanhe seus serviços com clareza e tranquilidade." }
    : { title: "Seu carro merece cuidado. Você merece tranquilidade.", text: "Crie sua conta e deixe as informações do seu veículo e serviços organizadas em um só lugar." };

  return (
    <main className="auth-page">
      <aside className="auth-intro">
        <BrandMark inverse />
        <div className="auth-intro-content">
          <span className="eyebrow" style={{ color: "white", background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.14)" }}><span className="eyebrow-dot" /> Sua jornada mais simples</span>
          <h1>{intro.title}</h1>
          <p>{intro.text}</p>
          <div className="auth-benefit"><ShieldCheck size={20} /> Seus dados protegidos</div>
          <div className="auth-benefit"><Wrench size={20} /> Oficinas e serviços em um só lugar</div>
          <div className="auth-benefit"><Check size={20} /> Passos claros, sem complicação</div>
        </div>
        <div className="auth-intro-foot">AutoLink · Cuidado automotivo, do seu jeito.</div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-card">
          <Link href="/" className="text-link" style={{ marginBottom: 18 }}><ArrowLeft size={16} /> Voltar ao início</Link>
          {mode === "login" ? (
            <>
              <h2>Que bom ter você de volta.</h2>
              <p className="auth-subtitle">Entre para acompanhar e cuidar do seu carro.</p>
              <form className="form-stack" onSubmit={submit}>
                <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
                <div className="field"><label htmlFor="password">Senha</label><div style={{ position: "relative" }}><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" required value={password} onChange={(event) => setPassword(event.target.value)} style={{ paddingRight: 48 }} /><button className="icon-button" type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((current) => !current)} style={{ position: "absolute", right: 5, top: 3 }}><span style={{ display: "grid" }}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</span></button></div></div>
                {error && <div className="alert alert-error" role="alert"><LockKeyhole size={17} />{error}</div>}
                <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? <><span className="loading-ring" style={{ width: 18, height: 18, borderColor: "rgba(255,255,255,.35)", borderTopColor: "white" }} /> Entrando...</> : <>Entrar na minha conta <ArrowRight size={17} /></>}</button>
              </form>
              <div className="demo-login"><strong>Acesso de demonstração</strong><span>Cliente: demo@autolink.com · senha: AutoLink2026!</span><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}><button className="button button-outline button-small" type="button" onClick={() => fillDemo("CUSTOMER")}>Entrar como cliente</button><button className="button button-outline button-small" type="button" onClick={() => fillDemo("WORKSHOP")}>Entrar como oficina</button></div></div>
              <p className="auth-switch">Ainda não tem conta? <Link href={emergencyMode ? "/register?ajuda=guincho" : "/register"}>Criar minha conta</Link></p>
            </>
          ) : (
            <>
              <h2>Vamos começar?</h2>
              <p className="auth-subtitle">Crie sua conta em poucos passos. Ter um carro cadastrado é necessário para usar a AutoLink.</p>
              <form className="form-stack" onSubmit={submit}>
                <div className="field"><label htmlFor="fullName">Seu nome completo</label><input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Como podemos chamar você?" minLength={2} maxLength={100} required /></div>
                <div className="form-grid">
                  <div className="field"><label htmlFor="register-email">E-mail</label><input id="register-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required /></div>
                  <div className="field"><label htmlFor="phone">Telefone <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" /></div>
                </div>
                <div className="field"><label htmlFor="register-password">Crie uma senha</label><input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="Pelo menos 8 caracteres" minLength={8} required /></div>
                <div className="form-divider" />
                <div><p style={{ margin: 0, color: "var(--navy)", fontWeight: 780 }}>Sobre o seu carro</p><p className="field-hint" style={{ margin: "4px 0 0" }}>Esses dados ajudam a encontrar o atendimento certo.</p></div>
                <div className="form-grid">
                  <div className="field"><label htmlFor="make">Marca</label><input id="make" name="make" placeholder="Ex.: Toyota" autoComplete="off" required /></div>
                  <div className="field"><label htmlFor="model">Modelo</label><input id="model" name="model" placeholder="Ex.: Corolla" autoComplete="off" required /></div>
                </div>
                <div className="form-grid">
                  <div className="field"><label htmlFor="year">Ano</label><input id="year" name="year" type="number" min="1950" max={new Date().getFullYear() + 1} placeholder="2020" required /></div>
                  <div className="field"><label htmlFor="version">Versão <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="version" name="version" placeholder="Ex.: XEi 2.0" /></div>
                </div>
                <div className="form-grid">
                  <div className="field"><label htmlFor="plate">Placa <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="plate" name="plate" placeholder="ABC-1D23" maxLength={8} /></div>
                  <div className="field"><label htmlFor="fuel">Combustível</label><select id="fuel" name="fuel" defaultValue="Flex"><option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Etanol</option><option>Elétrico</option><option>Híbrido</option></select></div>
                </div>
                {error && <div className="alert alert-error" role="alert">{error}</div>}
                <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? <><span className="loading-ring" style={{ width: 18, height: 18 }} /> Criando sua conta...</> : <>Criar conta e cadastrar carro <ArrowRight size={17} /></>}</button>
              </form>
              <p className="auth-switch">Já tem conta? <Link href="/login">Entrar</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
