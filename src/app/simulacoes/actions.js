// src/app/simulacoes/actions.js
// Salvar e apagar simulações do "Vale graduar?".
// Simular é grátis pra todo mundo; salvar é do Pro.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "../../lib/db";
import { usuarioAtual } from "../../lib/auth";

const VEREDITOS = ["vale", "so10", "nao"];

function voltar(destino, aviso, tipo = "ok") {
  const sep = destino.includes("?") ? "&" : "?";
  redirect(`${destino}${sep}${tipo}=${encodeURIComponent(aviso)}`);
}

export async function salvarSimulacao(formData) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/graduar");
  if (usuario.plano !== "pro") voltar("/simulacoes", "Salvar simulações é do plano Pro.", "erro");

  // Os números vêm da calculadora como JSON. Limitamos o tamanho pra ninguém mandar um arquivo gigante.
  const bruto = String(formData.get("dados") ?? "");
  let dados;
  try {
    dados = bruto.length <= 5000 ? JSON.parse(bruto) : null;
  } catch {
    dados = null;
  }
  if (!dados || typeof dados !== "object") voltar("/graduar", "Não conseguimos ler a simulação.", "erro");

  const cartaId = String(formData.get("carta_id") ?? "").trim().slice(0, 40) || null;
  const veredito = VEREDITOS.includes(formData.get("veredito")) ? formData.get("veredito") : null;

  try {
    await query("insert into simulacoes (usuario_id, carta_id, dados, veredito) values ($1, $2, $3, $4)", [
      usuario.id,
      cartaId,
      JSON.stringify(dados),
      veredito,
    ]);
  } catch (erro) {
    console.error("[slabbit] erro ao salvar simulação:", erro.message);
    voltar("/simulacoes", "Não conseguimos salvar a simulação agora. Tente de novo.", "erro");
  }
  revalidatePath("/simulacoes");
  voltar("/simulacoes", "Simulação salva.");
}

export async function removerSimulacao(formData) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/simulacoes");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/simulacoes");
  try {
    await query("delete from simulacoes where id = $1 and usuario_id = $2", [id, usuario.id]);
  } catch (erro) {
    console.error("[slabbit] erro ao apagar simulação:", erro.message);
    voltar("/simulacoes", "Não conseguimos apagar agora.", "erro");
  }
  revalidatePath("/simulacoes");
  voltar("/simulacoes", "Simulação apagada.");
}
