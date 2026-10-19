// lib/historico.js
// Histórico de preço das cartas e do valor da coleção.
// A TCGdex só sabe o preço de hoje, então a gente guarda uma "foto" por dia no banco:
// - o preço da carta, toda vez que alguém abre a página dela;
// - o valor da coleção, toda vez que a pessoa abre a coleção.
// Tudo aqui falha em silêncio: sem banco, a página só fica sem gráfico.
import { query } from "./db";

// Períodos do gráfico. O Grátis vê só 30 dias; o resto é do Pro.
export const PERIODOS = [
  { id: "30d", rotulo: "30 dias", dias: 30, pro: false },
  { id: "6m", rotulo: "6 meses", dias: 183, pro: true },
  { id: "1a", rotulo: "1 ano", dias: 365, pro: true },
  { id: "tudo", rotulo: "Tudo", dias: null, pro: true },
];

export const escolherPeriodo = (id) => PERIODOS.find((p) => p.id === id) ?? PERIODOS[0];

/** Guarda o preço de hoje da carta (se já tem foto de hoje, só atualiza). */
export async function registrarPreco(cartaId, valor) {
  if (!cartaId || !Number.isFinite(valor) || valor < 0) return;
  try {
    await query(
      `insert into historico_precos (carta_id, valor) values ($1, $2)
       on conflict (carta_id, dia) do update set valor = excluded.valor`,
      [cartaId, valor],
    );
  } catch (erro) {
    console.error("[slabbit] erro ao guardar o preço do dia:", erro.message);
  }
}

/** Preço por dia da carta. dias = null traz tudo. Devolve null se o banco falhar. */
export async function historicoDaCarta(cartaId, dias) {
  try {
    const { rows } = await query(
      `select dia::text as dia, valor::float8 as valor
         from historico_precos
        where carta_id = $1 and ($2::int is null or dia > current_date - $2::int)
        order by dia`,
      [cartaId, dias],
    );
    return rows;
  } catch (erro) {
    console.error("[slabbit] erro ao ler o histórico da carta:", erro.message);
    return null;
  }
}

/** Guarda o valor de hoje da coleção e quanto a pessoa pagou nas cartas. */
export async function registrarValorColecao(usuarioId, valor, investido) {
  if (!usuarioId || !Number.isFinite(valor)) return;
  try {
    await query(
      `insert into valor_colecao (usuario_id, valor, investido) values ($1, $2, $3)
       on conflict (usuario_id, dia) do update set valor = excluded.valor, investido = excluded.investido`,
      [usuarioId, Math.max(0, valor), Math.max(0, investido || 0)],
    );
  } catch (erro) {
    console.error("[slabbit] erro ao guardar o valor da coleção:", erro.message);
  }
}

/** Valor da coleção por dia. dias = null traz tudo. Devolve null se o banco falhar. */
export async function historicoDaColecao(usuarioId, dias) {
  try {
    const { rows } = await query(
      `select dia::text as dia, valor::float8 as valor, investido::float8 as investido
         from valor_colecao
        where usuario_id = $1 and ($2::int is null or dia > current_date - $2::int)
        order by dia`,
      [usuarioId, dias],
    );
    return rows;
  } catch (erro) {
    console.error("[slabbit] erro ao ler o histórico da coleção:", erro.message);
    return null;
  }
}
