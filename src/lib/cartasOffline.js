// lib/cartasOffline.js
// Cartas de mentira pra desenvolver sem internet (ou em rede que bloqueia a TCGdex).
// Liga com CARTAS_OFFLINE=1 no .env.local. O tcgdex.js então pede os dados pra cá
// em vez da API, e as respostas imitam o formato da TCGdex, então o resto do site
// funciona igual.
//
// Os nomes e ids são de cartas reais, mas os PREÇOS SÃO INVENTADOS (em dólar, como a TCGplayer).
// A "foto" é um desenho feito na hora pela rota /carta-offline.

// Endereço base das "fotos" (o tcgdex.js completa com /low.webp ou /high.webp).
export const IMAGENS_OFFLINE = "/carta-offline";

const SETS = {
  base1: { name: "Base Set", total: 102 },
  swsh7: { name: "Evolving Skies", total: 203 },
  swsh8: { name: "Fusion Strike", total: 264 },
  swsh12: { name: "Silver Tempest", total: 195 },
  sv01: { name: "Scarlet & Violet", total: 198 },
  "sv03.5": { name: "151", total: 165 },
  "sv04.5": { name: "Paldean Fates", total: 91 },
  "sv08.5": { name: "Prismatic Evolutions", total: 131 },
};

// Cartas escolhidas a dedo. [id, nome, raridade, hp, tipo, estágio, evolui de, ataque, custo, dano, preço em US$]
const LISTA = [
  ["base1-4", "Charizard", "Rare Holo", 120, "Fire", "Stage2", "Charmeleon", "Fire Spin", 4, "100", 420],
  ["base1-2", "Blastoise", "Rare Holo", 100, "Water", "Stage2", "Wartortle", "Hydro Pump", 3, "40+", 180],
  ["base1-15", "Venusaur", "Rare Holo", 100, "Grass", "Stage2", "Ivysaur", "Solarbeam", 4, "60", 150],
  ["base1-10", "Mewtwo", "Rare Holo", 60, "Psychic", "Basic", null, "Psychic", 2, "10+", 45],
  ["base1-58", "Pikachu", "Common", 40, "Lightning", "Basic", null, "Thunder Jolt", 2, "30", 6],
  ["swsh7-215", "Umbreon VMAX", "Rare Secret", 310, "Darkness", "VMAX", "Umbreon V", "Max Darkness", 3, "160", 1450],
  ["swsh7-218", "Rayquaza VMAX", "Rare Secret", 320, "Dragon", "VMAX", "Rayquaza V", "Max Burst", 2, "20+", 520],
  ["swsh8-271", "Gengar VMAX", "Rare Secret", 320, "Darkness", "VMAX", "Gengar V", "G-Max Swallow Up", 3, "250", 380],
  ["swsh12-186", "Lugia V", "Rare Ultra", 220, "Colorless", "Basic", null, "Aero Dive", 4, "130", 210],
  ["sv01-189", "Professor's Research", "Uncommon", null, null, null, null, null, 0, null, 0.3],
  ["sv03.5-199", "Charizard ex", "Special Illustration Rare", 330, "Fire", "Stage2", "Charmeleon", "Burning Darkness", 4, "180+", 260],
  ["sv03.5-6", "Charizard ex", "Double Rare", 330, "Fire", "Stage2", "Charmeleon", "Brave Wing", 1, "60+", 8],
  ["sv03.5-25", "Pikachu", "Common", 60, "Lightning", "Basic", null, "Thunder Shock", 2, "30", 1.2],
  ["sv03.5-94", "Gengar", "Rare", 130, "Psychic", "Stage2", "Haunter", "Shadow Ball", 3, "120", 3],
  ["sv03.5-143", "Snorlax", "Uncommon", 150, "Colorless", "Basic", null, "Heavy Impact", 4, "130", 0.8],
  ["sv03.5-149", "Dragonite", "Rare", 180, "Dragon", "Stage2", "Dragonair", "Dragon Pulse", 2, "200", 1.5],
  ["sv03.5-151", "Mew ex", "Double Rare", 180, "Psychic", "Basic", null, "Genome Hacking", 3, "", 6],
  ["sv03.5-205", "Mew ex", "Hyper Rare", 180, "Psychic", "Basic", null, "Genome Hacking", 3, "", 55],
  ["sv04.5-234", "Charizard ex", "Special Illustration Rare", 330, "Darkness", "Stage2", "Charmeleon", "Burning Darkness", 2, "180+", 95],
  ["sv08.5-161", "Umbreon ex", "Special Illustration Rare", 280, "Darkness", "Stage1", "Eevee", "Black Noir", 3, "160", 1100],
  ["sv08.5-74", "Eevee", "Common", 60, "Colorless", "Basic", null, "Tackle", 1, "20", 0.5],
];

// Variação "aleatória", mas sempre igual pra mesma carta (assim a página não muda a cada visita).
function variacaoFixa(id) {
  let h = 0;
  for (const letra of id) h = (h * 31 + letra.charCodeAt(0)) % 1000;
  return 0.85 + (h / 1000) * 0.3; // entre 0,85 e 1,15
}

