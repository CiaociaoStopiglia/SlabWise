// components/AvisoToast.jsx
// Mostra os avisos das ações (salvar, remover, erro...) como toast no canto da tela.
// As Server Actions voltam pra página com ?ok=... ou ?erro=... no endereço;
// aqui a gente lê, mostra o toast e limpa o endereço (pra não repetir ao recarregar).
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function AvisoToast() {
  const params = useSearchParams();
  const caminho = usePathname();
  const router = useRouter();
  const ultimo = useRef("");

  useEffect(() => {
    const ok = params.get("ok");
    const erro = params.get("erro");
    if (!ok && !erro) return;

    // Em desenvolvimento o React roda o efeito duas vezes; isso evita toast repetido
    const chave = `${caminho}|${ok}|${erro}`;
    if (ultimo.current !== chave) {
      ultimo.current = chave;
      if (erro) toast.error(erro, { id: `erro-${erro}` });
      else toast.success(ok, { id: `ok-${ok}` });
    }

    const resto = new URLSearchParams(params);
    resto.delete("ok");
    resto.delete("erro");
    const busca = resto.toString();
    router.replace(`${caminho}${busca ? `?${busca}` : ""}${window.location.hash}`, { scroll: false });
  }, [params, caminho, router]);

  return null;
}
