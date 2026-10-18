"use client";

import { useMemo, useState } from "react";
import { CHECKLIST, FRETE_PADRAO, NIVEIS_PSA, dataDeVolta, estimarChances, nivelAutomatico } from "./psa";
import styles from "./graduar.module.css";

const EXEMPLO = { cru: "310", psa10: "1450", psa9: "450", psa8: "300" };

// Valores abaixo de R$ 100 mostram centavos (carta comum de R$ 0,45 não vira "R$ 0").
const reais = (v) => {
  const casas = Math.abs(v) < 100 ? 2 : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(v);
};

// Preço da API pro campo: 0.45 → "0,45" / 1240.6 → "1241"
const paraCampo = (v) => (v < 100 ? v.toFixed(2).replace(".", ",") : String(Math.round(v)));
const comSinal = (v) => `${v >= 0 ? "+ " : "− "}${reais(Math.abs(v))}`;
const pct = (v) => `${Math.round(v * 100)}%`;

// Aceita "1.450", "1450", "0,45" e também "0.45".
function numero(texto) {
  if (texto === "" || texto === null || texto === undefined) return null;
  let s = String(texto).trim().replace(/\s|R\$/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); // 1.450 = mil e quatrocentos
  const x = parseFloat(s);
  return Number.isFinite(x) && x >= 0 ? x : null;
}

function CampoReais({ id, rotulo, ajuda, valor, onChange, placeholder }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{rotulo}</label>
      <div className={styles.money}>
        <span aria-hidden="true">R$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      {ajuda && <p className={styles.fieldHelp}>{ajuda}</p>}
    </div>
  );
}

