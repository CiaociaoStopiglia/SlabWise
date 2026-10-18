// src/app/entrar/FormularioConta.jsx
"use client";

import { useActionState, useState } from "react";
import { cadastrar, entrar } from "./actions";
import styles from "./entrar.module.css";

export default function FormularioConta({ modo, voltar }) {
  const cadastro = modo === "cadastro";
  const [estado, enviar, enviando] = useActionState(cadastro ? cadastrar : entrar, null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const v = estado?.valores ?? {};

  return (
    <form action={enviar} className={styles.form} noValidate>
      <input type="hidden" name="voltar" value={voltar} />

      {estado?.erro && (
        <p className={styles.error} role="alert">
          {estado.erro}
        </p>
      )}

      {cadastro && (
        <div className={styles.field}>
          <label htmlFor="nome">Como podemos te chamar</label>
          <input id="nome" name="nome" type="text" autoComplete="given-name" defaultValue={v.nome} required />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={v.email}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="senha">Senha</label>
        <div className={styles.password}>
          <input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete={cadastro ? "new-password" : "current-password"}
            minLength={cadastro ? 8 : undefined}
            required
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setMostrarSenha((m) => !m)}
            aria-pressed={mostrarSenha}
          >
            {mostrarSenha ? "Esconder" : "Mostrar"}
          </button>
        </div>
        {cadastro && <p className={styles.help}>Pelo menos 8 caracteres.</p>}
      </div>

      <button type="submit" className={styles.submit} disabled={enviando}>
        {enviando ? (cadastro ? "Criando conta…" : "Entrando…") : cadastro ? "Criar conta grátis" : "Entrar"}
      </button>
    </form>
  );
}
