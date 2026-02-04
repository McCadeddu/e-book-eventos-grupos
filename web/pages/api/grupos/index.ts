// web/pages/api/grupos/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Grupo = {
  id: string;
  slug: string;
  nome: string;
  faixa_etaria: string;
  descricao: string;
  objetivo_ano: string;
  equipe: string[];
  convite_final: string;
};

const caminho = path.join(process.cwd(), "..", "data", "grupos.json");

function lerGrupos(): Grupo[] {
  const dados = JSON.parse(fs.readFileSync(caminho, "utf-8"));
  return dados.grupos || [];
}

function salvarGrupos(grupos: Grupo[]) {
  fs.writeFileSync(
    caminho,
    JSON.stringify({ grupos }, null, 2),
    "utf-8"
  );
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /* =========================
     CRIAR GRUPO
  ========================= */
  if (req.method === "POST") {
    const {
      nome,
      faixa_etaria,
      faixaEtaria,
      descricao,
      objetivo_ano,
      objetivoAno,
      equipe,
      convite_final,
      conviteFinal,
    } = req.body;

    if (!nome) {
      return res.status(400).json({
        sucesso: false,
        erro: "Nome do grupo é obrigatório",
      });
    }

    const grupos = lerGrupos();

    const slug = gerarSlug(nome);

    // 🔒 impede duplicação
    if (grupos.some((g) => g.slug === slug)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Já existe um grupo com este nome",
      });
    }

    const novoGrupo: Grupo = {
      id: slug,
      slug,
      nome,
      faixa_etaria: faixa_etaria || faixaEtaria || "",
      descricao: descricao || "",
      objetivo_ano: objetivo_ano || objetivoAno || "",
      equipe:
        typeof equipe === "string"
          ? equipe.split(",").map((e: string) => e.trim())
          : Array.isArray(equipe)
          ? equipe
          : [],
      convite_final: convite_final || conviteFinal || "",
    };

    grupos.push(novoGrupo);
    salvarGrupos(grupos);

    return res.status(200).json({
      sucesso: true,
      grupo: novoGrupo,
    });
  }

  /* =========================
     EDITAR GRUPO
  ========================= */
  if (req.method === "PUT") {
    const grupoAtualizado = req.body;
    const grupos = lerGrupos();

    const index = grupos.findIndex(
      (g) => g.id === grupoAtualizado.id
    );

    if (index === -1) {
      return res.status(404).json({
        sucesso: false,
        erro: "Grupo não encontrado",
      });
    }

    grupos[index] = {
      ...grupos[index],
      ...grupoAtualizado,
      id: grupos[index].id,
      slug: grupos[index].slug, // 🔒 nunca muda
    };

    salvarGrupos(grupos);

    return res.status(200).json({ sucesso: true });
  }

  /* =========================
     EXCLUIR GRUPO
  ========================= */
  if (req.method === "DELETE") {
    const { grupoId } = req.body;

    const grupos = lerGrupos();
    const filtrados = grupos.filter((g) => g.id !== grupoId);

    salvarGrupos(filtrados);

    return res.status(200).json({ sucesso: true });
  }

  return res.status(405).json({
    sucesso: false,
    erro: "Método não permitido",
  });
}
