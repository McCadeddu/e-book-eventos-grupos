// web/lib/encontros-utils.ts

import type { Encontro } from "./types";
export type { Encontro } from "./types";

export function ordenarEncontrosPorData<T extends Encontro>(
  encontros: T[]
): T[] {
  return encontros
    .filter((e) => typeof e.data_inicio === "string" && e.data_inicio !== "")
    .slice()
    .sort((a, b) =>
      a.data_inicio.localeCompare(b.data_inicio)
    );
}

export function formatarDataIntervalo(
    dataInicio: string,
    dataFim?: string | null
): string {
    if (!dataInicio) return "";

    const [anoI, mesI, diaI] = dataInicio.split("-").map(Number);

    if (!dataFim) {
        return `${diaI.toString().padStart(2, "0")}/${mesI
            .toString()
            .padStart(2, "0")}/${anoI}`;
    }

    const [anoF, mesF, diaF] = dataFim.split("-").map(Number);

    // Mesmo mês
    if (anoI === anoF && mesI === mesF) {
        return `${diaI}–${diaF}/${mesI.toString().padStart(2, "0")}/${anoI}`;
    }

    // Meses diferentes
    return `${diaI}/${mesI.toString().padStart(2, "0")} a ${diaF}/${mesF
        .toString()
        .padStart(2, "0")}/${anoI}`;
}
