// web/pages/api/encontros.ts

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

function caminhoEncontros() {
  return path.join(process.cwd(), "..", "data", "encontros.json");
}

function lerArquivo() {
  const conteudo = fs.readFileSync(caminhoEncontros(), "utf-8");
  return JSON.parse(conteudo);
}

function salvarArquivo(dados: any) {
  fs.writeFileSync(
    caminhoEncontros(),
    JSON.stringify(dados, null, 2),
    "utf-8"
  );
}

function gerarId(grupoId: string, data: string) {
  return `${grupoId}-${data.replace(/\//g, "-")}`;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ===== CRIAR (POST) =====
  if (req.method === "POST") {
    const {
      grupoId,
      tipo,
      dataInicio,
      dataFim,
      titulo,
      horario,
      local,
      visibilidade,
    } = req.body;

    if (!grupoId || !tipo || !dataInicio) {
      return res
        .status(400)
        .json({ erro: "Campos obrigatórios ausentes" });
    }

    const dados = lerArquivo();

    const novoEncontro = {
      id: gerarId(grupoId, dataInicio),
      grupo_id: grupoId,
      data_inicio: dataInicio,
      data_legivel: req.body.dataLegivel || "",
      data_fim: dataFim || null,
      horario: horario || "",
      titulo: titulo || "",
      local: local || "",
      tema: "",
      descricao: "",
      tipo,
      visibilidade: visibilidade || "interno",
    };

    dados.encontros.push(novoEncontro);
    salvarArquivo(dados);

    console.log("📅 Encontro criado:", novoEncontro.id);

    return res.status(200).json({ sucesso: true });
  }

  // ===== EDITAR (PUT) =====
  if (req.method === "PUT") {
    const { id, ...atualizacoes } = req.body;

    if (!id) {
      return res.status(400).json({ erro: "ID ausente" });
    }

    const dados = lerArquivo();
    const indice = dados.encontros.findIndex(
      (e: any) => e.id === id
    );

    if (indice === -1) {
      return res.status(404).json({ erro: "Encontro não encontrado" });
    }

    dados.encontros[indice] = {
      ...dados.encontros[indice],
      ...atualizacoes,
      data_inicio:
        atualizacoes.data_inicio ??
        dados.encontros[indice].data_inicio,
    data_fim:
        atualizacoes.data_fim ??
        dados.encontros[indice].data_fim,
    };


    salvarArquivo(dados);

    console.log("✏️ Encontro editado:", id);

    return res.status(200).json({ sucesso: true });
  }

  // ===== EXCLUIR (DELETE) =====
  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ erro: "ID ausente" });
    }

    const dados = lerArquivo();
    const antes = dados.encontros.length;

    dados.encontros = dados.encontros.filter(
      (e: any) => e.id !== id
    );

    if (dados.encontros.length === antes) {
      return res.status(404).json({ erro: "Encontro não encontrado" });
    }

    salvarArquivo(dados);

    console.log("🗑️ Encontro excluído:", id);

    return res.status(200).json({ sucesso: true });
  }

  return res.status(405).json({ erro: "Método não permitido" });
}