"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CartaBrilhante from "../CartaBrilhante";

// Carrossel de cartas (Embla) com microinteração nos cards (Motion).
export default function CardCarousel({ cartas, styles }) {
  const [ref, embla] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselViewport} ref={ref}>
        <ul className={styles.carouselTrack}>
          {cartas.map((c, i) => (
            <li key={c.id} className={styles.carouselSlide} style={{ "--i": i }}>
              <motion.div
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.97 }}
                style={{ height: "100%" }}
              >
                <Link
                  href={`/carta/${encodeURIComponent(c.id)}`}
                  className={styles.cardTile}
                >
                  <CartaBrilhante valor={c.valor} className={styles.cardTileImage}>
                    <Image
                      src={c.imagem}
                      alt={`Carta ${c.name} · ${c.set} ${c.number}`}
                      width={245}
                      height={337}
                      draggable={false}
                      className={styles.cardTileImage}
                    />
                  </CartaBrilhante>
                  <strong>{c.name}</strong>
                  <span className={styles.tileSet}>
                    {c.set} · {c.number}
                  </span>
                  <span className={styles.tilePrice}>{c.preco}</span>
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.carouselControls}>
        <button
          type="button"
          aria-label="Cartas anteriores"
          onClick={() => embla?.scrollPrev()}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Próximas cartas"
          onClick={() => embla?.scrollNext()}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
