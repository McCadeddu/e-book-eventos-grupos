import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerAnoPastoral } from "./ano-pastoral";
import { salvarBackupAutomatico } from "./adminBackup";
import { revalidarEdicaoAnual } from "./revalidacao-anual";

export function validarCadastroAnual(setor: "grupos" | "eventos", body: unknown, criar: boolean) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return { erro: "Dados inválidos." };
    const entrada = body as Record<string, unknown>;
    const ano = lerAnoPastoral(entrada.anoPastoral);
    if (!ano) return { erro: "Informe o ano pastoral válido antes de salvar." };
    const textos = setor === "grupos"
        ? ["nome", "faixa_etaria", "descricao", "objetivo_ano", "convite_final"]
        : ["titulo", "faixa_etaria", "descricao", "objetivo_ano", "convite"];
    const permitidos = new Set(["id", "slug", "anoPastoral", "equipe", "ativo", ...textos,
        ...(setor === "eventos" ? ["grupos_envolvidos", "todos_os_grupos", "visibilidade"] : [])]);
    if (Object.keys(entrada).some(k => !permitidos.has(k))) return { erro: "Campo não permitido no cadastro anual." };
    const dados: Record<string, unknown> = {};
    if (!criar) {
        if (typeof entrada.id !== "string" || !entrada.id || entrada.id.length > 100) return { erro: "ID inválido." };
        dados.id = entrada.id;
    }
    for (const campo of textos) if (entrada[campo] !== undefined) {
        if (typeof entrada[campo] !== "string" || entrada[campo].length > 20000) return { erro: `Texto inválido: ${campo}.` };
        dados[campo] = entrada[campo].trim();
    }
    const nome = setor === "grupos" ? "nome" : "titulo";
    if ((criar || entrada[nome] !== undefined) && !dados[nome]) return { erro: "Informe o nome ou título." };
    if (typeof dados.titulo === "string") dados.titulo = dados.titulo.toUpperCase();
    if (criar && setor === "grupos") {
        dados.slug = String(dados.nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!dados.slug) return { erro: "Não foi possível gerar um slug para esse nome." };
    }
    for (const campo of ["equipe", ...(setor === "eventos" ? ["grupos_envolvidos"] : [])]) {
        if (entrada[campo] === undefined) continue;
        const valor = campo === "equipe" && typeof entrada[campo] === "string"
            ? entrada[campo].split(",") : entrada[campo];
        if (!Array.isArray(valor) || valor.length > 100 || valor.some(v => typeof v !== "string" || v.length > 300)) {
            return { erro: `Lista inválida: ${campo}.` };
        }
        dados[campo] = [...new Set(valor.map(v => v.trim()).filter(Boolean))];
    }
    for (const campo of ["ativo", "todos_os_grupos"]) if (entrada[campo] !== undefined) {
        if (typeof entrada[campo] !== "boolean") return { erro: `Valor inválido: ${campo}.` };
        dados[campo] = entrada[campo];
    }
    if (entrada.visibilidade !== undefined) {
        if (!["publico", "interno"].includes(String(entrada.visibilidade))) return { erro: "Visibilidade inválida." };
        dados.visibilidade = entrada.visibilidade;
    }
    if (dados.todos_os_grupos === true) dados.grupos_envolvidos = [];
    if (!criar && Object.keys(dados).length === 1) return { erro: "Nenhuma alteração informada." };
    return { ano, dados };
}

/** Called only after requireAdminClient. Never falls back to updating the global entity. */
export async function salvarCadastroAnualApi(setor: "grupos" | "eventos", req: NextApiRequest, res: NextApiResponse, client: SupabaseClient) {
    const validado = validarCadastroAnual(setor, req.body, req.method === "POST");
    if (validado.erro || !validado.ano || !validado.dados) return res.status(400).json({ erro: validado.erro });
    const { data, error } = await client.rpc("pascom_salvar_cadastro_anual", {
        p_setor: setor, p_ano: validado.ano, p_dados: validado.dados, p_criar: req.method === "POST",
    });
    if (error) {
        const status = error.code === "23505" ? 409 : error.code === "P0002" ? 404
            : ["22023", "22P02"].includes(error.code) ? 400 : 503;
        return res.status(status).json({ erro: status === 409 ? "Já existe um cadastro com essa identidade."
            : status === 404 ? "Cadastro não encontrado." : status === 400 ? "Confira os dados e o ano informado."
            : "A gravação anual não está disponível. Confira a migração antes de tentar novamente." });
    }
    if (!data?.sucesso) return res.status(503).json({ erro: "O servidor não confirmou a gravação anual." });
    const backup = await salvarBackupAutomatico({ entidade: setor, acao: req.method === "POST" ? "criar" : "editar",
        referenciaId: data.grupo?.id || data.evento?.id });
    const cache = await revalidarEdicaoAnual(res, validado.ano);
    const avisos = [!backup.sucesso ? "O backup automático não foi concluído." : "",
        !cache ? "Algumas páginas públicas aguardam atualização." : ""].filter(Boolean);
    return res.status(200).json({ ...data, ...(avisos.length ? { aviso: `Cadastro salvo. ${avisos.join(" ")}` } : {}) });
}
