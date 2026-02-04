// web\lib\organizarPorMes.ts

import { Evento } from "./eventos";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export function organizarEventosPorMes(eventos: Evento[]) {
  const organizados: Record<string, Evento[]> = {};

  eventos.forEach((evento) => {
    const partes = evento.data.split("/");
    const mesNumero = parseInt(partes[1], 10) - 1;
    const nomeMes = meses[mesNumero];

    if (!organizados[nomeMes]) {
      organizados[nomeMes] = [];
    }

    organizados[nomeMes].push(evento);
  });

  return organizados;
}
