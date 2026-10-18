// app/colecao/FormularioAdicionar.jsx
// Formulário de "Adicionar à coleção". Usado na coleção e na página de cada carta.
import { adicionarCarta } from "./actions";
import { ESTADOS, GRADUACOES } from "./opcoes";
import base from "../page.module.css";
import styles from "./colecao.module.css";

/** aberto: já vem com os campos à mostra. voltar: página pra onde ir depois de salvar. */
export default function FormularioAdicionar({ carta, aberto = false, voltar = "/colecao" }) {
  return (
    <details className={styles.add} open={aberto || undefined}>
      <summary>Adicionar à coleção</summary>
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
