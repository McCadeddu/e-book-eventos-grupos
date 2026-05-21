// web/pages/api/eventos.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../lib/adminAuth";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { supabase } from "../../lib/supabaseClient";
import { randomUUID } from "crypto";

function gerarId() {
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


    /* =====================================================
       CRIAR EVENTO
    ===================================================== */
    if (req.method === "POST") {

        const {
            tipo,
            titulo,
            faixa_etaria,
            descricao,
            equipe,
            grupos_envolvidos,
            todos_os_grupos,
            objetivo_ano,
            convite,
            visibilidade,
        } = req.body;

        if (!titulo) {
            return res.status(400).json({ erro: "Título é obrigatório" });
        }

        const evento = {
            id: gerarId(),
            tipo,
            titulo: titulo.toUpperCase(),
            faixa_etaria,
            descricao,
            equipe,
            grupos_envolvidos: todos_os_grupos
                ? []
                : Array.isArray(grupos_envolvidos)
                    ? grupos_envolvidos
                    : grupos_envolvidos
                        ? [grupos_envolvidos]
                        : [],
            todos_os_grupos: !!todos_os_grupos,
            objetivo_ano,
            convite,
            visibilidade: visibilidade || "publico",
        };

        const { error } = await supabase
            .from("eventos")
            .insert(evento);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "eventos",
            acao: "criar",
            referenciaId: evento.id,
        });

        await revalidar(res);

        return res.status(200).json({ sucesso: true });
    }

    /* =====================================================
       EDITAR EVENTO
    ===================================================== */
    if (req.method === "PUT") {

        const {
            id,
            titulo,
            grupos_envolvidos,
            todos_os_grupos,
            ...resto
        } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const dadosAtualizados = limparUndefined({
            ...resto,
            titulo: titulo ? titulo.toUpperCase() : undefined,
            grupos_envolvidos: todos_os_grupos
                ? []
                : Array.isArray(grupos_envolvidos)
                    ? grupos_envolvidos
                    : grupos_envolvidos
                        ? [grupos_envolvidos]
                        : undefined,
            todos_os_grupos:
                typeof todos_os_grupos === "boolean"
                    ? todos_os_grupos
                    : undefined,
        });

        const { error } = await supabase
            .from("eventos")
            .update(dadosAtualizados)
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "eventos",
            acao: "editar",
            referenciaId: id,
        });

        await revalidar(res);

        return res.status(200).json({ sucesso: true });
    }

    /* =====================================================
       EXCLUIR EVENTO
    ===================================================== */
    if (req.method === "DELETE") {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const { error } = await supabase
            .from("eventos")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "eventos",
            acao: "excluir",
            referenciaId: id,
        });

        await revalidar(res);

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}

/* =====================================================
   REVALIDAÇÃO
===================================================== */
async function revalidar(res: NextApiResponse) {
    await res.revalidate("/livro");
    await res.revalidate("/livro/calendario");
}
