// components/CartaBrilhante.jsx
// Efeito de carta holográfica: a carta inclina em 3D seguindo o mouse, um reflexo de luz
// acompanha o cursor e uma película de arco-íris aparece por cima.
// Quanto mais a carta vale, mais forte o brilho. Assim o valor aparece sem precisar ler o número:
//   nível 0 (até R$ 300)      → só inclina
//   nível 1 (R$ 300+)         → reflexo suave
//   nível 2 (R$ 1.500+)       → holográfico + um brilho que passa sozinho de vez em quando
//   nível 3 (R$ 5.000+)       → holográfico forte + brilho dourado em volta
// O movimento é feito mudando variáveis CSS direto no elemento (sem re-renderizar o React).
"use client";

import { useRef } from "react";
import styles from "./CartaBrilhante.module.css";

export function nivelDeBrilho(valor) {
  if (!Number.isFinite(valor)) return 0;
  if (valor >= 5000) return 3;
  if (valor >= 1500) return 2;
  if (valor >= 300) return 1;
  return 0;
}

// Quantos graus a carta inclina no máximo, por nível
const INCLINACAO = [6, 8, 11, 14];

/**
 * valor: preço em reais (decide o nível do brilho)
 * inclinar: false quando algo em volta já inclina (ex.: o slab da home)
 * className: classe da caixa de fora (margens, sombra)
 */
export default function CartaBrilhante({ valor, inclinar = true, className = "", children }) {
  const ref = useRef(null);
  const quadro = useRef(0);
  const nivel = nivelDeBrilho(valor);

  function mover(e) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const caixa = el.getBoundingClientRect();
    const x = (e.clientX - caixa.left) / caixa.width; // 0 = esquerda, 1 = direita
    const y = (e.clientY - caixa.top) / caixa.height; // 0 = topo, 1 = base
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const graus = inclinar && !parado ? INCLINACAO[nivel] : 0;

    // Um quadro por vez: o navegador desenha no ritmo da tela, sem engasgar
    cancelAnimationFrame(quadro.current);
    quadro.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--rx", `${((0.5 - y) * graus * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * graus * 2).toFixed(2)}deg`);
      el.style.setProperty("--ativo", "1");
    });
  }

  function sair() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(quadro.current);
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--ativo", "0");
  }

  return (
    <div
      ref={ref}
      className={`${styles.carta} ${className}`}
      data-nivel={nivel}
      onPointerMove={mover}
      onPointerLeave={sair}
    >
      <div className={styles.miolo}>
        {children}
        {nivel > 0 && (
          <>
            <span className={styles.holo} aria-hidden="true" />
            <span className={styles.reflexo} aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