export default function Calculadora({ carta, cotacaoUsd, cotacaoFonte }) {
  const usd = cotacaoUsd || 5.4;
  const exemplo = !carta;

  const [valores, setValores] = useState(
    carta
      ? { cru: carta.preco ? paraCampo(carta.preco) : "", psa10: "", psa9: "", psa8: "" }
      : EXEMPLO
  );
  const [editou, setEditou] = useState(false);
  const [estado, setEstado] = useState({ centro: "ok", cantos: "ok", bordas: "leve", superficie: "ok" });
  const [envio, setEnvio] = useState("grupo");
  const [frete, setFrete] = useState({ grupo: String(FRETE_PADRAO.grupo), sozinho: String(FRETE_PADRAO.sozinho) });
  const [imposto, setImposto] = useState("0");
  const [nivelEscolhido, setNivelEscolhido] = useState("auto");

  const mudarValor = (campo) => (v) => {
    setValores((atual) => ({ ...atual, [campo]: v }));
    setEditou(true);
  };

  const r = useMemo(() => {
    const cru = numero(valores.cru);
    const p10 = numero(valores.psa10);
    const p9 = numero(valores.psa9);
    const p8 = numero(valores.psa8) ?? cru; // sem PSA 8, consideramos igual à carta sem graduar
    if (cru === null || p10 === null || p9 === null) return null;

    const auto = nivelAutomatico(p10 / usd);
    const nivel = nivelEscolhido === "auto" ? auto : NIVEIS_PSA.find((n) => n.id === nivelEscolhido) ?? auto;
    const riscoExtra = p10 / usd > nivel.maxUsd;

    const taxa = nivel.precoUsd * usd;
    // Carta barata: o PSA 10 nem cobre a taxa da PSA sozinha.
    const barata = p10 - cru < taxa;
    const custoFrete = numero(frete[envio]) ?? 0;
    const custoImposto = numero(imposto) ?? 0;
    const custo = taxa + custoFrete + custoImposto;

    const chances = estimarChances(estado);
    const cenarios = [
      { nota: "PSA 10", valor: p10 },
      { nota: "PSA 9", valor: p9 },
      { nota: "PSA 8", valor: p8 },
      { nota: "7 ou menos", valor: cru }, // nota baixa costuma valer perto da carta sem graduar
    ].map((c, i) => ({ ...c, chance: chances[i], lucro: c.valor - cru - custo }));

    const esperado = cenarios.reduce((s, c) => s + c.chance * c.lucro, 0);
    const minima = [...cenarios.slice(0, 3)].reverse().find((c) => c.lucro >= 0)?.nota ?? null;

    let veredito;
    if (esperado > 0 && cenarios[1].lucro >= 0) veredito = "vale";
    else if (cenarios[0].lucro > 0) veredito = "so10";
    else veredito = "nao";

    return {
      nivel,
      auto,
      riscoExtra,
      taxa,
      custoFrete,
      custoImposto,
      custo,
      cenarios,
      esperado,
      minima,
      veredito,
      barata,
    };
  }, [valores, estado, envio, frete, imposto, nivelEscolhido, usd]);

  const VEREDITOS = {
    vale: { titulo: "Vale a pena", classe: styles.vVale },
    so10: { titulo: "Só se tirar 10", classe: styles.vSo10 },
    nao: { titulo: "Não compensa", classe: styles.vNao },
  };

  const volta = r ? dataDeVolta(r.nivel.dias) : null;

  return (
    <div className={styles.calc}>
      <div className={styles.steps}>
        {/* PASSO 2: valores */}
        <fieldset className={styles.step}>
          <legend>
            <span className={styles.stepNum}>2</span> Quanto ela vale
          </legend>
          {exemplo && !editou && (
            <p className={styles.exampleNote}>
              Valores de exemplo. Escolha sua carta acima ou troque pelos números dela.
            </p>
          )}
          <div className={styles.grid2}>
            <CampoReais
              id="cru"
              rotulo="Sem graduar"
              ajuda={carta?.preco ? "Preço de hoje no Slabbit. Pode ajustar." : "Quanto você venderia ela hoje."}
              valor={valores.cru}
              onChange={mudarValor("cru")}
              placeholder="0"
            />
            <CampoReais
              id="psa10"
              rotulo="Graduada PSA 10"
              ajuda="Veja vendas recentes no eBay ou na Liga."
              valor={valores.psa10}
              onChange={mudarValor("psa10")}
              placeholder="0"
            />
            <CampoReais
              id="psa9"
              rotulo="Graduada PSA 9"
              valor={valores.psa9}
              onChange={mudarValor("psa9")}
              placeholder="0"
            />
            <CampoReais
              id="psa8"
              rotulo="Graduada PSA 8 (opcional)"
              ajuda="Se deixar vazio, contamos como o valor sem graduar."
              valor={valores.psa8}
              onChange={mudarValor("psa8")}
              placeholder="opcional"
            />
          </div>
        </fieldset>

        {/* PASSO 3: estado */}
        <fieldset className={styles.step}>
          <legend>
            <span className={styles.stepNum}>3</span> Estado da carta
          </legend>
          <p className={styles.stepLead}>Pegue a carta na mão, de preferência com uma lanterna, e responda com sinceridade.</p>
          <div className={styles.checklist}>
            {CHECKLIST.map((item) => (
              <div key={item.id} className={styles.checkItem} role="radiogroup" aria-labelledby={`t-${item.id}`}>
                <p id={`t-${item.id}`} className={styles.checkTitle}>
                  {item.titulo}
                </p>
                <p className={styles.fieldHelp}>{item.ajuda}</p>
                <div className={styles.segmented}>
                  {item.opcoes.map((op) => (
                    <label key={op.id} className={estado[item.id] === op.id ? styles.segOn : undefined}>
                      <input
                        type="radio"
                        id={`${item.id}-${op.id}`}
                        name={item.id}
                        value={op.id}
                        checked={estado[item.id] === op.id}
                        onChange={() => setEstado((e) => ({ ...e, [item.id]: op.id }))}
                      />
                      {op.rotulo}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* PASSO 4: custos */}
        <fieldset className={styles.step}>
          <legend>
            <span className={styles.stepNum}>4</span> Custos
          </legend>

          <div className={styles.field}>
            <label htmlFor="nivel">Nível na PSA</label>
            <select id="nivel" value={nivelEscolhido} onChange={(e) => setNivelEscolhido(e.target.value)}>
              <option value="auto">Automático (pelo valor da carta)</option>
              {NIVEIS_PSA.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nome} · US$ {n.precoUsd.toFixed(2)} · até US$ {n.maxUsd.toLocaleString("pt-BR")}
                </option>
              ))}
            </select>
            {r?.nivel.lote && (
              <p className={styles.warn}>
                O Value Bulk exige assinatura do Collector&apos;s Club da PSA e várias cartas no mesmo envio.
              </p>
            )}
            {r?.riscoExtra ? (
              <p className={styles.warn}>
                Esse nível vai até US$ {r.nivel.maxUsd.toLocaleString("pt-BR")}. Se a carta tirar 10, a PSA cobra a
                diferença pro nível certo ({r.auto.nome}).
              </p>
            ) : (
              <p className={styles.fieldHelp}>
                Cada nível tem um valor máximo de carta. Se passar dele, a PSA cobra a diferença depois.
              </p>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel} id="envio-label">
              Como você vai enviar
            </span>
            <div className={styles.segmented} role="radiogroup" aria-labelledby="envio-label">
              {[
                ["grupo", "Em grupo / intermediário"],
                ["sozinho", "Sozinho"],
              ].map(([id, rotulo]) => (
                <label key={id} className={envio === id ? styles.segOn : undefined}>
                  <input
                    type="radio"
                    id={`envio-${id}`}
                    name="envio"
                    value={id}
                    checked={envio === id}
                    onChange={() => setEnvio(id)}
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.grid2}>
            <CampoReais
              id="frete"
              rotulo="Frete ida e volta com seguro"
              ajuda="Valor de referência. Confira com o grupo ou a transportadora."
              valor={frete[envio]}
              onChange={(v) => setFrete((f) => ({ ...f, [envio]: v }))}
            />
            <CampoReais
              id="imposto"
              rotulo="Imposto na volta"
              ajuda="A cobrança varia: muita gente paga sobre o valor declarado. Se o seu grupo cobra, coloque aqui."
              valor={imposto}
              onChange={setImposto}
            />
          </div>
        </fieldset>
      </div>

      {/* RESULTADO */}
      <aside className={styles.result} aria-live="polite">
        {!r ? (
          <div className={styles.resultEmpty}>
            <p className={styles.resultKicker}>Resultado</p>
            <h2>Preencha os valores</h2>
            <p>Coloque quanto a carta vale sem graduar, em PSA 10 e em PSA 9 pra ver se compensa.</p>
          </div>
        ) : (
          <>
            <div className={`${styles.verdict} ${VEREDITOS[r.veredito].classe}`}>
              <span className={styles.resultKicker}>Veredito{exemplo && !editou ? " · exemplo" : ""}</span>
              <strong>{VEREDITOS[r.veredito].titulo}</strong>
            </div>

            <div className={styles.resultBody}>
              <div className={styles.bigNumber}>
                <span>Lucro esperado vs. vender sem graduar</span>
                <strong className={r.esperado >= 0 ? styles.pos : styles.neg}>{comSinal(r.esperado)}</strong>
              </div>
              <p className={styles.sentence}>
                {r.minima
                  ? r.minima === "PSA 10"
                    ? "Você só sai no lucro se a carta tirar 10."
                    : `Você precisa tirar pelo menos ${r.minima} pra não perder dinheiro.`
                  : "Nem com PSA 10 a graduação se paga. Melhor vender ou guardar sem graduar."}
              </p>

              {r.barata && (
                <div className={styles.cheapTip}>
                  <strong>Carta barata?</strong>
                  <p>
                    Só a taxa da PSA já custa {reais(r.taxa)}. Pra carta comum compensar, o PSA 10 dela precisa ser
                    procurado, como comuns antigas de 1ª edição, promos ou cartas com arte famosa. Outros motivos que
                    fazem sentido mesmo sem lucro:
                  </p>
                  <ul>
                    <li>É uma carta especial pra você e você quer proteger ela.</li>
                    <li>Vai montar um lote grande: o nível Value Bulk sai mais barato por carta.</li>
                  </ul>
                </div>
              )}

              <table className={styles.table}>
                <caption className={styles.srOnly}>Resultado por nota</caption>
                <thead>
                  <tr>
                    <th scope="col">Nota</th>
                    <th scope="col">Chance</th>
                    <th scope="col">Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {r.cenarios.map((c) => (
                    <tr key={c.nota}>
                      <th scope="row">{c.nota}</th>
                      <td>
                        <span className={styles.bar} style={{ "--w": pct(c.chance) }} aria-hidden="true" />
                        {pct(c.chance)}
                      </td>
                      <td className={c.lucro >= 0 ? styles.pos : styles.neg}>{comSinal(c.lucro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.tiny}>Chances estimadas pelo estado que você marcou. Não é garantia de nota.</p>

              <dl className={styles.costs}>
                <div>
                  <dt>
                    Taxa PSA ({r.nivel.nome}, US$ {r.nivel.precoUsd.toFixed(2)})
                  </dt>
                  <dd>{reais(r.taxa)}</dd>
                </div>
                <div>
                  <dt>Frete ida e volta</dt>
                  <dd>{reais(r.custoFrete)}</dd>
                </div>
                <div>
                  <dt>Imposto na volta</dt>
                  <dd>{reais(r.custoImposto)}</dd>
                </div>
                <div className={styles.costsTotal}>
                  <dt>Custo total</dt>
                  <dd>{reais(r.custo)}</dd>
                </div>
              </dl>

              <p className={styles.wait}>
                <strong>Prazo:</strong> uns {r.nivel.dias} dias úteis na PSA. Contando o envio, a carta deve voltar
                por volta de{" "}
                <span suppressHydrationWarning>
                  {volta.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
                .
              </p>
              <p className={styles.tiny}>
                Dólar a{" "}
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(usd)}
                {cotacaoFonte === "reserva" ? " (cotação de reserva)" : ""}. Preços da PSA de referência 2026.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}