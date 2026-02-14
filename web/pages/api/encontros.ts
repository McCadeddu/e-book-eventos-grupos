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
            evento_id,
            nivel,
            mostrar_no_anual,
        } = req.body;

        if (!tipo || !dataInicio) {
            return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
        }

        if ((grupoId && evento_id) || (!grupoId && !evento_id)) {
            return res.status(400).json({
                erro: "Encontro deve pertencer a um grupo OU a um evento (nunca ambos)."
            });
        }

        const encontro = {
            id: gerarIdEncontro(),
            grupo_id: grupoId || null,
            evento_id: evento_id || null,
            tipo,
            data_inicio: dataInicio,
            data_fim: dataFim || null,
            data_legivel: dataLegivel || null,
            titulo: titulo || null,
            horario: horario || null,
            local: local || null,
            visibilidade: visibilidade || "interno",

            // 🔵 NOVOS CAMPOS
            nivel: nivel || "evento",
            mostrar_no_anual:
                nivel === "organizacao"
                    ? false
                    : mostrar_no_anual ?? true,
        };

        const { error } = await supabase
            .from("encontros")
            .insert(encontro);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");

        return res.status(200).json({ sucesso: true });
    }

    // ===== EDITAR =====
    if (req.method === "PUT") {
        const {
            id,
            data_inicio,
            data_fim,
            grupo_id,
            evento_id,
            nivel,
            mostrar_no_anual,
            ...resto
        } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        if ((grupo_id && evento_id) || (!grupo_id && !evento_id)) {
            return res.status(400).json({
                erro: "Encontro deve pertencer a um grupo OU a um evento (nunca ambos)."
            });
        }

        // normalização dos campos
        const dadosAtualizados = {
            ...resto,
            grupo_id: grupo_id || null,
            evento_id: evento_id || null,
            data_inicio,
            data_fim: data_fim || null,
            nivel: nivel || "evento",
            mostrar_no_anual:
                nivel === "organizacao"
                    ? false
                    : mostrar_no_anual ?? true,
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