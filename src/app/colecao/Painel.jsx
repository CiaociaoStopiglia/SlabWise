// app/colecao/Painel.jsx
// Topo da coleção num painel só: à esquerda quanto ela vale (e se está no lucro),
// à direita o gráfico de como esse valor andou. São a mesma informação vista de dois jeitos.
import { formatarReais } from "../../lib/tcgdex";
import GraficoHistorico from "../../components/GraficoHistorico";
import { LIMITE_GRATIS } from "./dados";
import styles from "./colecao.module.css";

export default function Painel({ resumo, gratis, grafico }) {
  const { valorTotal, investido, totalCartas, distintas, semPreco, resultado, resultadoPct } = resumo;
  const subiu = resultado !== null && resultado >= 0;

  return (
    <section className={styles.painel} aria-label="Resumo da coleção">
      <div className={styles.painelNumeros}>
        <p className={styles.painelKicker}>Valor estimado hoje</p>
        <p className={styles.painelValor}>{formatarReais(valorTotal)}</p>

        {resultado === null ? (
          <p className={styles.painelDica}>Anote quanto pagou nas cartas pra ver se está no lucro.</p>
        ) : (
          <p className={`${styles.painelResultado} ${subiu ? styles.alta : styles.baixa}`}>
            {subiu ? "▲" : "▼"} {subiu ? "+" : "−"}
            {formatarReais(Math.abs(resultado))} ({Math.abs(resultadoPct).toFixed(1).replace(".", ",")}%)
            <span> sobre o que você pagou</span>
          </p>
        )}

        <dl className={styles.painelLista}>
          <div>
            <dt>Cartas</dt>
            <dd>
              {totalCartas}
              {distintas !== totalCartas && <small> ({distintas} diferentes)</small>}
            </dd>
          </div>
          {investido > 0 && (
            <div>
              <dt>Você pagou</dt>
              <dd>{formatarReais(investido)}</dd>
            </div>
          )}
          {gratis && (
            <div className={styles.painelLimite}>
              <dt>Plano Grátis</dt>
              <dd>
                {distintas}/{LIMITE_GRATIS}
              </dd>
              <div
                className={styles.resumoBarra}
                role="progressbar"
                aria-label="Uso do limite do plano Grátis"
                aria-valuemin={0}
                aria-valuemax={LIMITE_GRATIS}
                aria-valuenow={distintas}
              >
                <i style={{ width: `${Math.min(100, (distintas / LIMITE_GRATIS) * 100)}%` }} />
              </div>
            </div>
          )}
        </dl>

        {semPreco > 0 && (
          <p className={styles.painelNota}>
            {semPreco} {semPreco === 1 ? "carta está" : "cartas estão"} sem preço e fora da soma.
          </p>
        )}
      </div>

      <div className={styles.painelGrafico}>
        <GraficoHistorico {...grafico} compacto />
      </div>
    </section>
  );
}
