// web/lib/organizarPorGrupo.ts

import { Evento } from "./eventos";

export function organizarEventosPorGrupo(eventos: Evento[]) {
  const organizados: Record<string, Evento[]> = {};

  eventos.forEach((evento) => {
    const grupo = evento.grupo_relacionado || "Outros";

    if (!organizados[grupo]) {
      organizados[grupo] = [];
    }

    organizados[grupo].push(evento);
  });

  return organizados;
}