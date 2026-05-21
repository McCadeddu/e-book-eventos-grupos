// web/lib/db/grupos.ts

import { supabase } from "../supabaseClient";
import { Grupo } from "../types";
import fs from "fs";
import path from "path";

function criarErroDeConsulta(contexto: string, detalhes: unknown) {
    const texto =
        detalhes instanceof Error
            ? detalhes.message
            : JSON.stringify(detalhes);

    return new Error(`${contexto}: ${texto}`);
}

function lerGruposFallback(): Grupo[] {
    const caminho = path.join(
        process.cwd(),
        "..",
        "data",
        "grupos(nãousado).json"
    );
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return (dados.grupos ?? []).map((grupo: Grupo, index: number) => ({
        ...grupo,
        ordem: grupo.ordem ?? index + 1,
        equipe: Array.isArray(grupo.equipe) ? grupo.equipe : [],
    }));
}

/**
 * Retorna todos os grupos ordenados pela coluna "ordem"
 */
export async function getGruposOrdenados(): Promise<Grupo[]> {
    try {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar grupos", error);
        }

        const grupos = (data ?? []) as Grupo[];

        if (grupos.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar grupos",
                "nenhum grupo retornado"
            );
        }

        return grupos;
    } catch (error) {
        console.warn(
            "Usando fallback local para grupos administrativos:",
            error instanceof Error ? error.message : error
        );
        return lerGruposFallback();
    }
}

export async function getGruposOrdenadosStrict(): Promise<Grupo[]> {
    try {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar grupos públicos", error);
        }

        const grupos = (data ?? []) as Grupo[];

        if (grupos.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar grupos públicos",
                "nenhum grupo retornado"
            );
        }

        return grupos;
    } catch (error) {
        console.warn(
            "Usando fallback local para grupos públicos:",
            error instanceof Error ? error.message : error
        );
        return lerGruposFallback();
    }
}

/**
 * Retorna um grupo pelo slug
 */
export async function getGrupoPorSlug(
    slug: string
): Promise<Grupo | null> {
    try {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            throw criarErroDeConsulta(
                `Erro ao buscar grupo pelo slug ${slug}`,
                error
            );
        }

        return (data as Grupo) ?? null;
    } catch (error) {
        console.warn(
            `Usando fallback local para grupo administrativo ${slug}:`,
            error instanceof Error ? error.message : error
        );
        return (
            lerGruposFallback().find((grupo) => grupo.slug === slug) ?? null
        );
    }
}

export async function getGrupoPorSlugStrict(
    slug: string
): Promise<Grupo | null> {
    try {
        const { data, error } = await supabase
            .from("grupos")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            throw criarErroDeConsulta(
                `Erro ao buscar grupo público pelo slug ${slug}`,
                error
            );
        }

        return (data as Grupo) ?? null;
    } catch (error) {
        console.warn(
            `Usando fallback local para grupo público ${slug}:`,
            error instanceof Error ? error.message : error
        );
        return (
            lerGruposFallback().find((grupo) => grupo.slug === slug) ?? null
        );
    }
}
