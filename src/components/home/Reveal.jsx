"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Anima os filhos diretos (ou os elementos [data-reveal]) quando entram na tela.
export default function Reveal({
  children,
  className,
  stagger = 0.12,
  y = 40,
  as: Tag = "div",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const el = ref.current;
    const alvos = el.querySelectorAll("[data-reveal]");
    const ctx = gsap.context(() => {
      gsap.from(alvos.length ? alvos : el.children, {
        opacity: 0,
        y,
        duration: 0.9,
        ease: "power3.out",
        stagger,
        clearProps: "all",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, y]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
