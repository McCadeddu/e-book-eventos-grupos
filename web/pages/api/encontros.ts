// web/pages/api/encontros.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

function gerarIdEncontro(grupoId: string, dataInicio: string) {
    return `${grupoId}-${dataInicio}`;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // ===== CRIAR =====
    if (req.method === "POST") {
        const {
            grupoId,
            tipo,
            dataInicio,
            dataFim,
            dataLegivel,
            titulo,
            horario,
            local,
            visibilidade,
        } = req.body;

        if (!grupoId || !dataInicio || !tipo) {
            return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
        }

        const encontro = {
            id: gerarIdEncontro(grupoId, dataInicio),
            grupo_id: grupoId,
            tipo,
            data_inicio: dataInicio,
            data_fim: dataFim || null,
            data_legivel: dataLegivel || null,
            titulo: titulo || null,
            horario: horario || null,
            local: local || null,
            visibilidade: visibilidade || "interno",
        };

        const { error } = await supabase
            .from("encontros")
            .insert(encontro);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await res.revalidate("/livro/calendario");

        return res.status(200).json({ sucesso: true });
    }

    // ===== EDITAR =====
    if (req.method === "PUT") {
        const { id, ...atualizacoes } = req.body;

        const { error } = await supabase
            .from("encontros")
            .update(atualizacoes)
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        // 🔁 revalidação
        await res.revalidate("/livro/calendario");
        if (atualizacoes.grupo_id) {
            await res.revalidate(`/livro/${atualizacoes.grupo_id}`);
        }

        return res.status(200).json({ sucesso: true });
    }

    // ===== EXCLUIR =====
    if (req.method === "DELETE") {
        const { id, grupo_id } = req.body;

        const { error } = await supabase
            .from("encontros")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        // 🔁 revalidação
        await res.revalidate("/livro/calendario");
        if (grupo_id) {
            await res.revalidate(`/livro/${grupo_id}`);
        }

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}