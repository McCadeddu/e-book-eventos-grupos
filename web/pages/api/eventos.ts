// web/pages/api/eventos.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";
import { randomUUID } from "crypto";

function gerarId() {
    return randomUUID();
}
function normalizarData(valor?: string | null) {
    if (!valor || valor.trim() === "") return null;
    return valor;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
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
            data_inicio,
            data_fim,
            visibilidade,
        } = req.body;

        if (!titulo || !data_inicio) {
            return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
        }

        const evento = {
            id: gerarId(),
            tipo,
            titulo: titulo.toUpperCase(),
            faixa_etaria,
            descricao,
            equipe,
            grupos_envolvidos: todos_os_grupos ? [] : grupos_envolvidos,
            todos_os_grupos: !!todos_os_grupos,
            objetivo_ano,
            convite,
            data_inicio: normalizarData(data_inicio),
            data_fim: normalizarData(data_fim),
            visibilidade: visibilidade || "publico",
        };
        function normalizarData(valor?: string | null) {
            if (!valor || valor.trim() === "") return null;
            return valor;
        }

        const { error } = await supabase
            .from("eventos")
            .insert(evento);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

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

        const dadosAtualizados = {
            ...resto,
            titulo: titulo?.toUpperCase(),
            data_inicio: normalizarData(resto.data_inicio),
            data_fim: normalizarData(resto.data_fim),
            grupos_envolvidos: todos_os_grupos ? [] : grupos_envolvidos,
            todos_os_grupos: !!todos_os_grupos,
        };

        const { error } = await supabase
            .from("eventos")
            .update(dadosAtualizados)
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

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

        await revalidar(res);

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}

/* =====================================================
   REVALIDAÇÃO GLOBAL DO LIVRO
===================================================== */
async function revalidar(res: NextApiResponse) {
    await res.revalidate("/livro");
    await res.revalidate("/livro/calendario");
}