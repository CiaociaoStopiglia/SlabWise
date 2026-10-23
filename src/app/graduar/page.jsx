// app/graduar/page.jsx
// Simulador "Vale graduar?" (endereço: /graduar ou /graduar?carta=ID)

import Link from "next/link";
import Image from "next/image";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { buscarCartaPorId, cotacaoDoDia, formatarReais, pesquisarCartas } from "../../lib/tcgdex";
import Calculadora from "./Calculadora";
import { usuarioAtual } from "../../lib/auth";
import { salvarSimulacao } from "../simulacoes/actions";
import Cabecalho from "../../components/Cabecalho";
import base from "../page.module.css";
import styles from "./graduar.module.css";
import CartaBrilhante from "../../components/CartaBrilhante";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Vale a pena graduar? | Slabbit",
  description: "Simule em real se compensa mandar sua carta Pokémon pra PSA: taxa, frete, imposto e chance de cada nota.",
};

export default async function Graduar({ searchParams }) {
  const { carta: id = "", q = "" } = await searchParams;
  const termo = q.trim();

  const [cotacao, usuario] = await Promise.all([cotacaoDoDia(), usuarioAtual()]);
  const quemSalva = !usuario ? "visitante" : usuario.plano === "pro" ? "pro" : "gratis";
  const carta = id ? await buscarCartaPorId(id, cotacao) : null;
  const busca = !carta && termo ? await pesquisarCartas(termo) : null;

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho ativo="graduar" />

      <main>
        <section className={styles.band}>
          <div className={styles.bandInner}>
            <p className={base.eyebrow}>Simulador de graduação</p>
            <h1 className={styles.title}>Vale a pena mandar pra PSA?</h1>
            <p className={styles.lead}>
              A gente faz a conta em real com taxa, frete e imposto, estima a chance de cada nota pelo estado da carta e
              diz se compensa.
            </p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.bodyInner}>
            {/* PASSO 1: escolher a carta */}
            <div className={styles.step}>
              <h2 className={styles.legend}>
                <span className={styles.stepNum}>1</span> Sua carta
              </h2>

              {carta ? (
                // Carta escolhida em destaque: dentro de um "slab" de etiqueta, como na home,
                // com o preço de hoje numa etiqueta preta ao lado.
                <div className={styles.escolhida}>
                  <div className={styles.slabMini}>
                    <div className={styles.slabEtiqueta}>
                      <div>
                        <small>{carta.set?.toUpperCase()}</small>
                        <strong>{carta.name.toUpperCase()}</strong>
                        <small>#{carta.number}</small>
                      </div>
                      <div className={styles.slabCond}>
                        <small>COND.</small>
                        <b>NM</b>
                      </div>
                    </div>
                    <CartaBrilhante valor={carta.preco?.valor} inclinar={false} className={styles.slabFotoCaixa}>
                      <Image
                        src={carta.images.small}
                        alt={`Carta ${carta.name} · ${carta.set} ${carta.number}`}
                        width={245}
                        height={337}
                        className={styles.slabFoto}
                      />
                    </CartaBrilhante>
                  </div>

                  <div className={styles.escolhidaInfo}>
                    <p className={styles.escolhidaKicker}>Carta escolhida</p>
                    <h3 className={styles.escolhidaNome}>{carta.name}</h3>
                    <p className={styles.escolhidaMeta}>
                      {carta.set} · #{carta.number}
                      {carta.rarity ? ` · ${carta.rarity}` : ""}
                    </p>

                    {carta.preco ? (
                      <div className={styles.precoTag}>
                        <span>Preço hoje · sem graduar · NM</span>
                        <strong>{formatarReais(carta.preco.valor)}</strong>
                        {Number.isFinite(carta.preco.variacao30) && (
                          <span className={carta.preco.variacao30 >= 0 ? styles.precoSobe : styles.precoCai}>
                            {carta.preco.variacao30 >= 0 ? "▲" : "▼"} {Math.abs(carta.preco.variacao30).toFixed(0)}% vs.
                            média de 30 dias
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className={styles.semPreco}>Sem preço na base agora. Preencha os valores no passo 2.</p>
                    )}

                    <p className={styles.escolhidaDica}>
                      {carta.preco
                        ? "Já colocamos esse preço no passo 2. Se a sua carta não estiver quase nova, ajuste lá."
                        : "Use vendas recentes no eBay ou na Liga como referência."}
                    </p>

                    <div className={styles.escolhidaAcoes}>
                      <Link href="/graduar" className={base.buttonOutline}>
                        Trocar carta
                      </Link>
                      <Link href={`/carta/${encodeURIComponent(carta.id)}`} className={base.buttonOutline}>
                        Ver página da carta
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <form action="/graduar" method="get" className={`${base.search} ${styles.pickSearch}`} role="search">
                    <label htmlFor="q" className={base.srOnly}>
                      Nome ou número da carta
                    </label>
                    <input
                      id="q"
                      name="q"
                      type="search"
                      defaultValue={termo}
                      placeholder="Ex.: Umbreon VMAX 215/203"
                      autoComplete="off"
                      className={base.searchInput}
                    />
                    <button type="submit" className={base.searchButton}>
                      Buscar
                    </button>
                  </form>

                  {busca?.erro && (
                    <p className={styles.warnBox}>
                      Não conseguimos consultar as cartas agora. Você pode simular digitando os valores abaixo.
                    </p>
                  )}
                  {busca && !busca.erro && busca.total === 0 && (
                    <p className={styles.muted}>Nenhuma carta encontrada para “{termo}”. Tente o nome em inglês.</p>
                  )}
                  {busca && busca.cartas.length > 0 && (
                    <ul className={styles.pickList}>
                      {busca.cartas.slice(0, 12).map((c) => (
                        <li key={c.id}>
                          <Link href={`/graduar?carta=${encodeURIComponent(c.id)}`} className={styles.pickItem}>
                            <Image src={c.images.small} alt="" width={245} height={337} />
                            <span>
                              <strong>{c.name}</strong>
                              <small>
                                {c.set ? `${c.set} · ` : ""}#{c.number}
                              </small>
                              <small className={styles.pickPrice}>
                                {c.preco ? formatarReais(c.preco.valor) : "sem preço"}
                              </small>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!busca && (
                    <p className={styles.muted}>
                      Busque a carta pra puxar o preço dela, ou só preencha os valores abaixo.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* PASSOS 2 a 4 + resultado */}
            <Calculadora
              key={carta?.id ?? "exemplo"}
              carta={carta ? { id: carta.id, nome: carta.name, preco: carta.preco?.valor ?? null } : null}
              quemSalva={quemSalva}
              acaoSalvar={salvarSimulacao}
              cotacaoUsd={cotacao.usd}
              cotacaoFonte={cotacao.fonte}
            />

            <div className={styles.tips}>
              <h2 className={base.sectionTitle}>Antes de mandar</h2>
              <ul>
                <li>
                  <strong>Proteja a carta:</strong> sleeve novo, depois um card saver ou toploader. Nada de fita na
                  carta.
                </li>
                <li>
                  <strong>Declare o valor certo:</strong> declarar menos que o valor real pode gerar cobrança extra da
                  PSA e deixa o seguro menor.
                </li>
                <li>
                  <strong>Junte cartas:</strong> mandar várias no mesmo envio dilui o frete. Envio em grupo costuma ser
                  o mais barato pra quem mora no Brasil.
                </li>
                <li>
                  <strong>Guarde os comprovantes:</strong> nota da PSA e do frete ajudam se a Receita cobrar imposto na
                  volta.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className={base.footer}>
        <div className={base.footerInner}>
          <span className={base.logo}>
            <span className={base.logoMark} aria-hidden="true" />
            slabbit
          </span>
          <p>
            Slabbit é um projeto independente e não tem relação com Nintendo, Creatures, GAME FREAK, The Pokémon
            Company ou PSA. As simulações são estimativas e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}