// web/lib/alertas.ts

import { Encontro } from "./encontros-utils";

export function alertasDoEncontro(encontro: Encontro) {
  const alertas: string[] = [];

  if (!encontro.data_inicio) {
    alertas.push("Data ausente");
  }

  if (
    encontro.tipo === "evento_especial" &&
    !encontro.data_legivel
  ) {
    alertas.push("Data legível ausente");
  }

  if (!encontro.local) {
    alertas.push("Local ausente");
  }

  if (!encontro.horario) {
    alertas.push("Horário ausente");
  }

  if (encontro.visibilidade === "interno") {
    alertas.push("Não publicado");
  }

  return alertas;
}
