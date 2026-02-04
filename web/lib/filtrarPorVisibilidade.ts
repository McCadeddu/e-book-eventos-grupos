// web/lib/filtrarPorVisibilidade.ts

import { Evento } from "./eventos";

export function filtrarEventosPublicos(eventos: Evento[]) {
  return eventos.filter((evento) => evento.visibilidade === "publico");
}

export function filtrarEventosInternos(eventos: Evento[]) {
  return eventos.filter((evento) => evento.visibilidade === "interno");
}
