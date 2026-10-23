import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { requireAdminClient } from "../../lib/adminApi";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { lerAnoPastoral, dataDoAnoPastoral, erroDatasDoAno } from "../../lib/ano-pastoral";

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
    const supabase = requireAdminClient(req, res);
    if (!supabase) {
        return;
    }

    const { anoPastoral: anoInformado, ...dadosRecebidos } = req.body || {};
    const anoPastoral = lerAnoPastoral(anoInformado);
    if (anoInformado !== undefined && !anoPastoral) {
        return res.status(400).json({ erro: "Ano pastoral inválido." });
    }

    if (anoPastoral && ["POST", "PUT", "DELETE"].includes(req.method || "")) {
        let atual: { data_inicio: string; data_fim?: string | null } | null = null;
        if (req.method !== "POST") {
            if (!dadosRecebidos.id) return res.status(400).json({ erro: "ID ausente" });
            const { data, error } = await supabase.from("encontros")
                .select("data_inicio, data_fim").eq("id", dadosRecebidos.id).maybeSingle();
            if (error) return res.status(500).json({ erro: "Não foi possível conferir o ano do encontro." });
            if (!data) return res.status(404).json({ erro: "Encontro não encontrado." });
            atual = data;
            if (!dataDoAnoPastoral(data.data_inicio, anoPastoral)) {
                return res.status(409).json({ erro: "Este encontro pertence a outro ano. Recarregue a agenda antes de alterar." });
            }
        }
        if (req.method !== "DELETE") {
            const inicio = req.method === "POST" ? dadosRecebidos.dataInicio : dadosRecebidos.data_inicio ?? atual?.data_inicio;
            const fim = req.method === "POST" ? dadosRecebidos.dataFim : dadosRecebidos.data_fim === undefined ? atual?.data_fim : dadosRecebidos.data_fim;
            const erro = erroDatasDoAno(inicio, fim, anoPastoral);
            if (erro) return res.status(400).json({ erro });
        }
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
        } = dadosRecebidos;

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

        await revalidarBasico(res, anoPastoral);

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
        } = dadosRecebidos;

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

        let atualizacao = supabase
            .from("encontros")
            .update(dadosAtualizados, { count: "exact" })
            .eq("id", id);
        if (anoPastoral) atualizacao = atualizacao
            .gte("data_inicio", `${anoPastoral}-01-01`).lt("data_inicio", `${anoPastoral + 1}-01-01`);
        const { error, count } = await atualizacao;

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        if (anoPastoral && count === 0) {
            return res.status(409).json({ erro: "O encontro mudou. Recarregue a agenda antes de alterar." });
        }

        await salvarBackupAutomatico({
            entidade: "encontros",
            acao: "editar",
            referenciaId: id,
        });

        await revalidarBasico(res, anoPastoral);

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
        const { id, grupo_id } = dadosRecebidos;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        let exclusao = supabase.from("encontros").delete({ count: "exact" }).eq("id", id);
        if (anoPastoral) exclusao = exclusao
            .gte("data_inicio", `${anoPastoral}-01-01`).lt("data_inicio", `${anoPastoral + 1}-01-01`);
        const { error, count } = await exclusao;

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        if (anoPastoral && count === 0) {
            return res.status(409).json({ erro: "O encontro mudou. Recarregue a agenda antes de excluir." });
        }

        await salvarBackupAutomatico({
            entidade: "encontros",
            acao: "excluir",
            referenciaId: id,
        });

        await revalidarBasico(res, anoPastoral);

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

async function revalidarBasico(res: NextApiResponse, anoPastoral: number | null) {
    await res.revalidate("/livro/calendario");
    await res.revalidate("/livro");
    if (anoPastoral) await res.revalidate(`/livro/edicao/${anoPastoral}/calendario`);
}
