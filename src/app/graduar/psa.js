// Regras e números de referência do simulador de graduação.
// Tudo que é estimativa está aqui, num lugar só, pra você ajustar fácil.

// Níveis da PSA (preço por carta em US$, valor máximo declarado em US$, prazo em dias úteis).
// Referência 2026. Os níveis "Value" às vezes ficam pausados: confira em psacard.com.
export const NIVEIS_PSA = [
  // Lote: mais barato por carta, mas exige assinatura do Collector's Club e várias cartas no mesmo envio.
  { id: "value-bulk", nome: "Value Bulk (lote)", precoUsd: 24.99, maxUsd: 500, dias: 95, lote: true },
  { id: "value", nome: "Value", precoUsd: 32.99, maxUsd: 500, dias: 75 },
  { id: "value-plus", nome: "Value Plus", precoUsd: 49.99, maxUsd: 500, dias: 45 },
  { id: "value-max", nome: "Value Max", precoUsd: 64.99, maxUsd: 1000, dias: 30 },
  { id: "regular", nome: "Regular", precoUsd: 79.99, maxUsd: 1500, dias: 75 },
  { id: "express", nome: "Express", precoUsd: 149, maxUsd: 2500, dias: 25 },
  { id: "super-express", nome: "Super Express", precoUsd: 349, maxUsd: 5000, dias: 12 },
  { id: "walk-through", nome: "Walk Through", precoUsd: 599, maxUsd: 10000, dias: 8 },
];

// Frete ida e volta com seguro, por carta (R$). Valores de referência: a pessoa pode editar.
export const FRETE_PADRAO = {
  grupo: 90, // dividido num envio em grupo / intermediário
  sozinho: 400, // pacote próprio com rastreio e seguro
};

// Checklist de estado. "pen" = quanto cada resposta pesa contra a nota.
export const CHECKLIST = [
  {
    id: "centro",
    titulo: "Centralização",
    ajuda: "Olhe a borda amarela da frente: os dois lados têm a mesma largura? A PSA exige uns 55/45 pra dar 10.",
    opcoes: [
      { id: "ok", rotulo: "Bem centralizada", pen: 0 },
      { id: "leve", rotulo: "Um pouco torta", pen: 1.5 },
      { id: "torta", rotulo: "Visivelmente torta", pen: 3, sem10: true },
    ],
  },
  {
    id: "cantos",
    titulo: "Cantos",
    ajuda: "Os quatro cantos estão pontudos, sem branco nem amassado?",
    opcoes: [
      { id: "ok", rotulo: "Perfeitos", pen: 0 },
      { id: "leve", rotulo: "Um pouco gastos", pen: 1 },
      { id: "ruim", rotulo: "Gastos ou amassados", pen: 2.5 },
    ],
  },
  {
    id: "bordas",
    titulo: "Bordas do verso",
    ajuda: "Vire a carta: aparecem pontinhos brancos na borda azul?",
    opcoes: [
      { id: "ok", rotulo: "Sem branco", pen: 0 },
      { id: "leve", rotulo: "Alguns pontinhos", pen: 1 },
      { id: "ruim", rotulo: "Branco visível", pen: 2.5 },
    ],
  },
  {
    id: "superficie",
    titulo: "Superfície",
    ajuda: "Incline a carta contra a luz: tem risco, marca de dedo ou linha no holo?",
    opcoes: [
      { id: "ok", rotulo: "Limpa", pen: 0 },
      { id: "leve", rotulo: "Risquinhos só na luz", pen: 1 },
      { id: "ruim", rotulo: "Risco ou marca visível", pen: 2.5 },
    ],
  },
];

// Chance de cada nota [PSA 10, PSA 9, PSA 8, 7 ou menos] pelo total de pontos contra.
// Estimativa aproximada para calibrar com dados reais no futuro.
const TABELA_CHANCES = [
  [0.45, 0.4, 0.12, 0.03],
  [0.25, 0.45, 0.22, 0.08],
  [0.12, 0.4, 0.32, 0.16],
  [0.05, 0.3, 0.38, 0.27],
  [0.02, 0.15, 0.35, 0.48],
];

export function estimarChances(respostas) {
  let pen = 0;
  let sem10 = false;
  for (const item of CHECKLIST) {
    const op = item.opcoes.find((o) => o.id === respostas[item.id]) ?? item.opcoes[0];
    pen += op.pen;
    if (op.sem10) sem10 = true;
  }
  const linha = Math.min(TABELA_CHANCES.length - 1, Math.round(pen));
  const [p10, p9, p8, p7] = TABELA_CHANCES[linha];
  // Carta torta quase nunca tira 10: a chance do 10 passa pro 9.
  if (sem10) return [0.01, p9 + p10 - 0.01, p8, p7];
  return [p10, p9, p8, p7];
}

/** Menor nível da PSA que cobre o valor da carta graduada (evita cobrança extra). */
export function nivelAutomatico(valorUsd) {
  // O automático não escolhe o lote, porque ele exige assinatura e várias cartas.
  return NIVEIS_PSA.find((n) => !n.lote && valorUsd <= n.maxUsd) ?? NIVEIS_PSA[NIVEIS_PSA.length - 1];
}

/** Dias úteis → data aproximada de volta (soma ~2 semanas de envio e alfândega). */
export function dataDeVolta(diasUteis, hoje = new Date()) {
  const dias = Math.round(diasUteis * 1.4) + 14;
  const d = new Date(hoje);
  d.setDate(d.getDate() + dias);
  return d;
}