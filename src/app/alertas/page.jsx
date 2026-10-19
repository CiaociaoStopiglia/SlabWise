// app/alertas/page.jsx
// Alertas de preço (endereço: /alertas). Área logada, recurso do Pro.
// O alerta é criado na página da carta; aqui a pessoa vê, pausa e remove.
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { usuarioAtual } from "../../lib/auth";
import { query } from "../../lib/db";
import { buscarCartaPorId, cotacaoDoDia, formatarReais } from "../../lib/tcgdex";
import AreaLogada, { BloqueioPro } from "../../components/area/AreaLogada";
import { alternarAlerta, removerAlerta } from "./actions";
import base from "../page.module.css";
import styles from "../../components/area/area.module.css";

export const metadata = { title: "Alertas de preço | Slabbit" };

export default async function Alertas({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/alertas");
  const pro = usuario.plano === "pro";

  let alertas = [];
  let bancoFora = false;
  if (pro) {
    try {
      const { rows } = await query(
        `select id, carta_id, direcao, preco_alvo::float8 as preco_alvo, ativo, disparado_em
           from alertas where usuario_id = $1 order by criado_em desc`,
        [usuario.id],
      );
      alertas = rows;
    } catch (e) {
      console.error("[slabbit] erro ao ler alertas:", e.message);
      bancoFora = true;
    }
  }

  // Preço de hoje de cada carta (a TCGdex fica em cache no servidor).
  const cotacao = await cotacaoDoDia();
  const ids = [...new Set(alertas.map((a) => a.carta_id))];
  const lista = await Promise.all(ids.map((id) => buscarCartaPorId(id, cotacao)));
  const cartas = Object.fromEntries(ids.map((id, i) => [id, lista[i]]));

  return (
    <AreaLogada usuario={usuario} ativo="alertas" titulo="Alertas de preço">
      <p className={styles.texto}>
        Quando uma carta cruzar o preço-alvo, você recebe um e-mail. Pra criar um alerta, abra a página da carta.
      </p>

      {!pro && (
        <BloqueioPro titulo="Pare de olhar o preço todo dia">
          Escolha um preço-alvo em qualquer carta e a gente avisa quando ela cair ou subir até lá.
        </BloqueioPro>
      )}

      {pro && bancoFora && <p className={styles.texto}>Não conseguimos abrir seus alertas agora. Tente de novo.</p>}

      {pro && !bancoFora && alertas.length === 0 && (
        <div className={styles.caixa}>
          <h2 className={styles.subtitulo}>Nenhum alerta ainda</h2>
          <p className={styles.texto}>Busque uma carta, abra a página dela e use “Avisa quando mexer”.</p>
          <div className={styles.botoes}>
            <Link href="/precos" className={base.buttonDark}>
              Buscar carta
            </Link>
          </div>
        </div>
      )}

      {alertas.length > 0 && (
        <ul className={styles.lista}>
          {alertas.map((a) => {
            const c = cartas[a.carta_id];
            const hoje = c?.preco?.valor ?? null;
            const noAlvo = hoje !== null && (a.direcao === "abaixo" ? hoje <= a.preco_alvo : hoje >= a.preco_alvo);
            const distancia = hoje ? Math.abs(a.preco_alvo / hoje - 1) * 100 : null;
            const status = a.disparado_em ? "AVISADO" : noAlvo ? "NO ALVO" : a.ativo ? "ATIVO" : "PAUSADO";
            return (
              <li key={a.id} className={styles.linha}>
                {c && (
                  <Image src={c.images.small} alt="" width={40} height={56} className={styles.linhaFoto} />
                )}
                <div className={styles.linhaInfo}>
                  <Link href={`/carta/${encodeURIComponent(a.carta_id)}#alerta`}>{c?.name ?? a.carta_id}</Link>
                  <p>
                    Quando {a.direcao === "abaixo" ? "cair abaixo de" : "subir acima de"}{" "}
                    <strong>{formatarReais(a.preco_alvo)}</strong>
                  </p>
                </div>
                <div className={styles.dado}>
                  <div>Hoje {hoje !== null ? formatarReais(hoje) : "sem preço"}</div>
                  {distancia !== null && !noAlvo && (
                    <div className={styles.texto}>Faltam {distancia.toFixed(1).replace(".", ",")}%</div>
                  )}
                </div>
                <span className={`${styles.status} ${a.ativo ? styles.statusAtivo : ""}`}>{status}</span>
                <div className={styles.acoesLinha}>
                  <form action={alternarAlerta}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit">{a.ativo ? "Pausar" : "Retomar"}</button>
                  </form>
                  <form action={removerAlerta}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" aria-label={`Remover alerta de ${c?.name ?? "carta"}`}>
                      Remover
                    </button>
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
