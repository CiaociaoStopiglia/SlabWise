// app/carta-offline/[id]/[arquivo]/route.js
// "Foto" das cartas no modo offline (CARTAS_OFFLINE=1): um desenho SVG com nome,
// coleção e número, na cor do tipo. Responde em /carta-offline/base1-4/low.webp,
// o mesmo formato de endereço das imagens da TCGdex.
import { cartaOffline } from "../../../../lib/cartasOffline";

const CORES = {
  Grass: "#7dc95e",
  Fire: "#f08a4b",
  Water: "#5aa9e6",
  Lightning: "#f5d33f",
  Psychic: "#c77dd8",
  Fighting: "#c9774f",
  Darkness: "#5b5873",
  Metal: "#a7adb5",
  Dragon: "#c9a43b",
  Fairy: "#f29ac3",
  Colorless: "#d9d4c4",
};

// Tira os caracteres que quebrariam o SVG (&, <, >, aspas).
const texto = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function GET(_req, { params }) {
  const { id } = await params;
  const c = cartaOffline(id);
  const cor = CORES[c?.types?.[0]] ?? "#e8e2cf";
  const nome = texto(c?.name ?? "Carta");
  const set = texto(c ? `${c.set.name} · ${c.localId}/${c.set.cardCount.official}` : id);
  const hp = c?.hp ? `HP ${c.hp}` : "";
  const inicial = texto((c?.name ?? "?")[0]);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="245" height="337" viewBox="0 0 245 337">
  <rect x="2" y="2" width="241" height="333" rx="12" fill="${cor}" stroke="#1d1b16" stroke-width="4"/>
  <text x="16" y="34" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#1d1b16">${nome}</text>
  <text x="229" y="34" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#1d1b16">${hp}</text>
  <rect x="16" y="46" width="213" height="150" rx="6" fill="#fbfaf5" stroke="#1d1b16" stroke-width="2"/>
  <text x="122.5" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="900" fill="${cor}" stroke="#1d1b16" stroke-width="2">${inicial}</text>
  <rect x="16" y="212" width="213" height="62" rx="6" fill="#fbfaf5" fill-opacity="0.55"/>
  <text x="122.5" y="240" text-anchor="middle" font-family="Courier New, monospace" font-size="12" font-weight="700" fill="#1d1b16">MODO OFFLINE</text>
  <text x="122.5" y="260" text-anchor="middle" font-family="Courier New, monospace" font-size="10" fill="#1d1b16">foto indisponível nesta rede</text>
  <text x="16" y="318" font-family="Arial, sans-serif" font-size="11" fill="#1d1b16">${set}</text>
</svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