function montarCarta([id, name, rarity, hp, tipo, stage, evolveFrom, ataque, custo, dano, usd]) {
  const [setId, localId] = [id.slice(0, id.lastIndexOf("-")), id.slice(id.lastIndexOf("-") + 1)];
  const set = SETS[setId];
  const v = variacaoFixa(id);
  const treinador = !tipo;
  return {
    id,
    localId,
    name,
    image: `${IMAGENS_OFFLINE}/${id}`,
    category: treinador ? "Trainer" : "Pokemon",
    rarity,
    illustrator: "Modo offline",
    hp: hp ?? undefined,
    types: tipo ? [tipo] : undefined,
    stage: stage ?? undefined,
    evolveFrom: evolveFrom ?? undefined,
    effect: treinador ? "Descarte sua mão e compre 7 cartas. (Texto de exemplo do modo offline.)" : undefined,
    attacks: ataque
      ? [{ name: ataque, cost: Array(custo).fill(tipo), damage: dano || undefined, effect: "Ataque de exemplo do modo offline." }]
      : [],
    weaknesses: tipo && tipo !== "Dragon" ? [{ type: tipo === "Fire" ? "Water" : "Fire", value: "×2" }] : [],
    retreat: treinador ? undefined : Math.min(3, Math.max(1, Math.round((hp ?? 60) / 100))),
    set: { id: setId, name: set.name, cardCount: { official: set.total } },
    pricing: {
      tcgplayer: {
        holofoil: { marketPrice: usd, lowPrice: usd * 0.8, highPrice: usd * 1.4 },
      },
      cardmarket: {
        trend: usd * 0.9,
        avg7: usd * 0.9 * v,
        avg30: (usd * 0.9) / v,
        low: usd * 0.7,
      },
    },
  };
}

export const CARTAS_OFFLINE = Object.fromEntries(LISTA.map((l) => [l[0], montarCarta(l)]));

// ---------- Cartas inventadas na hora ----------
// A lista acima não tem todos os Pokémon. Pra qualquer outro nome buscado (ex.: "Luxray"),
// criamos 3 versões: Luxray, Luxray V e Luxray ex. O id guarda o nome ("off-luxray-2"),
// então a mesma carta volta sempre com os mesmos dados, inclusive na coleção.
const TIPOS = ["Grass", "Fire", "Water", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"];
const VERSOES = [
  { sufixo: "", raridade: "Rare", hp: 120, estagio: "Basic", base: 2 },
  { sufixo: " V", raridade: "Rare Ultra", hp: 210, estagio: "Basic", base: 18 },
  { sufixo: " ex", raridade: "Special Illustration Rare", hp: 280, estagio: "Stage1", base: 60 },
];
const SUFIXOS = /\s+(ex|v|vmax|vstar|gx)$/i;

// "Flabébé" → "flabebe" (busca sem acento acha com acento e vice-versa)
const semAcento = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// "Mr. Mime" → "mr._mime" (só letras sem acento, números, ponto e hífen; espaço vira _)
const paraSlug = (nome) =>
  semAcento(nome)
    .replace(/[^a-z0-9. -]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 28);
const doSlug = (slug) => slug.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

function hash(texto) {
  let h = 7;
  for (const letra of texto) h = (h * 31 + letra.charCodeAt(0)) % 100_000;
  return h;
}

function inventarCarta(id) {
  const m = id.match(/^off-(.+)-([123])$/);
  if (!m) return null;
  const nomeBase = doSlug(m[1]);
  const versao = VERSOES[Number(m[2]) - 1];
  const h = hash(m[1]);
  const tipo = TIPOS[h % TIPOS.length];
  const setIds = Object.keys(SETS);
  const setId = setIds[(h + Number(m[2])) % setIds.length];
  const numero = 1 + ((h * Number(m[2])) % SETS[setId].total);
  const usd = Math.round(versao.base * (0.5 + (h % 100) / 50) * 100) / 100;

  const carta = montarCarta([
    `${setId}-${numero}`,
    nomeBase + versao.sufixo,
    versao.raridade,
    versao.hp,
    tipo,
    versao.estagio,
    versao.estagio === "Basic" ? null : nomeBase,
    "Ataque Offline",
    2,
    String(30 + (h % 8) * 20),
    usd,
  ]);
  return { ...carta, id, image: `${IMAGENS_OFFLINE}/${id}` };
}

/** Uma carta pelo id: das fixas ou inventada (ids "off-..."). */
export const cartaOffline = (id) => CARTAS_OFFLINE[id] ?? inventarCarta(id);

const resumo = (c) => ({ id: c.id, localId: c.localId, name: c.name, image: c.image });

/**
 * Responde como a TCGdex responderia. Entende:
 * - /cards/ID                         → a carta completa
 * - /cards?name=X  (contém) ou X*      → lista resumida (começa com)
 * - /cards?localId=eq:N                → filtra pelo número
 * Se nenhuma carta fixa bater com o nome, inventa as versões daquele nome.
 */
export function respostaOffline(url) {
  const { pathname, searchParams } = new URL(url);
  const partes = pathname.split("/cards");
  const id = decodeURIComponent(partes[1]?.replace(/^\//, "") ?? "");
  if (id) return cartaOffline(id);

  const nome = semAcento(searchParams.get("name") ?? "").trim();
  const comeca = nome.endsWith("*");
  const termo = nome.replace(/\*$/, "");
  const numero = searchParams.get("localId")?.replace(/^eq:/, "");

  const bate = (c) => {
    const n = semAcento(c.name);
    if (termo && !(comeca ? n.startsWith(termo) : n.includes(termo))) return false;
    if (numero && c.localId !== numero) return false;
    return true;
  };

  const fixas = Object.values(CARTAS_OFFLINE).filter(bate);
  if (fixas.length > 0 || !termo) return fixas.map(resumo);

  const slug = paraSlug(termo.replace(SUFIXOS, ""));
  if (slug.length < 2) return [];
  return [1, 2, 3]
    .map((n) => inventarCarta(`off-${slug}-${n}`))
    .filter(bate)
    .map(resumo);
}
