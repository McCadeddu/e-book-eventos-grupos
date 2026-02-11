// web/lib/db/encontros.ts
import { supabase } from "../supabaseClient";
import { Encontro } from "../types";

export async function getEncontros(): Promise<Encontro[]> {
    const { data, error } = await supabase
        .from("encontros")
        .select("*");

    if (error) {
        console.error("Erro ao buscar encontros:", error);
        return [];
    }

    return data as Encontro[];
}

export async function getEncontrosPorGrupo(
    grupoId: string
): Promise<Encontro[]> {
    const { data, error } = await supabase
        .from("encontros")
        .select("*")
        .eq("grupo_id", grupoId);

    if (error) {
        console.error("Erro ao buscar encontros do grupo:", error);
        return [];
    }

    return data as Encontro[];
}
