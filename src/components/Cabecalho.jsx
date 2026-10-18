// components/Cabecalho.jsx
// Topo do site, igual em todas as páginas.
// Mostra "Entrar" pra visitante e o nome + "Sair" pra quem tá logado.
import Link from "next/link";
import { usuarioAtual } from "../lib/auth";
import { sair } from "../app/entrar/actions";
import base from "../app/page.module.css";

const LINKS = [
  { href: "/precos", rotulo: "Preços", id: "precos" },
  { href: "/planos", rotulo: "Planos", id: "planos" },
  { href: "/graduar", rotulo: "Vale graduar?", id: "graduar" },
  { href: "/colecao", rotulo: "Minha coleção", id: "colecao" },
];

export default async function Cabecalho({ ativo }) {
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

        {usuario ? (
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
        ) : (
          <Link href="/entrar" className={base.navCta}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
