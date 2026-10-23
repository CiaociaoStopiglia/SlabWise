// components/CampoDinheiro.jsx
// <input> de valor em real que não aceita letras nem símbolos (só números, ponto e vírgula).
// Serve pros formulários das páginas de servidor (coleção, alerta), que não têm estado:
// o campo se limpa sozinho a cada tecla ou colagem.
"use client";

import { soDinheiro } from "../lib/valores";

export default function CampoDinheiro(props) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      onInput={(e) => {
        const limpo = soDinheiro(e.currentTarget.value);
        if (limpo !== e.currentTarget.value) e.currentTarget.value = limpo;
      }}
    />
  );
}
