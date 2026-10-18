// app/busca/page.jsx
// A busca agora vive em /precos. Esta rota só mantém os links antigos funcionando.
import { redirect } from "next/navigation";

export default async function Busca({ searchParams }) {
  const params = new URLSearchParams(await searchParams);
  const resto = params.toString();
  redirect(resto ? `/precos?${resto}` : "/precos");
}
