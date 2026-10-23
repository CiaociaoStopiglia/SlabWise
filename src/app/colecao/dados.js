// app/colecao/dados.js
// Lê a coleção do banco e soma os números (valor, quanto pagou, resultado).
// Fica separado da página pra cada parte da tela só receber o que precisa.
import { query } from "../../lib/db";
import { buscarCartaPorId, cotacaoDoDia } from "../../lib/tcgdex";

export const LIMITE_GRATIS = 100;

export async function carregarColecao(usuarioId) {
  let itens = [];
  let bancoFora = false;
  try {
    const { rows } = await query(
      `select id, carta_id, quantidade, estado, graduacao, preco_pago::float8 as preco_pago
         from colecao where usuario_id = $1 order by adicionada_em desc`,
      [usuarioId],
    );
    itens = rows;
  } catch (e) {
    console.error("[slabbit] erro ao ler a coleção:", e.message);
    bancoFora = true;
  }

  // Preço atual de cada carta diferente (a TCGdex fica em cache no servidor).
  const cotacao = await cotacaoDoDia();
  const ids = [...new Set(itens.map((i) => i.carta_id))];
  const lista = await Promise.all(ids.map((id) => buscarCartaPorId(id, cotacao)));
  const cartas = Object.fromEntries(ids.map((id, n) => [id, lista[n]]));

  let valorTotal = 0;
  let totalCartas = 0;
  let semPreco = 0;
  let investido = 0; // só das cartas que têm preço pago E preço de hoje
  let valorDasComPago = 0;
  for (const i of itens) {
    totalCartas += i.quantidade;
    const preco = cartas[i.carta_id]?.preco?.valor;
    if (preco) valorTotal += preco * i.quantidade;
    else semPreco += 1;
    if (i.preco_pago !== null && preco) {
      investido += i.preco_pago * i.quantidade;
      valorDasComPago += preco * i.quantidade;
    }
  }
  const resultado = investido > 0 ? valorDasComPago - investido : null;
  const resultadoPct = resultado !== null ? (resultado / investido) * 100 : null;

  return {
    itens,
    cartas,
    bancoFora,
    resumo: { valorTotal, investido, totalCartas, distintas: itens.length, semPreco, resultado, resultadoPct },
  };
}
