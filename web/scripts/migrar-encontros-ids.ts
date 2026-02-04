// web/scripts/migrar-encontros-ids.ts

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const caminho = path.join(process.cwd(), "..", "data", "encontros.json");

type Encontro = {
  id: string;
  grupo_id: string;
  data_inicio?: string | null;
  data_fim?: string | null;
  data_legivel?: string;
  horario?: string;
  titulo?: string;
  local?: string;
  tipo?: string;
  visibilidade?: string;
  [key: string]: any;
};

function migrar() {
  const bruto = fs.readFileSync(caminho, "utf-8");
  const dados = JSON.parse(bruto);

  const encontros: Encontro[] = dados.encontros;

  const novosEncontros = encontros.map((e) => {
    return {
      ...e,
      id: randomUUID(),            // 🔥 NOVO ID ÚNICO
      data_inicio: e.data_inicio || null,
      data_fim: e.data_fim || null,
      data_legivel: e.data_legivel || "",
    };
  });

  fs.writeFileSync(
    caminho,
    JSON.stringify({ encontros: novosEncontros }, null, 2),
    "utf-8"
  );

  console.log("✅ Migração concluída:");
  console.log(`   ${encontros.length} encontros migrados`);
}

migrar();
