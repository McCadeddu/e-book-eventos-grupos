// web\lib\eventos.ts

import fs from "fs";
import path from "path";

export type Evento = {
  id: string;
  titulo: string;
  tipo: string;
  categoria_principal: string;
  grupo_relacionado?: string;
  data: string;        // dd/mm/aaaa
  horario?: string;    // texto livre
  local: string;
  tema?: string;
  descricao?: string;
  observacoes?: string;
  visibilidade: "publico" | "interno";
  responsaveis?: string[];
  campos_personalizados?: Record<string, string>;
};

export function lerEventos(): Evento[] {
  const caminho = path.join(process.cwd(), "..", "data", "eventos-2026.json");
  const conteudo = fs.readFileSync(caminho, "utf-8");
  const dados = JSON.parse(conteudo);
  return dados.eventos;
}