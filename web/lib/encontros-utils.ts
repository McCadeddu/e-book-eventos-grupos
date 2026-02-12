// web/lib/encontros-utils.ts

export type Encontro = {
  id: string;
  grupo_id: string;
  data_inicio: string;
  data_fim?: string | null;
  data_legivel?: string;
  horario?: string;
  titulo?: string;
  descricao?: string;
  local?: string;
  tipo: "encontro_regular" | "evento_especial";
  visibilidade: "interno" | "publico";
};

export function ordenarEncontrosPorData(
  encontros: Encontro[]
): Encontro[] {
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
