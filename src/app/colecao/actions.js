// src/app/colecao/actions.js
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "../../lib/db";
import { usuarioAtual } from "../../lib/auth";
import { ESTADOS, GRADUACOES } from "./opcoes";

// Volta pra coleção com um aviso na URL (a página mostra e some no próximo clique).
function voltar(aviso, tipo = "ok", destino = "/colecao") {
  const sep = destino.includes("?") ? "&" : "?";
  redirect(`${destino}${sep}${tipo}=${encodeURIComponent(aviso)}`);
}

// Só volta pra páginas do próprio site: a coleção ou a página de uma carta.
function destinoSeguro(formData) {
  const para = String(formData.get("voltar") ?? "");
  return /^\/(colecao|carta\/[\w.%-]+)$/.test(para) ? para : "/colecao";
}

async function exigirLogin() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/colecao");
  return usuario;
}

// "1.234,56" ou "1234.56" → 1234.56. Vazio ou inválido → null.
function lerValor(texto) {
  const limpo = String(texto ?? "")
    .trim()
    .replace(/[R$\s]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? n : null;
}

export async function adicionarCarta(formData) {
  const usuario = await exigirLogin();
  const destino = destinoSeguro(formData);

  const cartaId = String(formData.get("carta_id") ?? "").trim();
  const graduacaoBruta = String(formData.get("graduacao") ?? "");
  const graduacao = GRADUACOES.includes(graduacaoBruta) ? graduacaoBruta : null;
  // Carta graduada já tem nota; o estado só vale pra carta sem graduar.
  const estadoBruto = String(formData.get("estado") ?? "NM");
  const estado = graduacao || !(estadoBruto in ESTADOS) ? "NM" : estadoBruto;
  const quantidade = Math.min(
    999,
    Math.max(1, Math.floor(Number(formData.get("quantidade"))) || 1),
  );
  const precoPago = lerValor(formData.get("preco_pago"));

  if (!cartaId || cartaId.length > 40)
    voltar("Não achamos essa carta. Busque de novo.", "erro", destino);

  try {
    // Já tem a mesma carta (mesmo estado e graduação)? Soma a quantidade.
    const { rowCount } = await query(
      `update colecao
          set quantidade = least(999, quantidade + $5),
              preco_pago = coalesce($6, preco_pago)
        where usuario_id = $1 and carta_id = $2 and estado = $3
          and graduacao is not distinct from $4`,
      [usuario.id, cartaId, estado, graduacao, quantidade, precoPago],
    );
    if (rowCount === 0) {
      await query(
        `insert into colecao (usuario_id, carta_id, quantidade, estado, graduacao, preco_pago)
         values ($1, $2, $3, $4, $5, $6)`,
        [usuario.id, cartaId, quantidade, estado, graduacao, precoPago],
      );
    }
  } catch (erro) {
    if (String(erro.message).includes("LIMITE_GRATIS")) {
      voltar(
        "O plano grátis guarda até 100 cartas. Remova alguma ou assine o Pro.",
        "erro",
        destino,
      );
    }
    console.error("[slabbit] erro ao adicionar carta:", erro.message);
    voltar("Não conseguimos salvar a carta agora. Tente de novo.", "erro", destino);
  }

  revalidatePath("/colecao");
  voltar("Carta adicionada à sua coleção.", "ok", destino);
}

export async function atualizarQuantidade(formData) {
  const usuario = await exigirLogin();
  const id = Number(formData.get("id"));
  const quantidade = Math.floor(Number(formData.get("quantidade")));
  if (
    !Number.isInteger(id) ||
    !Number.isInteger(quantidade) ||
    quantidade < 1 ||
    quantidade > 999
  ) {
    voltar("Quantidade inválida. Use um número de 1 a 999.", "erro");
  }

  try {
    await query(
      "update colecao set quantidade = $3 where id = $1 and usuario_id = $2",
      [id, usuario.id, quantidade],
    );
  } catch (erro) {
    console.error("[slabbit] erro ao atualizar quantidade:", erro.message);
    voltar("Não conseguimos atualizar agora. Tente de novo.", "erro");
  }
  revalidatePath("/colecao");
  redirect("/colecao");
}

export async function removerCarta(formData) {
  const usuario = await exigirLogin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/colecao");

  try {
    await query("delete from colecao where id = $1 and usuario_id = $2", [
      id,
      usuario.id,
    ]);
  } catch (erro) {
    console.error("[slabbit] erro ao remover carta:", erro.message);
    voltar("Não conseguimos remover agora. Tente de novo.", "erro");
  }
  revalidatePath("/colecao");
  voltar("Carta removida.");
}
