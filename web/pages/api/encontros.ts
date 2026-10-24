import { revalidarEdicaoAnual } from "../../lib/revalidacao-anual";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { requireAdminClient } from "../../lib/adminApi";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { dataDoAnoPastoral, erroDatasDoAno } from "../../lib/ano-pastoral";
import { validarPedidoEncontro } from "../../lib/validacao-encontros";

export const config = { maxDuration: 60 };

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

    if (!["POST", "PUT", "DELETE"].includes(req.method || "")) {
        res.setHeader("Allow", "POST, PUT, DELETE");
        return res.status(405).json({ erro: "Método não permitido" });
    }
    const validado = validarPedidoEncontro(req.method!, req.body);
    if (validado.erro || !validado.ano || !validado.dados) return res.status(400).json({ erro: validado.erro });
    const anoPastoral = validado.ano;
    const dadosRecebidos = validado.dados;
    const { data: edicao, error: erroEdicao } = await supabase.from("ebook_edicoes")
        .select("ano").eq("ano", anoPastoral).maybeSingle();
    if (erroEdicao) return res.status(503).json({ erro: "Não foi possível conferir a edição anual. Tente novamente mais tarde." });
    if (!edicao) return res.status(400).json({ erro: "O ano pastoral informado não está configurado." });

    let atual: { data_inicio: string; data_fim?: string | null; nivel?: string | null } | null = null;
    if (req.method !== "POST") {
        const { data, error } = await supabase.from("encontros")
            .select("data_inicio, data_fim, nivel").eq("id", dadosRecebidos.id).maybeSingle();
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

    if (req.method === "POST") {
        const {
            grupoId,
            tipo,
            dataInicio,
            dataFim,
            dataLegivel,
            titulo,
            descricao,
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
            descricao: descricao || null,
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

        return concluirAlteracao(res, anoPastoral, "criar", encontro.id);
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
                (nivel || atual?.nivel) === "organizacao" ? false : mostrar_no_anual,
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

        return concluirAlteracao(res, anoPastoral, "editar", String(id));
    }

    if (req.method === "DELETE") {
        const { id } = dadosRecebidos;

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

        return concluirAlteracao(res, anoPastoral, "excluir", String(id));
    }

    return res.status(405).json({ erro: "Método não permitido" });
}

async function concluirAlteracao(res: NextApiResponse, ano: number, acao: "criar" | "editar" | "excluir", referenciaId: string) {
    const backup = await salvarBackupAutomatico({ entidade: "encontros", acao, referenciaId });
    const cache = await revalidarEdicaoAnual(res, ano);
    const avisos = [!backup.sucesso ? "O backup automático não foi concluído." : "",
        !cache ? "Algumas páginas públicas aguardam atualização." : ""].filter(Boolean);
    return res.status(200).json({ sucesso: true,
        ...(avisos.length ? { aviso: `Alteração salva. ${avisos.join(" ")}` } : {}) });
}
