// lib/valores.js
// Lê valores em real digitados pela pessoa.
// "1.234,56" ou "1234.56" → 1234.56. Vazio ou inválido → null.
/**
 * Limpa o que a pessoa digita num campo de dinheiro: só ficam números,
 * ponto (milhar) e uma vírgula (centavos), com no máximo 2 casas depois dela.
 * "R$ 1.2a3,456" → "1.23,45"
 */
export function soDinheiro(texto) {
  let s = String(texto ?? "").replace(/[^\d.,]/g, "");
  const virgula = s.indexOf(",");
  if (virgula !== -1) {
    const depois = s.slice(virgula + 1).replace(/[.,]/g, "").slice(0, 2);
    s = `${s.slice(0, virgula)},${depois}`;
  }
  return s.slice(0, 13);
}

export function lerValor(texto) {
  const limpo = String(texto ?? "")
    .trim()
    .replace(/[R$\s]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? n : null;
}
