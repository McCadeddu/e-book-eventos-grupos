import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../lib/adminAuth";
import { carregarEdicoesEbook, EbookConfig } from "../../lib/ebook-config";
import { supabase } from "../../lib/supabaseClient";

function respostaInfraPendente(res: NextApiResponse, detalhe?: string) {
    return res.status(503).json({
        erro:
            "A base online das edicoes do e-book ainda nao foi criada no Supabase. Execute o SQL de configuracao primeiro.",
        detalhe,
    });
}

async function revalidarBasico(res: NextApiResponse, anos: number[]) {
    const unicos = Array.from(new Set(anos));

    await res.revalidate("/livro");
    await res.revalidate("/livro/calendario");
    await res.revalidate("/admin/preview");

    for (const ano of unicos) {
        await res.revalidate(`/livro/edicao/${ano}`);
        await res.revalidate(`/livro/edicao/${ano}/calendario`);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!requireAdmin(req, res)) {
        return;
    }

    if (req.method === "GET") {
        const colecao = await carregarEdicoesEbook();
        return res.status(200).json(colecao);
    }

    if (req.method === "POST") {
        const ano = Number(req.body?.ano);
        const anoBase = Number(req.body?.anoBase || 0);

        if (!Number.isInteger(ano) || ano < 2020) {
            return res.status(400).json({ erro: "Ano invalido." });
        }

        const colecao = await carregarEdicoesEbook();
        const existente = colecao.edicoes.find((edicao) => edicao.ano === ano);
        if (existente) {
            return res.status(409).json({ erro: "Esse ano ja esta cadastrado." });
        }

        const base =
            colecao.edicoes.find((edicao) => edicao.ano === anoBase) ??
            colecao.edicoes[colecao.edicoes.length - 1];

        if (!base) {
            return res.status(400).json({ erro: "Nao existe uma edicao base para copiar." });
        }

        const novaEdicao: EbookConfig = {
            ...base,
            ano,
        };

        const { error: erroInsert } = await supabase.from("ebook_edicoes").insert({
            ano: novaEdicao.ano,
            titulo: novaEdicao.titulo,
            subtitulo: novaEdicao.subtitulo,
            botao_texto: novaEdicao.botao_texto,
            capas: novaEdicao.capas,
            logo: novaEdicao.logo,
        });

        if (erroInsert) {
            return respostaInfraPendente(res, erroInsert.message);
        }

        const { error: erroEstado } = await supabase.from("ebook_estado").upsert(
            {
                id: "principal",
                ano_publicado: colecao.anoPublicado,
                ano_em_preparacao: ano,
            },
            { onConflict: "id" }
        );

        if (erroEstado) {
            return respostaInfraPendente(res, erroEstado.message);
        }

        await revalidarBasico(res, [ano, colecao.anoPublicado]);
        return res.status(200).json({ sucesso: true, ano });
    }

    if (req.method === "PUT") {
        const anoPublicado = req.body?.anoPublicado
            ? Number(req.body.anoPublicado)
            : undefined;
        const anoEmPreparacao = req.body?.anoEmPreparacao
            ? Number(req.body.anoEmPreparacao)
            : undefined;

        if (
            anoPublicado !== undefined &&
            (!Number.isInteger(anoPublicado) || anoPublicado < 2020)
        ) {
            return res.status(400).json({ erro: "Ano publicado invalido." });
        }

        if (
            anoEmPreparacao !== undefined &&
            (!Number.isInteger(anoEmPreparacao) || anoEmPreparacao < 2020)
        ) {
            return res.status(400).json({ erro: "Ano em preparacao invalido." });
        }

        const colecao = await carregarEdicoesEbook();
        const payload = {
            id: "principal",
            ano_publicado: anoPublicado ?? colecao.anoPublicado,
            ano_em_preparacao: anoEmPreparacao ?? colecao.anoEmPreparacao,
        };

        const { error } = await supabase
            .from("ebook_estado")
            .upsert(payload, { onConflict: "id" });

        if (error) {
            return respostaInfraPendente(res, error.message);
        }

        await revalidarBasico(res, [payload.ano_publicado, payload.ano_em_preparacao]);
        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Metodo nao permitido." });
}
