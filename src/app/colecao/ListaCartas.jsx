// app/colecao/ListaCartas.jsx
// "Suas cartas": barra com a contagem e a ordenação, e a grade de cards
// (foto, estado, valor, lucro, quantidade e remover).
import Link from "next/link";
import Image from "next/image";
import { formatarReais } from "../../lib/tcgdex";
import CartaBrilhante from "../../components/CartaBrilhante";
import { atualizarQuantidade } from "./actions";
import RemoverCarta from "./RemoverCarta";
import { ESTADOS } from "./opcoes";
import base from "../page.module.css";
import styles from "./colecao.module.css";

export const ORDENS = {
  valor: "Maior valor",
  recentes: "Recentes",
  nome: "Nome",
};

/** Ordena as cartas da coleção. "recentes" é a ordem que vem do banco. */
export function ordenarCartas(itens, cartas, ordem) {
  const lista = [...itens];
  const valorDe = (i) => (cartas[i.carta_id]?.preco?.valor ?? -1) * i.quantidade;
  if (ordem === "valor") lista.sort((a, b) => valorDe(b) - valorDe(a));
  if (ordem === "nome") {
    lista.sort((a, b) => (cartas[a.carta_id]?.name ?? "").localeCompare(cartas[b.carta_id]?.name ?? "", "pt-BR"));
  }
  return lista;
}

export default function ListaCartas({ itens, cartas, ordem, totalCartas, linkOrdem }) {
  return (
    <section className={styles.bloco} aria-labelledby="suas-cartas">
      <div className={styles.barraCartas}>
        <h2 id="suas-cartas" className={styles.h2}>
          Suas cartas <span className={styles.contagem}>{totalCartas}</span>
        </h2>
        <nav className={styles.ordem} aria-label="Ordenar cartas">
          {Object.entries(ORDENS).map(([id, rotulo]) => (
            <Link key={id} href={linkOrdem(id)} scroll={false} aria-current={id === ordem ? "true" : undefined}>
              {rotulo}
            </Link>
          ))}
        </nav>
      </div>

      {itens.length > 0 && (
        <ul className={base.cardStrip}>
          {itens.map((i, n) => {
            const c = cartas[i.carta_id];
            const unit = c?.preco?.valor;
            const lucro =
              unit && i.preco_pago !== null
                ? (unit - i.preco_pago) * i.quantidade
                : null;
            return (
              <li key={i.id} className={base.entra} style={{ "--i": n }}>
                <article className={`${base.cardTile} ${styles.tile}`}>
                  <Link href={`/carta/${encodeURIComponent(i.carta_id)}`} className={styles.fotoLink}>
                  {c ? (
                    <CartaBrilhante valor={c.preco?.valor} className={base.cardTileImage}>
                      <Image
                        src={c.images.small}
                        alt={`Carta ${c.name}`}
                        width={245}
                        height={337}
                        className={base.cardTileImage}
                      />
                    </CartaBrilhante>
                  ) : (
                    <div className={styles.semFoto}>
                      Foto indisponível
                    </div>
                  )}
                  <strong>{c?.name ?? i.carta_id}</strong>
                  </Link>
                  {c && (
                    <span className={base.tileSet}>
                      {c.set ? `${c.set} · ` : ""}#{c.number}
                    </span>
                  )}
                  {/* Estado (ou nota PSA) numa etiqueta curta: "NM", "PSA 10" */}
                  <span className={styles.tag} title={i.graduacao ?? ESTADOS[i.estado]}>
                    {i.graduacao ?? i.estado}
                  </span>

                  {/* Valor total da linha; o lucro só aparece se a pessoa contou quanto pagou */}
                  <div className={styles.valores}>
                    {unit ? (
                      <span className={base.tilePrice}>
                        {formatarReais(unit * i.quantidade)}
                      </span>
                    ) : (
                      <span className={styles.muted}>Sem preço</span>
                    )}
                    {lucro !== null && (
                      <span
                        className={lucro >= 0 ? styles.alta : styles.baixa}
                        title={`Você pagou ${formatarReais(i.preco_pago)} cada`}
                      >
                        {lucro >= 0 ? "▲ +" : "▼ −"}
                        {formatarReais(Math.abs(lucro))}
                      </span>
                    )}
                  </div>

                  {/* Rodapé: − quantidade + e o X de remover. Cada botão manda a quantidade nova. */}
                  <div className={styles.rodape}>
                    <form action={atualizarQuantidade} className={styles.qtd}>
                      <input type="hidden" name="id" value={i.id} />
                      <button
                        type="submit"
                        name="quantidade"
                        value={i.quantidade - 1}
                        disabled={i.quantidade <= 1}
                        aria-label="Tirar uma"
                      >
                        −
                      </button>
                      <span title="Quantidade">{i.quantidade}×</span>
                      <button
                        type="submit"
                        name="quantidade"
                        value={i.quantidade + 1}
                        disabled={i.quantidade >= 999}
                        aria-label="Adicionar mais uma"
                      >
                        +
                      </button>
                    </form>
                    <RemoverCarta
                      id={i.id}
                      nome={c?.name ?? "Carta"}
                      detalhe={c ? `${c.set ? `${c.set} · ` : ""}#${c.number} · ${i.graduacao ?? i.estado}` : null}
                      imagem={c?.images.small}
                      quantidade={i.quantidade}
                      temPrecoPago={i.preco_pago !== null}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.notaFonte}>
        Valor pelo preço de carta sem graduar em Near Mint (TCGplayer e Cardmarket, via TCGdex), na cotação do dia.
        Cartas graduadas e em outros estados costumam valer diferente.
      </p>
    </section>
  );
}
