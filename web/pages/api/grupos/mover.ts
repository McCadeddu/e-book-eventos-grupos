// web/pages/api/grupos/mover.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Método não permitido" });
    }

    const { grupoId, direcao } = req.body as {
        grupoId: string;
        direcao: "cima" | "baixo";
    };

    const { data: grupos, error } = await supabase
        .from("grupos")
        .select("id, ordem")
        .order("ordem", { ascending: true });

    if (error || !grupos) {
        return res.status(500).json({ erro: "Erro ao carregar grupos" });
    }

    const index = grupos.findIndex((g) => g.id === grupoId);
    if (index === -1) {
        return res.status(404).json({ erro: "Grupo não encontrado" });
    }

    const alvoIndex =
        direcao === "cima" ? index - 1 : index + 1;

    if (alvoIndex < 0 || alvoIndex >= grupos.length) {
        return res.status(200).json({ sucesso: true }); // nada a fazer
    }

    const grupoAtual = grupos[index];
    const grupoAlvo = grupos[alvoIndex];

    // troca as ordens
    await supabase.from("grupos").update({ ordem: grupoAlvo.ordem }).eq("id", grupoAtual.id);
    await supabase.from("grupos").update({ ordem: grupoAtual.ordem }).eq("id", grupoAlvo.id);

    return res.status(200).json({ sucesso: true });
}
