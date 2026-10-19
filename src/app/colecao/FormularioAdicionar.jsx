// app/colecao/FormularioAdicionar.jsx
// Formulário de "Adicionar à coleção". Usado na coleção, na busca e na página de cada carta.
//
// aberto: os campos já aparecem no meio da página (página da carta).
// Fechado (nas grades de cartas): o botão abre uma janela (<dialog>) no centro da tela,
// com espaço pros campos. Fecha com Esc, clicando fora ou em "Cancelar".
// voltar: página pra onde ir depois de salvar.
"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import CampoDinheiro from "../../components/CampoDinheiro";
import { adicionarCarta } from "./actions";
import { ESTADOS, GRADUACOES } from "./opcoes";
import base from "../page.module.css";
import styles from "./colecao.module.css";

export function Campos({ carta, voltar }) {
  const id = useId();
  return (
    <>
      <input type="hidden" name="carta_id" value={carta.id} />
      <input type="hidden" name="voltar" value={voltar} />
      <div className={styles.addCampos}>
        <div className={styles.addCampo}>
          <label htmlFor={`${id}-qtd`}>Quantidade</label>
          <input id={`${id}-qtd`} name="quantidade" type="number" min="1" max="999" defaultValue="1" />
        </div>
        <div className={styles.addCampo}>
          <label htmlFor={`${id}-pago`}>Quanto pagou (cada)</label>
          <div className={styles.addDinheiro}>
            <span aria-hidden="true">R$</span>
            <CampoDinheiro id={`${id}-pago`} name="preco_pago" placeholder="Opcional" />
          </div>
        </div>
        <div className={styles.addCampo}>
          <label htmlFor={`${id}-estado`}>Estado</label>
          <select id={`${id}-estado`} name="estado" defaultValue="NM">
            {Object.entries(ESTADOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.addCampo}>
          <label htmlFor={`${id}-grad`}>Graduada?</label>
          <select id={`${id}-grad`} name="graduacao" defaultValue="">
            <option value="">Não, sem graduar</option>
            {GRADUACOES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className={styles.addDica}>Se marcar uma nota PSA, o estado não conta: a nota já diz tudo.</p>
    </>
  );
}

export default function FormularioAdicionar({ carta, aberto = false, voltar = "/colecao" }) {
  const janela = useRef(null);
  const tituloId = useId();

  // Página da carta: formulário direto na página
  if (aberto) {
    return (
      <form action={adicionarCarta} className={styles.addForm}>
        <Campos carta={carta} voltar={voltar} />
        <button type="submit" className={base.buttonDark}>
          Adicionar à coleção
        </button>
      </form>
    );
  }

  return (
    <>
      <button type="button" className={styles.addBotao} onClick={() => janela.current?.showModal()}>
        Adicionar à coleção
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pelo teclado, o Esc já fecha o <dialog>; o clique é só no fundo escuro */}
      <dialog
        ref={janela}
        className={styles.addJanela}
        aria-labelledby={tituloId}
        // Clique no fundo escuro (fora da caixa) fecha a janela
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <form action={adicionarCarta} className={styles.addForm}>
          <div className={styles.addTopo}>
            {carta.images?.small && (
              <Image src={carta.images.small} alt="" width={245} height={337} className={styles.addFoto} />
            )}
            <div>
              <p className={styles.addKicker}>Adicionar à coleção</p>
              <h2 id={tituloId} className={styles.addTitulo}>
                {carta.name}
              </h2>
              <p className={styles.addMeta}>
                {carta.set ? `${carta.set} · ` : ""}#{carta.number}
              </p>
            </div>
          </div>

          <Campos carta={carta} voltar={voltar} />

          <div className={styles.addAcoes}>
            <button type="button" className={base.buttonOutline} onClick={() => janela.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className={base.buttonDark}>
              Salvar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
