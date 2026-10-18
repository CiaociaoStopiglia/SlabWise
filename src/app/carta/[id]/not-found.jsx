import Link from "next/link";

export default function CartaNaoEncontrada() {
  return (
    <main style={{ padding: "96px 16px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1>Não encontramos essa carta</h1>
      <p>Ela pode ter saído da base ou o endereço está errado.</p>
      <Link href="/precos">Buscar outra carta →</Link>
    </main>
  );
}
