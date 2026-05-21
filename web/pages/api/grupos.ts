// web/pages/api/grupos.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../lib/adminAuth";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { supabase } from "../../lib/supabaseClient";
import { randomUUID } from "crypto";

function gerarSlug(nome: string) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizarEquipe(valor: unknown) {
    if (Array.isArray(valor)) {
        return valor
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof valor === "string") {
        return valor
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!requireAdmin(req, res)) {
        return;
    }

    // ===== CRIAR GRUPO =====
    if (req.method === "POST") {
        const {
            nome,
            faixa_etaria,
            descricao,
            objetivo_ano,
            equipe,
            convite_final,
        } = req.body;

        if (!nome || typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({ erro: "Nome do grupo é obrigatório" });
        }

        const slugBase = gerarSlug(nome);

        if (!slugBase) {
            return res.status(400).json({ erro: "Não foi possível gerar um slug válido" });
        }

        const { data: slugExistente, error: erroSlug } = await supabase
            .from("grupos")
            .select("id")
            .eq("slug", slugBase)
            .maybeSingle();

        if (erroSlug) {
            console.error(erroSlug);
            return res.status(500).json({ erro: erroSlug.message });
        }

        if (slugExistente) {
            return res.status(409).json({
                erro: "Já existe um grupo com este nome. Ajuste o nome antes de salvar.",
            });
        }

        const { data: ultimoGrupo, error: erroUltimoGrupo } = await supabase
            .from("grupos")
            .select("ordem")
            .order("ordem", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (erroUltimoGrupo) {
            console.error(erroUltimoGrupo);
            return res.status(500).json({ erro: erroUltimoGrupo.message });
        }

        const grupo = {
            id: randomUUID(),
            slug: slugBase,
            nome: nome.trim(),
            faixa_etaria:
                typeof faixa_etaria === "string" ? faixa_etaria.trim() : "",
            descricao: typeof descricao === "string" ? descricao.trim() : "",
            objetivo_ano:
                typeof objetivo_ano === "string" ? objetivo_ano.trim() : "",
            equipe: normalizarEquipe(equipe),
            convite_final:
                typeof convite_final === "string" ? convite_final.trim() : "",
            ordem: (ultimoGrupo?.ordem ?? 0) + 1,
        };

        const { error } = await supabase.from("grupos").insert(grupo);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "grupos",
            acao: "criar",
            referenciaId: grupo.id,
        });

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");
        await res.revalidate(`/livro/${grupo.slug}`);
        await res.revalidate("/admin/grupos");

        return res.status(200).json({
            sucesso: true,
            grupo: {
                id: grupo.id,
                slug: grupo.slug,
                nome: grupo.nome,
            },
        });
    }

    // ===== EDITAR GRUPO =====
    if (req.method === "PUT") {
        const {
            id,
            slug,
            nome,
            faixa_etaria,
            descricao,
            objetivo_ano,
            equipe,
            convite_final,
        } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const { error } = await supabase
            .from("grupos")
            .update({
                slug,
                nome,
                faixa_etaria,
                descricao,
                objetivo_ano,
                equipe: normalizarEquipe(equipe),
                convite_final,
            })
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "grupos",
            acao: "editar",
            referenciaId: id,
        });

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");
        await res.revalidate("/admin/grupos");

        return res.status(200).json({ sucesso: true });
    }

    // ===== EXCLUIR GRUPO =====
    if (req.method === "DELETE") {
        const { grupoId } = req.body;

        if (!grupoId) {
            return res.status(400).json({ erro: "grupoId ausente" });
        }

        const { error: erroEncontros } = await supabase
            .from("encontros")
            .delete()
            .eq("grupo_id", grupoId);

        if (erroEncontros) {
            return res.status(500).json({ erro: erroEncontros.message });
        }

        const { error: erroGrupo } = await supabase
            .from("grupos")
            .delete()
            .eq("id", grupoId);

        if (erroGrupo) {
            return res.status(500).json({ erro: erroGrupo.message });
        }

        await salvarBackupAutomatico({
            entidade: "grupos",
            acao: "excluir",
            referenciaId: grupoId,
        });

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");
        await res.revalidate("/admin/grupos");

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}
