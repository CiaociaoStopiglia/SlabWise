// app/assinatura/page.jsx
// Plano e cobrança (endereço: /assinatura). Área logada.
// Mostra o plano atual e quanto do limite do Grátis já foi usado.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { usuarioAtual } from "../../lib/auth";
import { query } from "../../lib/db";
import AreaLogada from "../../components/area/AreaLogada";
import base from "../page.module.css";
import styles from "../../components/area/area.module.css";

export const metadata = { title: "Plano e cobrança | Slabbit" };

const LIMITE_GRATIS = 100;
const BENEFICIOS_PRO = ["Coleção sem limite", "Histórico completo", "Alertas de preço", "Simulações salvas"];

export default async function Assinatura({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/assinatura");
  const pro = usuario.plano === "pro";

  let cartas = null;
  let proAte = null;
  try {
    const { rows } = await query(
      `select (select count(*)::int from colecao where usuario_id = $1) as cartas,
              (select pro_ate from usuarios where id = $1) as pro_ate`,
      [usuario.id],
    );
    cartas = rows[0].cartas;
    proAte = rows[0].pro_ate;
  } catch (e) {
    console.error("[slabbit] erro ao ler o plano:", e.message);
  }

  return (
    <AreaLogada usuario={usuario} ativo="assinatura" titulo="Plano e cobrança">
      {pro ? (
        <div className={styles.caixa}>
          <h2 className={styles.subtitulo}>Você é Pro</h2>
          <p className={styles.texto}>
            {proAte
              ? `Seu Pro vale até ${new Date(proAte).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}.`
              : "Seu plano Pro está ativo."}
          </p>
          <ul className={styles.lista}>
            {BENEFICIOS_PRO.map((b) => (
              <li key={b}>
                <Check size={18} strokeWidth={3} aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className={styles.caixa}>
            <h2 className={styles.subtitulo}>Seu plano: Grátis</h2>
            {cartas !== null && (
              <>
                <p className={styles.texto}>
                  Cartas na coleção: <strong>{cartas}</strong> de {LIMITE_GRATIS}
                </p>
                <div
                  className={styles.barra}
                  role="progressbar"
                  aria-label="Cartas na coleção"
                  aria-valuemin={0}
                  aria-valuemax={LIMITE_GRATIS}
                  aria-valuenow={cartas}
                >
                  <i style={{ width: `${Math.min(100, (cartas / LIMITE_GRATIS) * 100)}%` }} />
                </div>
              </>
            )}
            <p className={styles.texto}>Histórico de 30 dias e simulador de graduação liberados.</p>
          </div>

          <div className={styles.bloqueio}>
            <span className={styles.bloqueioSelo}>PRO · R$ 9,90/MÊS OU R$ 99/ANO</span>
            <strong>Pra quem coleciona sério</strong>
            <ul className={styles.lista}>
              {BENEFICIOS_PRO.map((b) => (
                <li key={b}>
                  <Check size={18} strokeWidth={3} aria-hidden="true" /> {b}
                </li>
              ))}
            </ul>
            <Link href="/assinar" className={base.buttonDark}>
              Assinar o Pro
            </Link>
          </div>
        </>
      )}
    </AreaLogada>
  );
}
