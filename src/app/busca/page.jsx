// app/busca/page.jsx
// Página de busca de cartas (endereço: /busca?q=...)

import Link from "next/link";
import Image from "next/image";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { pesquisarCartas, formatarReais } from "../../lib/tcgdex";
import Cabecalho from "../../components/Cabecalho";
import base from "../page.module.css"; // cores, rodapé e tiles da home
import styles from "./busca.module.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const sugestoes = ["Charizard", "Umbreon", "Pikachu", "Gengar", "Mewtwo", "Rayquaza"];

const ORDENS = {
  maior: { rotulo: "Maior preço", ordenar: (a, b) => (b.preco?.valor ?? -1) - (a.preco?.valor ?? -1) },
  menor: {
    rotulo: "Menor preço",
    ordenar: (a, b) => (a.preco?.valor ?? Infinity) - (b.preco?.valor ?? Infinity),
  },
  nome: { rotulo: "Nome", ordenar: (a, b) => a.name.localeCompare(b.name, "pt-BR") },
};

export async function generateMetadata({ searchParams }) {
  const { q = "" } = await searchParams;
  return { title: q ? `${q} · preço em real | Slabbit` : "Buscar carta | Slabbit" };
}

function Variacao({ valor }) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  const subiu = valor >= 0;
  return (
    <span className={subiu ? styles.alta : styles.baixa}>
      {subiu ? "▲" : "▼"} {Math.abs(valor).toFixed(0)}% em 30 dias
    </span>
  );
}

export default async function Busca({ searchParams }) {
  const { q = "", ordem = "maior" } = await searchParams;
  const termo = q.trim();
  const ordemAtual = ORDENS[ordem] ? ordem : "maior";

  const { cartas, total, erro } = termo
    ? await pesquisarCartas(termo)
    : { cartas: [], total: 0, erro: false };

  const ordenadas = [...cartas].sort(ORDENS[ordemAtual].ordenar);
  const link = (o) => `/busca?q=${encodeURIComponent(termo)}&ordem=${o}`;

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho ativo="busca" />

      <main>
        {/* Faixa de busca */}
        <section className={styles.band}>
          <div className={styles.bandInner}>
            <h1 className={styles.title}>{termo ? <>Preço de “{termo}”</> : "Buscar carta"}</h1>
            <form action="/busca" method="get" className={`${base.search} ${styles.searchWide}`} role="search">
              <label htmlFor="busca" className={base.srOnly}>
                Nome ou número da carta
              </label>
              <input
                id="busca"
                name="q"
                type="search"
                defaultValue={termo}
                placeholder="Ex.: Charizard ex 199/165"
                autoComplete="off"
                className={base.searchInput}
              />
              <button type="submit" className={base.searchButton}>
                Ver preço
              </button>
            </form>
            <p className={styles.hint}>
              Dica: use o nome em inglês e, se souber, o número que fica no canto da carta (ex.: 161/131).
            </p>
          </div>
        </section>

        <section className={styles.results}>
          <div className={styles.resultsInner}>
            {/* Sem busca ainda */}
            {!termo && (
              <div className={styles.state}>
                <h2>Qual carta você quer avaliar?</h2>
                <p>Digite o nome acima ou comece por uma das mais procuradas:</p>
                <ul className={styles.chips}>
                  {sugestoes.map((s) => (
                    <li key={s}>
                      <Link href={`/busca?q=${encodeURIComponent(s)}`}>{s}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* API fora do ar */}
            {termo && erro && (
              <div className={`${styles.state} ${styles.stateError}`}>
                <h2>Não conseguimos consultar as cartas agora</h2>
                <p>A base de preços não respondeu. Tente de novo em alguns segundos.</p>
                <Link href={`/busca?q=${encodeURIComponent(termo)}`} className={base.buttonDark}>
                  Tentar de novo
                </Link>
              </div>
            )}

            {/* Nada encontrado */}
            {termo && !erro && total === 0 && (
              <div className={styles.state}>
                <h2>Nenhuma carta encontrada para “{termo}”</h2>
                <p>
                  Confira a grafia e tente o nome em inglês (ex.: “Charizard”, “Umbreon”). Se colocou o número, tente
                  buscar só pelo nome.
                </p>
                <ul className={styles.chips}>
                  {sugestoes.map((s) => (
                    <li key={s}>
                      <Link href={`/busca?q=${encodeURIComponent(s)}`}>{s}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resultados */}
            {termo && !erro && total > 0 && (
              <>
                <div className={styles.toolbar}>
                  <p className={styles.count}>
                    {total > cartas.length
                      ? `Mostrando ${cartas.length} de ${total} cartas`
                      : `${total} ${total === 1 ? "carta encontrada" : "cartas encontradas"}`}
                  </p>
                  <nav className={styles.sort} aria-label="Ordenar resultados">
                    <span>Ordenar:</span>
                    {Object.entries(ORDENS).map(([chave, { rotulo }]) => (
                      <Link
                        key={chave}
                        href={link(chave)}
                        className={chave === ordemAtual ? styles.sortActive : undefined}
                        aria-current={chave === ordemAtual ? "true" : undefined}
                      >
                        {rotulo}
                      </Link>
                    ))}
                  </nav>
                </div>

                <ul className={base.cardStrip}>
                  {ordenadas.map((c) => (
                    <li key={c.id}>
                      <article className={`${base.cardTile} ${styles.tile}`}>
                        <Image
                          src={c.images.small}
                          alt={`Carta ${c.name}${c.set ? ` · ${c.set}` : ""} ${c.number}`}
                          width={245}
                          height={337}
                          className={base.cardTileImage}
                        />
                        <strong>{c.name}</strong>
                        <span className={base.tileSet}>
                          {c.set ? `${c.set} · ` : ""}#{c.number}
                        </span>
                        {c.rarity && <span className={styles.rarity}>{c.rarity}</span>}
                        <div className={styles.priceRow}>
                          {c.preco ? (
                            <>
                              <span className={base.tilePrice}>{formatarReais(c.preco.valor)}</span>
                              <Variacao valor={c.preco.variacao30} />
                            </>
                          ) : (
                            <span className={styles.noPrice}>Sem preço no momento</span>
                          )}
                        </div>
                        <Link href={`/graduar?carta=${encodeURIComponent(c.id)}`} className={styles.simLink}>
                          Vale graduar? →
                        </Link>
                      </article>
                    </li>
                  ))}
                </ul>

                {total > cartas.length && (
                  <p className={styles.more}>
                    Não achou a sua? Coloque o número da carta na busca, como “{termo} 4/102”.
                  </p>
                )}

                <p className={base.sourceNote}>
                  Preço de carta sem graduar em estado Near Mint, com dados da TCGplayer e da Cardmarket (via TCGdex),
                  convertidos pela cotação do dia. Não é recomendação de investimento.
                </p>
              </>
            )}
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
            Slabbit é um projeto independente e não tem relação com Nintendo, Creatures, GAME FREAK ou The Pokémon
            Company. Os preços são estimativas de mercado e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}