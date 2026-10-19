// src/app/assinar/actions.js
// Começa a assinatura do Pro.
// PENDENTE: ligar um gateway (Mercado Pago, Stripe, Pagar.me...). O certo é mandar a pessoa
// pra página de pagamento do gateway e, quando ele confirmar (webhook), gravar
// plano = 'pro' e pro_ate no banco. Dados de cartão NUNCA passam pelo nosso servidor.
"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "../../lib/auth";

export async function iniciarAssinatura(formData) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/assinar");

  const periodo = formData.get("periodo") === "anual" ? "anual" : "mensal";
  const metodo = formData.get("metodo") === "cartao" ? "cartao" : "pix";

  // Aqui entra a criação do pagamento no gateway, ex.:
  // const { url } = await criarCheckout({ usuarioId: usuario.id, periodo, metodo });
  // redirect(url);
  console.info("[slabbit] assinatura pedida, gateway ainda não ligado:", usuario.id, periodo, metodo);
  redirect(
    `/assinar?periodo=${periodo}&metodo=${metodo}&erro=${encodeURIComponent(
      "O pagamento online ainda não está disponível. Volte em breve.",
    )}`,
  );
}
