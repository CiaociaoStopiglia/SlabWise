// app/simulacoes/page.jsx
// Simulações salvas do "Vale graduar?" (endereço: /simulacoes). Área logada.
// Simular é grátis; guardar a simulação pra comparar depois é do Pro.
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "../../lib/auth";
import { query } from "../../lib/db";
import { formatarReais } from "../../lib/tcgdex";
import AreaLogada, { BloqueioPro } from "../../components/area/AreaLogada";
import { removerSimulacao } from "./actions";
import base from "../page.module.css";
import styles from "../../components/area/area.module.css";

export const metadata = { title: "Simulações salvas | Slabbit" };

const VEREDITOS = { vale: "Vale a pena", so10: "Só se tirar 10", nao: "Não compensa" };

export default async function Simulacoes({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/simulacoes");
  const pro = usuario.plano === "pro";

  let simulacoes = [];
  let bancoFora = false;
  if (pro) {
    try {
      const { rows } = await query(
        `select id, carta_id, dados, veredito, criada_em
           from simulacoes where usuario_id = $1 order by criada_em desc limit 100`,
        [usuario.id],
      );
      simulacoes = rows;
    } catch (e) {
      console.error("[slabbit] erro ao ler simulações:", e.message);
      bancoFora = true;
    }
  }

  const novaSimulacao = (
    <Link href="/graduar" className={base.buttonDark}>
      Nova simulação
    </Link>
  );

  return (
    <AreaLogada
      usuario={usuario}
      ativo="simulacoes"
      titulo="Simulações salvas"
      acoes={novaSimulacao}
    >
      {!pro && (
        <BloqueioPro titulo="Simular é grátis. Salvar é Pro.">
          Use o simulador quanto quiser. No Pro, cada simulação fica guardada aqui pra você comparar e decidir o que vai
          no lote.
        </BloqueioPro>
      )}

      {pro && bancoFora && <p className={styles.texto}>Não conseguimos abrir suas simulações agora. Tente de novo.</p>}

      {pro && !bancoFora && simulacoes.length === 0 && (
        <div className={styles.caixa}>
          <h2 className={styles.subtitulo}>Nenhuma simulação salva</h2>
          <p className={styles.texto}>Faça uma simulação e clique em “Salvar simulação” embaixo do resultado.</p>
        </div>
      )}

      {simulacoes.length > 0 && (
        <ul className={styles.lista}>
          {simulacoes.map((s) => {
            const d = s.dados ?? {};
            const esperado = Number(d.esperado);
            return (
              <li key={s.id} className={styles.linha}>
                <div className={styles.linhaInfo}>
                  {s.carta_id ? (
                    <Link href={`/graduar?carta=${encodeURIComponent(s.carta_id)}`}>{d.cartaNome ?? s.carta_id}</Link>
                  ) : (
                    <strong>{d.cartaNome ?? "Carta sem nome (valores digitados)"}</strong>
                  )}
                  <p>
                    Salva em{" "}
                    {new Date(s.criada_em).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className={`${styles.status} ${s.veredito === "vale" ? styles.statusAtivo : ""}`}>
                  {VEREDITOS[s.veredito] ?? "—"}
                </span>
                {d.chance10 != null && <span className={styles.dado}>Chance de 10: {Math.round(d.chance10 * 100)}%</span>}
                {Number.isFinite(esperado) && (
                  <span className={`${styles.dado} ${esperado >= 0 ? styles.alta : styles.baixa}`}>
                    Lucro esperado {esperado >= 0 ? "+" : "−"}
                    {formatarReais(Math.abs(esperado))}
                  </span>
                )}
                <div className={styles.acoesLinha}>
                  <form action={removerSimulacao}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit">Apagar</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AreaLogada>
  );
}
