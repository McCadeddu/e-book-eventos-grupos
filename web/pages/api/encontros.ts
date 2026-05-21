import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { requireAdmin } from "../../lib/adminAuth";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { supabase } from "../../lib/supabaseClient";

function gerarIdEncontro() {
    return randomUUID();
}

function limparUndefined<T extends Record<string, unknown>>(objeto: T) {
    return Object.fromEntries(
        Object.entries(objeto).filter(([, valor]) => valor !== undefined)
    );
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!requireAdmin(req, res)) {
        return;
    }

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
                erro: "Encontro deve pertencer a um grupo OU a um evento (nunca ambos).",
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
            nivel: nivel || "evento",
            mostrar_no_anual:
                nivel === "organizacao" ? false : mostrar_no_anual ?? true,
        };

        const { error } = await supabase.from("encontros").insert(encontro);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "encontros",
            acao: "criar",
            referenciaId: encontro.id,
        });

        await revalidarBasico(res);

        return res.status(200).json({ sucesso: true });
    }

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
                erro: "Encontro deve pertencer a um grupo OU a um evento (nunca ambos).",
            });
        }

        const dadosAtualizados = limparUndefined({
            ...resto,
            grupo_id: grupo_id || null,
            evento_id: evento_id || null,
            data_inicio: data_inicio || undefined,
            data_fim: data_fim === undefined ? undefined : data_fim || null,
            nivel: nivel || undefined,
            mostrar_no_anual:
                nivel === "organizacao" ? false : mostrar_no_anual,
        });

        const { error } = await supabase
            .from("encontros")
            .update(dadosAtualizados)
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "encontros",
            acao: "editar",
            referenciaId: id,
        });

        await revalidarBasico(res);

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

    if (req.method === "DELETE") {
        const { id, grupo_id } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const { error } = await supabase.from("encontros").delete().eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "encontros",
            acao: "excluir",
            referenciaId: id,
        });

        await revalidarBasico(res);

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

async function revalidarBasico(res: NextApiResponse) {
    await res.revalidate("/livro/calendario");
    await res.revalidate("/livro");
}
