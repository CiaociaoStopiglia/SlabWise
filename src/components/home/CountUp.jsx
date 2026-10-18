"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

// Conta de 0 até o valor quando aparece na tela (Anime.js).
export default function CountUp({ value, prefix = "", className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const fmt = (n) => `${prefix}${Math.round(n).toLocaleString("pt-BR")}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let anim;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const obj = { n: 0 };
        anim = animate(obj, {
          n: value,
          duration: 1600,
          ease: "outExpo",
          onUpdate: () => {
            el.textContent = fmt(obj.n);
          },
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      anim?.pause();
    };
  }, [value, prefix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${value.toLocaleString("pt-BR")}`}
    </span>
  );
}
