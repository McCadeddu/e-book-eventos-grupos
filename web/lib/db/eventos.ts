// web/lib/db/eventos.ts

import { supabase } from "../supabaseClient";

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