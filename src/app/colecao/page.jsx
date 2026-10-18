// app/colecao/page.jsx
// Minha coleção (endereço: /colecao). Só pra quem tá logado.

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { usuarioAtual } from "../../lib/auth";
import { query } from "../../lib/db";
import {
  buscarCartaPorId,
  cotacaoDoDia,
  formatarReais,
  pesquisarCartas,
} from "../../lib/tcgdex";
import Cabecalho from "../../components/Cabecalho";
import { adicionarCarta, atualizarQuantidade, removerCarta } from "./actions";
import { ESTADOS, GRADUACOES } from "./opcoes";
import base from "../page.module.css";
import styles from "./colecao.module.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = { title: "Minha coleção | Slabbit" };

const LIMITE_GRATIS = 100;

function FormularioAdicionar({ carta }) {
  return (
    <details className={styles.add}>
      <summary>Adicionar à coleção</summary>
      <form action={adicionarCarta} className={styles.addForm}>
        <input type="hidden" name="carta_id" value={carta.id} />
        <label>
          Quantidade
          <input
            name="quantidade"
            type="number"
            min="1"
            max="999"
            defaultValue="1"
          />
        </label>
        <label>
          Estado
          <select name="estado" defaultValue="NM">
            {Object.entries(ESTADOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Graduada?
          <select name="graduacao" defaultValue="">
            <option value="">Não, sem graduar</option>
            {GRADUACOES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quanto pagou (R$)
          <input
            name="preco_pago"
            inputMode="decimal"
            placeholder="Opcional"
            autoComplete="off"
          />
        </label>
        <button type="submit" className={base.buttonDark}>
          Salvar
        </button>
      </form>
    </details>
  );
}

export default async function Colecao({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/colecao");

  const { q = "", ok = "", erro = "" } = await searchParams;
  const termo = q.trim();

  let itens = [];
  let bancoFora = false;
  try {
    const { rows } = await query(
      `select id, carta_id, quantidade, estado, graduacao, preco_pago::float8 as preco_pago
         from colecao where usuario_id = $1 order by adicionada_em desc`,
      [usuario.id],
    );
    itens = rows;
  } catch (e) {
    console.error("[slabbit] erro ao ler a coleção:", e.message);
    bancoFora = true;
  }

  // Preço atual de cada carta diferente (a TCGdex fica em cache no servidor).
  const cotacao = await cotacaoDoDia();
  const ids = [...new Set(itens.map((i) => i.carta_id))];
  const cartasLista = await Promise.all(
    ids.map((id) => buscarCartaPorId(id, cotacao)),
  );
  const cartas = Object.fromEntries(ids.map((id, i) => [id, cartasLista[i]]));

  let valorTotal = 0;
  let investido = 0;
  let totalCartas = 0;
  let semPreco = 0;
  for (const i of itens) {
    totalCartas += i.quantidade;
    const preco = cartas[i.carta_id]?.preco?.valor;
    if (preco) valorTotal += preco * i.quantidade;
    else semPreco += 1;
    // Só entra no resultado o que tem preço pago e preço atual.
    if (i.preco_pago !== null && preco)
      investido += i.preco_pago * i.quantidade;
  }
  const comPago = itens.filter(
    (i) => i.preco_pago !== null && cartas[i.carta_id]?.preco,
  );
  const valorDosComPago = comPago.reduce(
    (s, i) => s + cartas[i.carta_id].preco.valor * i.quantidade,
    0,
  );
  const resultado = comPago.length ? valorDosComPago - investido : null;

  const busca = termo ? await pesquisarCartas(termo) : null;
  const gratis = usuario.plano !== "pro";

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho ativo="colecao" />

      <main>
        <section className={styles.band}>
          <div className={styles.bandInner}>
            <p className={base.eyebrow}>Minha coleção</p>
            <h1 className={styles.title}>Quanto vale a sua coleção hoje</h1>

            <dl className={styles.stats}>
              <div>
                <dt>Valor estimado</dt>
                <dd>{formatarReais(valorTotal)}</dd>
              </div>
              <div>
                <dt>Cartas</dt>
                <dd>{totalCartas}</dd>
              </div>
              <div>
                <dt>Resultado</dt>
                <dd
                  className={
                    resultado === null
                      ? undefined
                      : resultado >= 0
                        ? styles.alta
                        : styles.baixa
                  }
                >
                  {resultado === null
                    ? "—"
                    : `${resultado >= 0 ? "+" : "−"}${formatarReais(Math.abs(resultado))}`}
                </dd>
              </div>
              {gratis && (
                <div>
                  <dt>Plano grátis</dt>
                  <dd>
                    {itens.length}/{LIMITE_GRATIS}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {(ok || erro) && (
          <div className={styles.avisoWrap}>
            <p
              className={erro ? styles.avisoErro : styles.avisoOk}
              role={erro ? "alert" : "status"}
            >
              {erro || ok}
            </p>
          </div>
        )}

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>Adicionar carta</h2>
            <form
              action="/colecao"
              method="get"
              className={`${base.search} ${styles.searchWide}`}
              role="search"
            >
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
                Buscar
              </button>
            </form>

            {busca?.erro && (
              <p className={styles.muted}>
                Não conseguimos consultar as cartas agora. Tente de novo em
                instantes.
              </p>
            )}
            {busca && !busca.erro && busca.total === 0 && (
              <p className={styles.muted}>
                Nenhuma carta encontrada para “{termo}”. Tente o nome em inglês.
              </p>
            )}
            {busca && busca.cartas.length > 0 && (
              <>
                <p className={styles.count}>
                  {busca.total > busca.cartas.length
                    ? `Mostrando ${busca.cartas.length} de ${busca.total} cartas`
                    : `${busca.total} ${busca.total === 1 ? "carta" : "cartas"}`}
                </p>
                <ul className={base.cardStrip}>
                  {busca.cartas.map((c) => (
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
                        {c.preco && (
                          <span className={base.tilePrice}>
                            {formatarReais(c.preco.valor)}
                          </span>
                        )}
                        <FormularioAdicionar carta={c} />
                      </article>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionLista}`}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>Suas cartas</h2>

            {bancoFora && (
              <p className={styles.muted}>
                Não conseguimos abrir sua coleção agora. Tente de novo em alguns
                segundos.
              </p>
            )}

            {!bancoFora && itens.length === 0 && (
              <div className={styles.state}>
                <h3>Sua coleção está vazia</h3>
                <p>
                  Busque uma carta acima e clique em “Adicionar à coleção”. Leva
                  uns 10 segundos.
                </p>
                <ul className={styles.chips}>
                  {["Charizard", "Umbreon", "Pikachu", "Gengar"].map((s) => (
                    <li key={s}>
                      <Link href={`/colecao?q=${encodeURIComponent(s)}`}>
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {itens.length > 0 && (
              <ul className={base.cardStrip}>
                {itens.map((i) => {
                  const c = cartas[i.carta_id];
                  const unit = c?.preco?.valor;
                  const lucro =
                    unit && i.preco_pago !== null
                      ? (unit - i.preco_pago) * i.quantidade
                      : null;
                  return (
                    <li key={i.id}>
                      <article className={`${base.cardTile} ${styles.tile}`}>
                        {c ? (
                          <Image
                            src={c.images.small}
                            alt={`Carta ${c.name}`}
                            width={245}
                            height={337}
                            className={base.cardTileImage}
                          />
                        ) : (
                          <div className={styles.semFoto}>
                            Foto indisponível
                          </div>
                        )}
                        <strong>{c?.name ?? i.carta_id}</strong>
                        {c && (
                          <span className={base.tileSet}>
                            {c.set ? `${c.set} · ` : ""}#{c.number}
                          </span>
                        )}
                        <span className={styles.tag}>
                          {i.graduacao ?? ESTADOS[i.estado]}
                        </span>

                        <div className={styles.valores}>
                          {unit ? (
                            <>
                              <span className={base.tilePrice}>
                                {formatarReais(unit * i.quantidade)}
                              </span>
                              {i.quantidade > 1 && (
                                <span className={styles.muted}>
                                  {formatarReais(unit)} cada
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.muted}>
                              Sem preço no momento
                            </span>
                          )}
                          {i.preco_pago !== null && (
                            <span className={styles.muted}>
                              Pago: {formatarReais(i.preco_pago)} cada
                            </span>
                          )}
                          {lucro !== null && (
                            <span
                              className={
                                lucro >= 0 ? styles.alta : styles.baixa
                              }
                            >
                              {lucro >= 0 ? "▲ +" : "▼ −"}
                              {formatarReais(Math.abs(lucro))}
                            </span>
                          )}
                        </div>

                        <form
                          action={atualizarQuantidade}
                          className={styles.qtd}
                        >
                          <input type="hidden" name="id" value={i.id} />
                          <label>
                            Qtd.
                            <input
                              name="quantidade"
                              type="number"
                              min="1"
                              max="999"
                              defaultValue={i.quantidade}
                            />
                          </label>
                          <button type="submit">Atualizar</button>
                        </form>

                        <div className={styles.acoes}>
                          <Link
                            href={`/graduar?carta=${encodeURIComponent(i.carta_id)}`}
                          >
                            Vale graduar? →
                          </Link>
                          <form action={removerCarta}>
                            <input type="hidden" name="id" value={i.id} />
                            <button type="submit" className={styles.remover}>
                              Remover
                            </button>
                          </form>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}

            {itens.length > 0 && (
              <p className={base.sourceNote}>
                {semPreco > 0 &&
                  `${semPreco} ${semPreco === 1 ? "carta está" : "cartas estão"} sem preço e fora da soma. `}
                O valor usa o preço de carta sem graduar em Near Mint (TCGplayer
                e Cardmarket, via TCGdex) na cotação do dia. Cartas graduadas e
                em outros estados costumam valer diferente. Não é recomendação
                de investimento.
              </p>
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
            Slabbit é um projeto independente e não tem relação com Nintendo,
            Creatures, GAME FREAK ou The Pokémon Company. Os preços são
            estimativas de mercado e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
