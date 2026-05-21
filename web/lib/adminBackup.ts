import { randomUUID } from "crypto";
import { supabase } from "./supabaseClient";

type EntidadeBackup = "grupos" | "eventos" | "encontros";
type AcaoBackup = "criar" | "editar" | "excluir";

type BackupMetadata = {
    entidade: EntidadeBackup;
    acao: AcaoBackup;
    referenciaId?: string | null;
};

async function carregarSnapshotAtual() {
    const [gruposResp, eventosResp, encontrosResp] = await Promise.all([
        supabase.from("grupos").select("*").order("ordem", { ascending: true }),
        supabase.from("eventos").select("*").order("ordem", { ascending: true }),
        supabase
            .from("encontros")
            .select("*")
            .order("data_inicio", { ascending: true }),
    ]);

    if (gruposResp.error) throw gruposResp.error;
    if (eventosResp.error) throw eventosResp.error;
    if (encontrosResp.error) throw encontrosResp.error;

    return {
        grupos: gruposResp.data ?? [],
        eventos: eventosResp.data ?? [],
        encontros: encontrosResp.data ?? [],
    };
}

export async function salvarBackupAutomatico(metadata: BackupMetadata) {
    try {
        const snapshot = await carregarSnapshotAtual();

        const payload = {
            id: randomUUID(),
            origem: "admin-online",
            entidade: metadata.entidade,
            acao: metadata.acao,
            referencia_id: metadata.referenciaId ?? null,
            resumo: {
                total_grupos: snapshot.grupos.length,
                total_eventos: snapshot.eventos.length,
                total_encontros: snapshot.encontros.length,
            },
            payload: snapshot,
        };

        const { error } = await supabase.from("admin_backups").insert(payload);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.warn(
            "Nao foi possivel salvar o backup automatico:",
            error instanceof Error ? error.message : error
        );
    }
}
