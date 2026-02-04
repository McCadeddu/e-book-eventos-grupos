// web/lib/encontros.ts

import fs from "fs";
import path from "path";
import { Encontro } from "./encontros-utils";

export function lerEncontros(): Encontro[] {
  const caminho = path.join(
    process.cwd(),
    "..",
    "data",
    "encontros.json"
  );

  const conteudo = fs.readFileSync(caminho, "utf-8");
  const dados = JSON.parse(conteudo);

  return dados.encontros;
}

export function lerEncontrosPorGrupo(
  grupoId: string
): Encontro[] {
  return lerEncontros().filter(
    (e) => e.grupo_id === grupoId
  );
}
