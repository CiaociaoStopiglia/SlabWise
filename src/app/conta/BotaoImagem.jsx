// app/conta/BotaoImagem.jsx
// Ícone de câmera no canto da foto/banner: clicar abre o seletor de arquivo e, ao escolher,
// o formulário já é enviado (sem botão "Enviar").
"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import styles from "./conta.module.css";

export default function BotaoImagem({
  tipo,
  acao,
  temImagem,
  rotulo,
  className,
}) {
  const formulario = useRef(null);
  const campo = useRef(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      ref={formulario}
      action={acao}
      className={`${styles.botaoImagem} ${className ?? ""}`}
    >
      <input type="hidden" name="tipo" value={tipo} />
      <input
        ref={campo}
        name="arquivo"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          if (!e.target.files?.length) return;
          setEnviando(true);
          formulario.current.requestSubmit();
        }}
      />
      <button
        type="button"
        disabled={enviando}
        aria-label={`Trocar ${rotulo}`}
        title={`Trocar ${rotulo}`}
        onClick={() => campo.current.click()}
      >
        <Camera size={18} aria-hidden="true" />
      </button>
      {enviando && <span className={styles.enviando}>Enviando…</span>}
    </form>
  );
}
