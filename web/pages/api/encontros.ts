// web/pages/api/encontros.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";
import { randomUUID } from "crypto";

/**
 * Gera um ID estável e independente da data
 */
function gerarIdEncontro() {
    return randomUUID();
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
            id: gerarIdEncontro(),
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

        // 🔁 revalidação
        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");

        // revalida a página do grupo (slug)
        const { data: grupo } = await supabase
            .from("grupos")
            .select("slug")
            .eq("id", grupoId)
            .single();

        if (grupo?.slug) {
            await res.revalidate(`/livro/${grupo.slug}`);
        }

        return res.status(200).json({ sucesso: true });
    }

    // ===== EDITAR =====
    if (req.method === "PUT") {
        const {
            id,
            data_inicio,
            data_fim,
            grupo_id,
            ...resto
        } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        // normalização dos campos
        const dadosAtualizados = {
            ...resto,
            ...(data_inicio !== undefined && { data_inicio }),
            ...(data_fim !== undefined && { data_fim }),
        };

        const { error } = await supabase
            .from("encontros")
            .update(dadosAtualizados)
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        // 🔁 revalidação
        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");

        if (grupo_id) {
            const { data: grupo } = await supabase
                .from("grupos")
                .select("slug")
                .eq("id", grupo_id)
                .single();

            if (grupo?.slug) {
                await res.revalidate(`/livro/${grupo.slug}`);
            }
        }

        return res.status(200).json({ sucesso: true });
    }

    // ===== EXCLUIR =====
    if (req.method === "DELETE") {
        const { id, grupo_id } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

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
        await res.revalidate("/livro");

        if (grupo_id) {
            const { data: grupo } = await supabase
                .from("grupos")
                .select("slug")
                .eq("id", grupo_id)
                .single();

            if (grupo?.slug) {
                await res.revalidate(`/livro/${grupo.slug}`);
            }
        }

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}
