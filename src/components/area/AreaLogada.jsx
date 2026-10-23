// components/area/AreaLogada.jsx
// Moldura da área logada: topo, menu lateral (coleção, alertas, simulações,
// plano e conta) e rodapé. Cada página da área só cuida do próprio conteúdo.
// No celular o menu vai pra cima do conteúdo.
import Link from "next/link";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Bell, Calculator, CreditCard, LayoutGrid, UserRound } from "lucide-react";
import Cabecalho, { iniciais } from "../Cabecalho";
import base from "../../app/page.module.css";
import styles from "./area.module.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const SECOES = [
  { id: "colecao", href: "/colecao", rotulo: "Minha coleção", Icone: LayoutGrid },
  { id: "alertas", href: "/alertas", rotulo: "Alertas", Icone: Bell, pro: true },
  { id: "simulacoes", href: "/simulacoes", rotulo: "Simulações", Icone: Calculator, pro: true },
  { id: "assinatura", href: "/assinatura", rotulo: "Plano e cobrança", Icone: CreditCard },
  { id: "conta", href: "/conta", rotulo: "Conta", Icone: UserRound },
];

/**
 * usuario: { nome, plano } · ativo: id da seção atual
 * titulo: título grande da página · acoes: botões ao lado do título (opcional)
 * (os avisos das ações aparecem como toast: components/AvisoToast.jsx)
 */
export default function AreaLogada({ usuario, ativo, titulo, acoes, children }) {
  const pro = usuario.plano === "pro";

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho naArea />

      <div className={styles.area}>
        <aside className={styles.lateral} aria-label="Minha área">
          <div className={styles.perfil}>
            <span className={styles.avatar} aria-hidden="true">
              {iniciais(usuario.nome)}
            </span>
            <div>
              <strong>{usuario.nome}</strong>
              <span className={pro ? styles.seloPro : styles.selo}>{pro ? "PRO" : "GRÁTIS"}</span>
            </div>
          </div>

          <nav className={styles.menu} aria-label="Seções da sua área">
            {SECOES.map(({ id, href, rotulo, Icone, pro: soPro }) => (
              <Link key={id} href={href} aria-current={ativo === id ? "page" : undefined} className={styles.item}>
                <Icone size={20} aria-hidden="true" />
                <span>{rotulo}</span>
                {soPro && !pro && <small className={styles.tagPro}>PRO</small>}
              </Link>
            ))}
          </nav>

          {!pro && (
            <div className={styles.upsell}>
              <strong>Quer alertas e histórico completo?</strong>
              <Link href="/assinar" className={base.buttonDark}>
                Assinar o Pro
              </Link>
            </div>
          )}
        </aside>

        <main className={styles.conteudo}>
          <div className={styles.cabeca}>
            <h1 className={styles.titulo}>{titulo}</h1>
            {acoes}
          </div>

          {children}
        </main>
      </div>

      <footer className={base.footer}>
        <div className={base.footerInner}>
          <span className={base.logo}>
            <span className={base.logoMark} aria-hidden="true" />
            slabbit
          </span>
          <p>
            Slabbit é um projeto independente e não tem relação com Nintendo, Creatures, GAME FREAK ou The Pokémon
            Company. Os preços são estimativas de mercado e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Caixa "isso é do Pro" usada nas seções que o Grátis não tem. */
export function BloqueioPro({ titulo, children }) {
  return (
    <div className={styles.bloqueio}>
      <span className={styles.bloqueioSelo}>PRO</span>
      <strong>{titulo}</strong>
      <p>{children}</p>
      <Link href="/assinar" className={base.buttonDark}>
        Assinar o Pro
      </Link>
    </div>
  );
}
