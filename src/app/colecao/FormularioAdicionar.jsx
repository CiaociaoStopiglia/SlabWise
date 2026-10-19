// app/colecao/FormularioAdicionar.jsx
// Formulário de "Adicionar à coleção". Usado na coleção e na página de cada carta.
import { adicionarCarta } from "./actions";
import { ESTADOS, GRADUACOES } from "./opcoes";
import base from "../page.module.css";
import styles from "./colecao.module.css";

/**
 * aberto: já vem com os campos à mostra, no meio da página (usado na página da carta).
 * Fechado (na grade de cartas), os campos abrem num painel por cima do card,
 * assim os outros cards da linha não esticam junto.
 * voltar: página pra onde ir depois de salvar.
 */
export default function FormularioAdicionar({ carta, aberto = false, voltar = "/colecao" }) {
  return (
    <details className={`${styles.add} ${aberto ? "" : styles.addFlutuante}`} open={aberto || undefined}>
      <summary>
        <span className={styles.addAbrir}>Adicionar à coleção</span>
        <span className={styles.addFechar}>Fechar</span>
      </summary>
      <form action={adicionarCarta} className={styles.addForm}>
        <input type="hidden" name="carta_id" value={carta.id} />
        <input type="hidden" name="voltar" value={voltar} />
        <label>
          Quantidade
          <input
            name="quantidade"
            type="number"
            min="1"
            max="999"
            defaultValue="1"
          />
        </label>
        <label>
          Estado
          <select name="estado" defaultValue="NM">
            {Object.entries(ESTADOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Graduada?
          <select name="graduacao" defaultValue="">
            <option value="">Não, sem graduar</option>
            {GRADUACOES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quanto pagou (R$)
          <input
            name="preco_pago"
            inputMode="decimal"
            placeholder="Opcional"
            autoComplete="off"
          />
        </label>
        <button type="submit" className={base.buttonDark}>
          Salvar
        </button>
      </form>
    </details>
  );
}
