// app/colecao/RemoverCarta.jsx
// Botão "Remover" do card da coleção. Antes de apagar, abre uma janela de confirmação
// mostrando a carta, pra ninguém remover por engano.
"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { removerCarta } from "./actions";
import base from "../page.module.css";
import styles from "./colecao.module.css";

// Botão de confirmar: fica "Removendo…" e travado enquanto o servidor responde
function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`${base.buttonDark} ${styles.botaoPerigo}`} disabled={pending}>
      {pending ? "Removendo…" : "Remover"}
    </button>
  );
}

export default function RemoverCarta({ id, nome, detalhe, imagem, quantidade, temPrecoPago }) {
  const janela = useRef(null);
  const tituloId = useId();

  return (
    <>
      <button
        type="button"
        className={styles.remover}
        aria-label={`Remover ${nome} da coleção`}
        title="Remover da coleção"
        onClick={() => janela.current?.showModal()}
      >
        Remover
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pelo teclado, o Esc já fecha o <dialog>; o clique é só no fundo escuro */}
      <dialog
        ref={janela}
        className={styles.addJanela}
        aria-labelledby={tituloId}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <form action={removerCarta} className={styles.addForm}>
          <input type="hidden" name="id" value={id} />

          <div className={styles.addTopo}>
            {imagem && <Image src={imagem} alt="" width={245} height={337} className={styles.addFoto} />}
            <div>
              <p className={styles.addKicker}>Remover da coleção</p>
              <h2 id={tituloId} className={styles.addTitulo}>
                {nome}
              </h2>
              {detalhe && <p className={styles.addMeta}>{detalhe}</p>}
            </div>
          </div>

          <p className={styles.removerTexto}>
            {quantidade > 1
              ? `As ${quantidade} cópias saem da sua coleção`
              : "A carta sai da sua coleção"}
            {temPrecoPago ? ", junto com o preço que você anotou." : "."} Dá pra adicionar de novo depois.
          </p>

          <div className={styles.addAcoes}>
            <button type="button" className={base.buttonOutline} onClick={() => janela.current?.close()}>
              Cancelar
            </button>
            <Confirmar />
          </div>
        </form>
      </dialog>
    </>
  );
}
