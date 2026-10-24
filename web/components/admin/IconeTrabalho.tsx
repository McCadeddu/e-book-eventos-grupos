import type { ReactNode } from "react";

const desenhos = {
  grupos: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" /></>,
  edicoes: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v18M12 8h4M12 12h4" /></>,
  livro: <><path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1Z" /></>,
  ano: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 11h18M8 15h3M8 18h6" /></>,
  previa: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  pdf: <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 12h8M8 16h5" /></>,
  sair: <><path d="M10 3H3v18h7M8 12h14M18 8l4 4-4 4" /></>,
  producao: <><path d="m4 15-1 6 6-1L21 8l-5-5L4 15ZM13 6l5 5M4 15l5 5" /></>,
  revisao: <><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4V2h6v2M8 13l3 3 5-6" /></>,
} satisfies Record<string, ReactNode>;

/** Decorative: the adjacent text always supplies the accessible link name. */
export default function IconeTrabalho({ nome }: { nome: keyof typeof desenhos }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      {desenhos[nome]}
    </svg>
  );
}
