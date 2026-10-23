// components/GraficoHistorico.jsx
// Gráfico de linha simples (SVG desenhado no servidor, sem biblioteca).
// Usado no histórico de preço da carta e na evolução do valor da coleção.
// Os botões de período são links (?periodo=6m), então funciona sem JavaScript.
import Link from "next/link";
import { formatarReais } from "../lib/tcgdex";
import { PERIODOS } from "../lib/historico";
import styles from "./GraficoHistorico.module.css";

const LARGURA = 600;
const ALTURA = 220;

// "2026-10-19" → "19 out"
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function dataCurta(dia) {
  const [, mes, d] = dia.split("-").map(Number);
  return `${d} ${MESES[mes - 1]}`;
}

// Transforma a lista de valores no "d" de um <path> do SVG.
function caminho(valores, min, max) {
  const passo = valores.length > 1 ? LARGURA / (valores.length - 1) : 0;
  const y = (v) => ALTURA - ((v - min) / (max - min || 1)) * ALTURA;
  return valores.map((v, i) => `${i ? "L" : "M"}${(i * passo).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
}

/**
 * pontos: [{ dia: "2026-10-19", valor, investido? }]
 * periodo: id do período atual · linkPeriodo(id): endereço com ?periodo=
 * bloqueado: true quando o período escolhido é do Pro e a pessoa é do Grátis
 * gratis: mostra o cadeado nos períodos do Pro
 */
export default function GraficoHistorico({
  titulo,
  descricao,
  pontos,
  periodo,
  linkPeriodo,
  bloqueado = false,
  gratis = false,
  comInvestido = false,
  idTitulo = "grafico",
  compacto = false, // dentro de outro painel: sem caixa própria e sem os números de mín/máx
}) {
  const valores = (pontos ?? []).map((p) => p.valor);
  const investidos = comInvestido ? (pontos ?? []).map((p) => p.investido ?? 0) : [];
  const todos = [...valores, ...investidos];
  const min = todos.length ? Math.min(...todos) * 0.97 : 0;
  const max = todos.length ? Math.max(...todos) * 1.03 : 0;
  const temDados = valores.length >= 2;

  const primeiro = valores[0];
  const ultimo = valores[valores.length - 1];
  const variacao = temDados && primeiro ? ((ultimo - primeiro) / primeiro) * 100 : null;

  return (
    <section className={`${styles.grafico} ${compacto ? styles.compacto : ""}`} aria-labelledby={idTitulo}>
      <div className={styles.topo}>
        <div>
          <h2 id={idTitulo} className={styles.titulo}>
            {titulo}
          </h2>
          {descricao && <p className={styles.descricao}>{descricao}</p>}
        </div>
        <nav className={styles.periodos} aria-label="Período do gráfico">
          {PERIODOS.map((p) => (
            <Link
              key={p.id}
              href={linkPeriodo(p.id)}
              scroll={false}
              aria-current={p.id === periodo ? "true" : undefined}
              className={styles.periodo}
            >
              {p.rotulo}
              {gratis && p.pro && (
                <span className={styles.cadeado}>
                  PRO
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.caixa}>
        {bloqueado ? (
          <div className={styles.bloqueio}>
            <strong>Histórico completo é do Pro</strong>
            <p>No Grátis você vê os últimos 30 dias. O Pro mostra tudo desde que a gente começou a registrar.</p>
            <Link href="/assinar" className={styles.botao}>
              Assinar o Pro
            </Link>
          </div>
        ) : pontos === null ? (
          <p className={styles.vazio}>Não conseguimos carregar o histórico agora.</p>
        ) : !temDados ? (
          <p className={styles.vazio}>
            Começamos a registrar {valores.length ? `hoje (${formatarReais(valores[0])})` : "a partir de hoje"}. Volte
            amanhã pra ver a linha se formar.
          </p>
        ) : (
          <>
            {!compacto && (
            <dl className={styles.numeros}>
              <div>
                <dt>Mínimo</dt>
                <dd>{formatarReais(Math.min(...valores))}</dd>
              </div>
              <div>
                <dt>Máximo</dt>
                <dd>{formatarReais(Math.max(...valores))}</dd>
              </div>
              <div>
                <dt>Variação</dt>
                <dd className={variacao >= 0 ? styles.alta : styles.baixa}>
                  {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(1).replace(".", ",")}%
                </dd>
              </div>
            </dl>
            )}

            {comInvestido && (
              <ul className={styles.legenda}>
                <li>
                  <i className={styles.legendaValor} aria-hidden="true" /> Valor de mercado
                </li>
                <li>
                  <i className={styles.legendaInvestido} aria-hidden="true" /> Quanto você pagou
                </li>
              </ul>
            )}

            <div className={styles.area}>
              <div className={styles.eixoY} aria-hidden="true">
                <span>{formatarReais(max)}</span>
                <span>{formatarReais(min)}</span>
              </div>
              <svg
                viewBox={`0 0 ${LARGURA} ${ALTURA}`}
                preserveAspectRatio="none"
                className={styles.svg}
                role="img"
                aria-label={`${titulo}: de ${formatarReais(primeiro)} em ${dataCurta(pontos[0].dia)} para ${formatarReais(ultimo)} em ${dataCurta(pontos[pontos.length - 1].dia)}`}
              >
                <path
                  d={`${caminho(valores, min, max)} L${LARGURA} ${ALTURA} L0 ${ALTURA} Z`}
                  className={styles.preenchimento}
                />
                {comInvestido && <path d={caminho(investidos, min, max)} className={styles.linhaInvestido} />}
                <path d={caminho(valores, min, max)} className={styles.linha} />
              </svg>
            </div>
            <div className={styles.eixoX} aria-hidden="true">
              <span>{dataCurta(pontos[0].dia)}</span>
              <span>{dataCurta(pontos[pontos.length - 1].dia)}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
