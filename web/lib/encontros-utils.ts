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