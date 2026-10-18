// src/app/entrar/page.jsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { usuarioAtual } from "../../lib/auth";
import Cabecalho from "../../components/Cabecalho";
import FormularioConta from "./FormularioConta";
import base from "../page.module.css";
import styles from "./entrar.module.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = { title: "Entrar | Slabbit" };

const vantagens = [
  { titulo: "Sua coleção com preço", texto: "Veja quanto suas cartas valem hoje, somadas, em real." },
  { titulo: "Simulações salvas", texto: "Guarde as contas do “Vale graduar?” e compare depois." },
  { titulo: "Alertas de preço", texto: "Saiba quando uma carta que você quer baixar ou subir. (Pro)" },
];

export default async function Entrar({ searchParams }) {
  const { modo = "entrar", voltar = "/" } = await searchParams;
  if (await usuarioAtual()) redirect("/");

  const cadastro = modo === "cadastro";
  const voltarSeguro = voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/";
  const link = (m) => `/entrar?modo=${m}${voltarSeguro !== "/" ? `&voltar=${encodeURIComponent(voltarSeguro)}` : ""}`;

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho />

      <main className={styles.main}>
        <div className={styles.inner}>
          <section className={styles.pitch}>
            <p className={base.eyebrow}>Conta Slabbit</p>
            <h1 className={styles.title}>{cadastro ? "Crie sua conta grátis" : "Bem-vindo de volta"}</h1>
            <ul className={styles.perks}>
              {vantagens.map((v) => (
                <li key={v.titulo}>
                  <strong>{v.titulo}</strong>
                  <span>{v.texto}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* O card é um slab: etiqueta em cima (as abas), conteúdo embaixo */}
          <section className={styles.slab} aria-label={cadastro ? "Criar conta" : "Entrar"}>
            <nav className={styles.tabs} aria-label="Escolha">
              <Link href={link("entrar")} className={!cadastro ? styles.tabOn : undefined} aria-current={!cadastro ? "page" : undefined}>
                Entrar
              </Link>
              <Link href={link("cadastro")} className={cadastro ? styles.tabOn : undefined} aria-current={cadastro ? "page" : undefined}>
                Criar conta
              </Link>
            </nav>

            <FormularioConta key={modo} modo={cadastro ? "cadastro" : "entrar"} voltar={voltarSeguro} />

            <p className={styles.switch}>
              {cadastro ? (
                <>
                  Já tem conta? <Link href={link("entrar")}>Entrar</Link>
                </>
              ) : (
                <>
                  Ainda não tem conta? <Link href={link("cadastro")}>Criar grátis</Link>
                </>
              )}
            </p>
          </section>
        </div>
      </main>

      <footer className={base.footer}>
        <div className={base.footerInner}>
          <span className={base.logo}>
            <span className={base.logoMark} aria-hidden="true" />
            slabbit
          </span>
          <p>
            Sua senha é guardada com criptografia e nunca é compartilhada. Slabbit é um projeto independente e não tem
            relação com Nintendo, Creatures, GAME FREAK ou The Pokémon Company.
          </p>
        </div>
      </footer>
    </div>
  );
}
