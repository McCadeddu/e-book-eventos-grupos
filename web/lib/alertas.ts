// web/lib/alertas.ts

import type { Encontro } from "./encontros-utils";
import { dataDoAnoPastoral } from "./ano-pastoral";

type DadosParaRevisao = {
  data_inicio?: string | null;
  data_fim?: string | null;
  horario?: string | null;
  local?: string | null;
};

/** Editorial guidance only: optional display dates and visibility are not missing data. */
export function pendenciasDoEncontro(encontro: DadosParaRevisao) {
  const avisos: string[] = [];
  const inicio = encontro.data_inicio;
  const inicioValido = Boolean(inicio && dataDoAnoPastoral(inicio, Number(inicio.slice(0,4))));
  if (!inicio?.trim()) avisos.push("Data ausente");
  else if (!inicioValido) avisos.push("Data de início inválida");
  if (encontro.data_fim) {
    if (!dataDoAnoPastoral(encontro.data_fim, Number(encontro.data_fim.slice(0,4)))) avisos.push("Data de término inválida");
    else if (inicioValido && encontro.data_fim < inicio!) avisos.push("Término anterior ao início");
  }
  if (!encontro.local?.trim()) avisos.push("Local ausente");
  if (!encontro.horario?.trim()) avisos.push("Horário ausente");
  return avisos;
}

export function alertasDoEncontro(encontro: Encontro) {
  const alertas = pendenciasDoEncontro(encontro);

  if (encontro.visibilidade === "interno") {
    alertas.push("Não publicado");
  }

  return alertas;
}
