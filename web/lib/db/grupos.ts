// web/lib/db/grupos.ts

import { supabase } from "../supabaseClient";
import { Grupo } from "../types";

/**
 * Retorna todos os grupos ordenados pela coluna "ordem"
 */
export async function getGruposOrdenados(): Promise<Grupo[]> {
    const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .order("ordem", { ascending: true });

    if (error) {
        console.error("Erro ao buscar grupos:", error);
        return [];
    }

    return data as Grupo[];
}

/**
 * Retorna um grupo pelo slug
 */
export async function getGrupoPorSlug(
    slug: string
): Promise<Grupo | null> {
    const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        console.error("Erro ao buscar grupo por slug:", error);
        return null;
    }

    return data as Grupo;
}
