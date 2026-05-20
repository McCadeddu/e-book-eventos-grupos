// web/lib/db/eventos.ts

import { supabase } from "../supabaseClient";

function criarErroDeConsulta(contexto: string, detalhes: unknown) {
    const texto =
        detalhes instanceof Error
            ? detalhes.message
            : JSON.stringify(detalhes);

    return new Error(`${contexto}: ${texto}`);
}

export async function getEventos() {
    const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .order("ordem", { ascending: true });

    if (error) {
        console.error(error);
        return [];
    }

    return data || [];
}

export async function getEventosStrict() {
    try {
        const { data, error } = await supabase
            .from("eventos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar eventos públicos", error);
        }

        return data || [];
    } catch (error) {
        console.warn(
            "Usando fallback vazio para eventos públicos:",
            error instanceof Error ? error.message : error
        );
        return [];
    }
}
