// web/lib/db/encontros.ts
import { supabase } from "../supabaseClient";
import { Encontro } from "../types";

export async function getEncontros() {
    const { data, error } = await supabase
        .from("encontros")
        .select("*")
        .not("data_inicio", "is", null)   // 👈 ESSENCIAL
        .order("data_inicio", { ascending: true });

    if (error) {
        console.error(error);
        return [];
    }

    return data || [];
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
