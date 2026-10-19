// components/Cabecalho.jsx
// Topo do site, igual em todas as páginas.
// Visitante vê "Entrar". Quem tá logado vê o botão "Minha área" (coleção, alertas, conta...).
// Dentro da área logada (naArea), o botão vira "Olá, nome" + "Sair".
import Link from "next/link";
import { usuarioAtual } from "../lib/auth";
import { sair } from "../app/entrar/actions";
import base from "../app/page.module.css";

const LINKS = [
  { href: "/precos", rotulo: "Preços", id: "precos" },
  { href: "/planos", rotulo: "Planos", id: "planos" },
  { href: "/graduar", rotulo: "Vale graduar?", id: "graduar" },
  { href: "/app", rotulo: "App", id: "app" },
];

// "João Pedro" → "JP"; "Ana" → "AN"
export function iniciais(nome = "") {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] ?? "").slice(0, 2);
  return letras.toUpperCase();
}

export default async function Cabecalho({ ativo, naArea = false }) {
  const usuario = await usuarioAtual();
  const primeiroNome = usuario?.nome.split(" ")[0];

  return (
    <header className={base.nav}>
      <div className={base.navInner}>
        <Link href="/" className={base.logo} aria-label="Slabbit, página inicial">
          <span className={base.logoMark} aria-hidden="true" />
          slabbit
        </Link>

        <nav className={base.navLinks} aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.id} href={l.href} aria-current={ativo === l.id ? "page" : undefined}>
              {l.rotulo}
            </Link>
          ))}
        </nav>

        {usuario && naArea && (
          <div className={base.navUser}>
            <span className={base.navHello}>
              Olá, <strong>{primeiroNome}</strong>
              {usuario.plano === "pro" && <span className={base.navPro}>PRO</span>}
            </span>
            <form action={sair}>
              <button type="submit" className={base.navCta}>
                Sair
              </button>
            </form>
          </div>
        )}

        {usuario && !naArea && (
          <Link href="/colecao" className={`${base.navCta} ${base.navArea}`}>
            <span className={base.navAvatar} aria-hidden="true">
              {iniciais(usuario.nome)}
            </span>
            Minha área
            {usuario.plano === "pro" && <span className={base.navPro}>PRO</span>}
          </Link>
        )}

        {!usuario && (
          <Link href="/entrar" className={base.navCta}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
