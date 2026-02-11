// web/lib/grupos.ts

import fs from "fs";
import path from "path";

export type EncontroGrupo = {
  data: string;
  tema?: string;
  periodo?: boolean;
};

export type Grupo = {
    id: string;
    slug: string;
    nome: string;
    faixa_etaria: string;
    descricao: string;
    objetivo_ano: string;
    equipe: string[];
    convite_final: string;
    encontros: EncontroGrupo[];

    // 🔹 controle editorial
    ordem: number;
    categoria?: "grupo" | "evento";
};

export function lerGrupos(): Grupo[] {
  const caminho = path.join(process.cwd(), "..", "data", "grupos.json");
  const conteudo = fs.readFileSync(caminho, "utf-8");
  const dados = JSON.parse(conteudo);

  return dados.grupos;
}

export function lerGrupoPorSlug(slug: string): Grupo | undefined {
  const grupos = lerGrupos();
  return grupos.find((grupo) => grupo.slug === slug);
}